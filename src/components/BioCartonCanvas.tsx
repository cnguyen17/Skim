// src/components/BioCartonCanvas.tsx
// The production <Canvas> for the Bio bear+carton scene. Kept in its own module so
// three.js / R3F / drei are code-split and only fetched when Bio mounts this (§10),
// and lazy-mounted by BioCarton only while the section is near the viewport.
//
// Brand colors come from the CSS tokens (§3). No OrbitControls here — the camera
// is fixed; the only motion is the bear's idle float + clamped cursor-tilt.

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { BearMilkScene, CAMERA } from "../three/BearMilkScene";
import { BEAR_URL } from "../three/bearAssets";

// Ensure meshopt decode starts as soon as this chunk evaluates (Home idle
// import + Bio mount both hit this path).
useGLTF.preload(BEAR_URL);

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
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(true);

  // Keep the WebGL context alive (no remount / re-decode) but pause the
  // render loop once the bio stage scrolls far offscreen.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "200px 0px 200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <Canvas
        dpr={[1, 1.75]}
        shadows
        frameloop={visible ? "always" : "never"}
        // fixed framing (see CAMERA in BearMilkScene) — sized to fit the whole bear
        camera={{ position: [0, CAMERA.y, CAMERA.z], fov: CAMERA.fov }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        className="!absolute inset-0"
      >
        <Suspense fallback={null}>
          <BearMilkScene milk={milk} reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}
