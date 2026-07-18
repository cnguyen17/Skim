// scripts/sync-gallery.mjs
// Build-time gallery sync (see .cursor/plans / README "Updating gallery photos").
//
// Pulls set photos from a Google Drive folder, optimizes them to WebP with sharp,
// writes them into public/images/gallery/drive/, and regenerates the manifest
// src/data/gallery.generated.ts (the single source the site reads via site.config).
//
// Drive is the source of truth WHEN credentials are configured. With no creds
// (e.g. local dev) the script skips gracefully and leaves the committed manifest
// untouched, so `npm run dev` / a credential-less build still work.
//
// Auth (either one):
//   GOOGLE_SERVICE_ACCOUNT_JSON  raw JSON or base64 of a service-account key.
//                                Share the Drive folder (read-only) with the
//                                service account email. Folder can stay private.
//   GOOGLE_API_KEY               a Google API key. Requires the folder to be
//                                shared "anyone with the link can view".
//
// Config:
//   DRIVE_FOLDER_ID  the Drive folder id (defaults to the folder skim provided).

import { google } from "googleapis";
import sharp from "sharp";
import heicConvert from "heic-convert";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_FOLDER_ID = "19GlEdbPxCmU6ktLdwqom63J_Qkd1zPj7";
const FOLDER_ID = process.env.DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID;

const OUT_DIR = "public/images/gallery/drive";
const PUBLIC_PREFIX = "/images/gallery/drive";
const MANIFEST_PATH = "src/data/gallery.generated.ts";
const MAX_EDGE = 1600; // px — plenty for full-screen lightbox, browser downscales thumbs
const WEBP_QUALITY = 80;
const IMAGE_MIME_RE = /^image\/(jpeg|jpg|png|webp|tiff|gif|heic|heif|avif)$/i;

const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;

function getAuth() {
  const rawSa = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (rawSa && rawSa.trim()) {
    let jsonText = rawSa.trim();
    // Allow base64-encoded JSON (easier to paste into env-var UIs).
    if (!jsonText.startsWith("{")) {
      jsonText = Buffer.from(jsonText, "base64").toString("utf8");
    }
    const credentials = JSON.parse(jsonText);
    return {
      mode: "service-account",
      auth: new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      }),
    };
  }
  const apiKey = process.env.GOOGLE_API_KEY;
  if (apiKey && apiKey.trim()) {
    return { mode: "api-key", auth: apiKey.trim() };
  }
  return null;
}

function slugify(name) {
  return (
    name
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, "") // strip extension
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "photo"
  );
}

// Camera filenames are UUIDs/IMG_1234 — useless as alt text. Base alt on the
// set/event (the Drive subfolder name) instead, so it's clean and meaningful.
function altForSet(set) {
  if (!set || set === "sets") return "skim live set";
  return `skim — ${set.replace(/-/g, " ")}`;
}

const listParams = {
  fields: "nextPageToken, files(id, name, mimeType, createdTime, modifiedTime)",
  pageSize: 200,
  includeItemsFromAllDrives: true,
  supportsAllDrives: true,
  orderBy: "createdTime desc",
};

async function listFolder(drive, folderId, apiKey) {
  const files = [];
  let pageToken;
  do {
    const res = await drive.files.list({
      ...listParams,
      q: `'${folderId}' in parents and trashed = false`,
      pageToken,
      ...(apiKey ? { key: apiKey } : {}),
    });
    files.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);
  return files;
}

async function collectPhotos(drive, apiKey) {
  // Root files -> set "sets". One level of subfolders -> set = folder slug.
  const root = await listFolder(drive, FOLDER_ID, apiKey);
  const collected = [];
  const subfolders = [];
  for (const f of root) {
    if (f.mimeType === "application/vnd.google-apps.folder") {
      subfolders.push(f);
    } else if (IMAGE_MIME_RE.test(f.mimeType || "")) {
      collected.push({ file: f, set: "sets" });
    }
  }
  for (const folder of subfolders) {
    const kids = await listFolder(drive, folder.id, apiKey);
    const set = slugify(folder.name) || "sets";
    for (const f of kids) {
      if (IMAGE_MIME_RE.test(f.mimeType || "")) collected.push({ file: f, set });
    }
  }
  return collected;
}

