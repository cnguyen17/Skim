// src/components/BioCartonCanvas.tsx
// The production <Canvas> for the Bio bear+carton scene. Kept in its own module so
// three.js / R3F / drei are code-split and only fetched when Bio mounts this (§10),
// and lazy-mounted by BioCarton only while the section is near the viewport.
//
// Brand colors come from the CSS tokens (§3). No OrbitControls here — the camera
// is fixed; the only motion is the bear's idle float + clamped cursor-tilt.

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { BearMilkScene, CAMERA } from "../three/BearMilkScene";

function token(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export default function BioCartonCanvas({
  reducedMotion = false,
}: {
  reducedMotion?: boolean;
}) {
  const milk = useMemo(() => token("--milk", "#F7F2E8"), []);

  return (
    <Canvas
      dpr={[1, 2]}
      shadows
      // fixed framing (see CAMERA in BearMilkScene) — sized to fit the whole bear
      camera={{ position: [0, CAMERA.y, CAMERA.z], fov: CAMERA.fov }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      className="!absolute inset-0"
    >
      <Suspense fallback={null}>
        <BearMilkScene milk={milk} reducedMotion={reducedMotion} />
      </Suspense>
    </Canvas>
  );
}
