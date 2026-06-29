// scripts/check-model-sizes.mjs
// Guard rail (CLAUDE.md §10 "performance is a feature"): warn loudly if any 3D
// model under public/models exceeds the budget, so an oversized asset (e.g. a
// raw multi-MB Tripo/AI export) can't ship silently.
//
// Warn-only by default so in-progress development against a heavy draft still
// builds. Set STRICT_MODEL_SIZE=1 (e.g. in CI) to fail the build instead.

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIR = "public/models";
const LIMIT_MB = 3;
const strict = process.env.STRICT_MODEL_SIZE === "1";

const MODEL_RE = /\.(glb|gltf)$/i;

let oversized = [];
try {
  for (const name of readdirSync(DIR)) {
    if (!MODEL_RE.test(name)) continue;
    const mb = statSync(join(DIR, name)).size / 1048576;
    if (mb > LIMIT_MB) oversized.push({ name, mb });
  }
} catch {
  // no public/models dir yet — nothing to check
  process.exit(0);
}

if (oversized.length === 0) process.exit(0);

const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const tint = strict ? red : yellow;

console.log(
  tint(
    "\n┌─────────────────────────────────────────────────────────────┐\n" +
      "│  OVERSIZED 3D MODEL(S) in public/models — perf budget §10     │\n" +
      "└─────────────────────────────────────────────────────────────┘",
  ),
);
for (const { name, mb } of oversized) {
  console.log(tint(`  • ${name} — ${mb.toFixed(1)} MB  (limit ${LIMIT_MB} MB)`));
}
console.log(
  tint(
    "  Compress before deploy: simplify/decimate + Draco/meshopt + KTX2/1K\n" +
      "  textures (gltf.report or @gltf-transform/cli), target < " +
      LIMIT_MB +
      " MB.\n",
  ),
);

if (strict) {
  console.log(red("  STRICT_MODEL_SIZE=1 → failing the build.\n"));
  process.exit(1);
}
process.exit(0);