async function toWebp(raw) {
  return sharp(raw)
    .rotate() // honor EXIF orientation
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

// Try sharp first (handles jpeg/png/webp/tiff and many HEICs, and rescues files
// with a wrong extension). sharp's bundled libheif rejects some iPhone HEICs
// (Live Photos trip its reference-count security limit), so on failure fall back
// to heic-convert (wasm libheif) to decode to JPEG, then let sharp encode.
async function encodeImage(raw) {
  try {
    return await toWebp(raw);
  } catch (sharpErr) {
    try {
      const jpeg = await heicConvert({ buffer: raw, format: "JPEG", quality: 0.92 });
      return await toWebp(Buffer.from(jpeg));
    } catch {
      throw sharpErr; // surface the original decode error for the skip log
    }
  }
}

async function downloadBuffer(drive, fileId, apiKey) {
  const res = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true, ...(apiKey ? { key: apiKey } : {}) },
    { responseType: "arraybuffer" },
  );
  return Buffer.from(res.data);
}

function writeManifest(photos) {
  const header =
    "// AUTO-GENERATED by scripts/sync-gallery.mjs — do not edit by hand.\n" +
    "// Source: Google Drive folder, synced at build time. Regenerate with\n" +
    "// `npm run sync:gallery` (requires Drive credentials) or on each deploy.\n\n" +
    "export type GalleryPhoto = { src: string; set: string; alt: string };\n\n" +
    "export const galleryPhotos: GalleryPhoto[] = ";
  const body = JSON.stringify(photos, null, 2);
  writeFileSync(MANIFEST_PATH, `${header}${body};\n`, "utf8");
}

async function main() {
  const authInfo = getAuth();
  if (!authInfo) {
    console.log(
      yellow(
        "\n[sync-gallery] No Drive credentials found (GOOGLE_SERVICE_ACCOUNT_JSON " +
          "or GOOGLE_API_KEY). Skipping — keeping the committed gallery manifest.\n",
      ),
    );
    process.exit(0);
  }

  const apiKey = authInfo.mode === "api-key" ? authInfo.auth : undefined;
  const drive = google.drive({ version: "v3", auth: authInfo.auth });

  console.log(
    cyan(`\n[sync-gallery] Auth: ${authInfo.mode} · folder: ${FOLDER_ID}`),
  );

  let entries;
  try {
    entries = await collectPhotos(drive, apiKey);
  } catch (err) {
    console.log(
      red(`[sync-gallery] Failed to list Drive folder: ${err.message}`),
    );
    console.log(
      yellow("[sync-gallery] Keeping the committed manifest and continuing.\n"),
    );
    process.exit(0);
  }

  if (entries.length === 0) {
    console.log(
      yellow(
        "[sync-gallery] Drive folder has no images (or none shared). " +
          "Keeping the committed manifest.\n",
      ),
    );
    process.exit(0);
  }

  // Fresh output dir so removed Drive photos disappear from the site.
  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const photos = [];
  const seen = new Set();
  let ok = 0;
  let failed = 0;

  for (const { file, set } of entries) {
    try {
      const raw = await downloadBuffer(drive, file.id, apiKey);
      const out = await encodeImage(raw);

      let filename = `${slugify(file.name)}-${file.id.slice(0, 8)}.webp`;
      while (seen.has(filename)) filename = `${slugify(file.name)}-${file.id.slice(0, 12)}.webp`;
      seen.add(filename);

      writeFileSync(join(OUT_DIR, filename), out);
      photos.push({ src: `${PUBLIC_PREFIX}/${filename}`, set, alt: altForSet(set) });
      ok += 1;
    } catch (err) {
      failed += 1;
      console.log(yellow(`[sync-gallery]   skipped ${file.name}: ${err.message}`));
    }
  }

  if (photos.length === 0) {
    console.log(
      red("[sync-gallery] Every download failed — keeping committed manifest.\n"),
    );
    // Restore an empty dir marker; do not overwrite manifest with nothing.
    process.exit(0);
  }

  writeManifest(photos);
  console.log(
    cyan(
      `[sync-gallery] Wrote ${ok} photo(s) to ${OUT_DIR} and ${MANIFEST_PATH}` +
        (failed ? ` (${failed} skipped)` : "") +
        ".\n",
    ),
  );
}

main().catch((err) => {
  console.log(red(`[sync-gallery] Unexpected error: ${err.stack || err.message}`));
  // Non-fatal: never block a deploy over the gallery sync.
  process.exit(0);
});
