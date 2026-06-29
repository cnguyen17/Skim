// One-off: compress the raw Tripo bear+carton export into a deployable GLB.
//
// The raw export is ~1.9M triangles fused into a single mesh with heavy UV
// fragmentation, so a single meshopt simplify pass floors out at ~294k tris
// (it hits the per-pass error budget against all the seam "borders"). Iterative
// simplification resets the error budget each pass and ratchets the mesh down to
// our target. Then 1K WebP textures + EXT_meshopt_compression on the geometry.
//
// Usage: node scripts/compress-model.mjs [in.glb] [out.glb] [targetTris]
import { NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression } from '@gltf-transform/extensions';
import { weld, simplify, dedup, prune, textureCompress } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';

// Raw Tripo source lives outside public/ (it's 60MB — must not deploy).
const IN = process.argv[2] ?? 'models-source/cartoon+bear+3d+model.glb';
const OUT = process.argv[3] ?? 'public/models/bear-carton.glb';
const TARGET_TRIS = Number(process.argv[4] ?? 110_000);
const PASS_ERROR = Number(process.argv[5] ?? 0.04);

await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;

const io = new NodeIO()
  .registerExtensions([EXTMeshoptCompression])
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder });

const doc = await io.read(IN);
const prim = () => doc.getRoot().listMeshes()[0].listPrimitives()[0];
const tris = () => (prim().getIndices().getCount() / 3) | 0;

await doc.transform(dedup(), weld());
console.log('start:', tris(), 'tris');

// Ratchet down: halve each pass (error budget resets), stop at target or stall.
for (let i = 0; i < 12 && tris() > TARGET_TRIS; i++) {
  const before = tris();
  await doc.transform(
    simplify({ simplifier: MeshoptSimplifier, ratio: 0.5, error: PASS_ERROR, lockBorder: false }),
  );
  console.log(`pass ${i + 1}:`, tris(), 'tris');
  if (before - tris() < before * 0.02) break; // stalled
}

await doc.transform(
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024] }),
  prune(),
);

doc
  .createExtension(EXTMeshoptCompression)
  .setRequired(true)
  .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });

await io.write(OUT, doc);
console.log('wrote', OUT, '—', tris(), 'tris');
