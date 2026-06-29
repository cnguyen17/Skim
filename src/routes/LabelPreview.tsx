// src/routes/LabelPreview.tsx
// TEMPORARY (Part A verification) — maps the Nutrition-Facts CanvasTexture onto a
// single PlaneGeometry so we can confirm it's sharp and correctly oriented (not
// mirrored / upside down) BEFORE any bear/scene work. Delete this route + file
// once Part A is confirmed.

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useLabelTexture } from "../three/useLabelTexture";

function LabelPlane({ onStatus }: { onStatus: (s: string) => void }) {
  const tex = useLabelTexture();
  if (!tex) return null; // mount the mesh only once the map exists, so USE_MAP compiles in
  const img = tex.image as HTMLCanvasElement;
  const aspect = img.width / img.height; // keep the card's real proportions
  const h = 3;
  onStatus(`ready ${img.width}x${img.height}px (aspect ${aspect.toFixed(3)})`);
  return (
    <mesh>
      <planeGeometry args={[h * aspect, h]} />
      {/* key on the texture so the material is (re)created WITH the map present */}
      <meshBasicMaterial key={tex.uuid} map={tex} toneMapped={false} />
    </mesh>
  );
}

export default function LabelPreview() {
  const [status, setStatus] = useState("capturing…");
  return <LabelPreviewInner status={status} setStatus={setStatus} />;
}

function LabelPreviewInner({
  status,
  setStatus,
}: {
  status: string;
  setStatus: (s: string) => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0F0E0C" }}>
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 16,
          zIndex: 1,
          font: '12px "JetBrains Mono", monospace',
          color: "#58D7FF",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        Part A preview · label texture · {status}
      </div>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 45 }}>
        <Suspense fallback={null}>
          <LabelPlane onStatus={setStatus} />
        </Suspense>
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}
