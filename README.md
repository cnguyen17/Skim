# skim — DJ / producer portfolio

A fast, 3D-animated, mouse-reactive portfolio for the DJ/producer **skim**.
Vite + React + TypeScript, no backend — everything is static or an external
embed. See [CLAUDE.md](./CLAUDE.md) for the full brief (source of truth).

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-checks (tsc -b) + production build → dist/
npm run preview  # serve the production build locally
```

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · GSAP + ScrollTrigger · Lenis
(smooth scroll) · React Three Fiber + drei (3D hero) · react-router-dom ·
lite-youtube-embed · Spotify iframe · Cal.com embed · Web3Forms.

## Where to edit

Two single sources of truth (never hardcode in components):

- **Content & links** → [`src/data/site.config.ts`](./src/data/site.config.ts)
- **Colors & fonts** → [`src/styles/tokens.css`](./src/styles/tokens.css)
  (rebrand = edit this file; swap the display face via `--font-display`)

### Owner TODOs (fill in `site.config.ts`)

- `booking.calcomUser` — your [Cal.com](https://cal.com) username (free).
  Until set, the booking page shows a setup notice instead of the embed.
- `booking.web3formsKey` — your [Web3Forms](https://web3forms.com) access key
  (free). Until set, the contact form shows a "not configured" notice.
- `sets[].title` / `producing[].title` — replace the `TODO` titles.
- `gallery` — now auto-synced from Google Drive; see "Updating gallery photos"
  below. No hand-editing needed.
- Brand art: drop `public/bear.svg` (3D hero centerpiece — currently the
  wordmark stands in) and `public/signature.svg` (the scroll signature uses a
  placeholder vector until then). The hero centerpiece is a swappable layer, so
  these drop in without touching scene logic.

## Updating gallery photos (Google Drive sync)

The "From the sets" gallery is synced from a **Google Drive folder** — no code
edits, no redeploys by hand. skim just uploads; the site pulls the photos,
optimizes them to WebP, and self-hosts them on Cloudflare's CDN.

**Day-to-day (skim):**

1. Drop photos into the Drive folder. (Optional: put them in a named subfolder —
   the subfolder name becomes the photo's `set` tag for future filtering.)
2. They appear on the site automatically within the refresh window (the Worker
   below runs every 6h). Want it now? Open the Worker URL (or click "Retry
   deployment" in the Cloudflare Pages dashboard).

**How it works:** `scripts/sync-gallery.mjs` runs during `npm run build`
(so on every Cloudflare Pages deploy). It lists the Drive folder, downloads +
compresses each image with `sharp`, writes them to
`public/images/gallery/drive/`, and regenerates
[`src/data/gallery.generated.ts`](./src/data/gallery.generated.ts) (which
`site.config.ts` reads). With no credentials (local dev), it skips and keeps the
committed manifest, so `npm run dev` still works.

**One-time setup (all free):**

1. **Google side** — create a Google Cloud project, enable the **Drive API**, and
   create a **service account** with a JSON key. Share the Drive gallery folder
   (read-only) with the service account's email. (Alternative: skip the service
   account, make the folder "anyone with the link", and use a Drive **API key**.)
2. **Cloudflare Pages env vars** (Settings → Environment variables):
   - `DRIVE_FOLDER_ID` — the folder id (from its URL).
   - `GOOGLE_SERVICE_ACCOUNT_JSON` — the key JSON (or its base64), **or**
     `GOOGLE_API_KEY` — a Drive API key.
3. **Auto-refresh Worker** — deploy the cron trigger that nudges Pages to rebuild:
   ```bash
   cd worker/refresh-gallery
   npx wrangler deploy
   npx wrangler secret put DEPLOY_HOOK_URL   # paste the Pages deploy-hook URL
   ```
   Create the deploy-hook URL in Cloudflare Pages → Settings → Builds &
   deployments → Deploy hooks. Adjust the schedule in
   [`worker/refresh-gallery/wrangler.toml`](./worker/refresh-gallery/wrangler.toml).

**Cost:** nothing here is metered at this scale — Workers free tier is 100k
requests/day (this fires a few times a day), Pages gives 500 builds/month and
unlimited bandwidth, and Drive API reads are free.

## Deploy — Cloudflare Pages (free)

**Git (recommended):** push to GitHub → Cloudflare dashboard → Workers & Pages →
Create → Pages → Connect to Git → pick the repo. Framework preset **Vite**,
build command `npm run build`, output dir `dist`. Every push auto-deploys; PRs
get preview URLs. `public/_redirects` provides the SPA fallback for client
routing. Add a custom domain in the project settings (free SSL).

**CLI (alt):** `npm i -D wrangler && npm run build && npx wrangler pages deploy dist`

## Accessibility & performance

Responsive to 360px, keyboard-focusable with visible focus, focus-trapped menu
and lightbox, real `prefers-reduced-motion` fallbacks (Lenis off, 3D frozen to a
static wordmark, reveals instant). three.js is code-split into a lazy, Home-only
chunk; route-level splitting; all video/audio/scheduler embeds load lazily.
# Skim
