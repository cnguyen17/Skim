// src/components/BioCartonCanvas.tsx
// The production <Canvas> for the Bio bear+carton scene. Kept in its own module so
// three.js / R3F / drei are code-split and only fetched when Bio mounts this (§10),
// and lazy-mounted by BioCarton only while the section is near the viewport.
//
// Clear color is transparent so NutritionFacts can sit underneath until the bear
// reports ready (no black flash). Brand colors come from the CSS tokens (§3).

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
  onReady,
}: {
  reducedMotion?: boolean;
  onReady?: () => void;
}) {
  const milk = useMemo(() => token("--milk", "#F7F2E8"), []);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(true);
  const [warmed, setWarmed] = useState(false);

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

  // Until the bear has drawn its first lit frame, keep rendering regardless of
  // visibility — this is what lets it warm up offscreen at the top of the page
  // (mounted early) instead of cold-mounting mid-scroll.
  const handleReady = () => {
    setWarmed(true);
    onReady?.();
  };

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <Canvas
        dpr={[1, 1.75]}
        shadows
        frameloop={visible || !warmed ? "always" : "never"}
        camera={{ position: [0, CAMERA.y, CAMERA.z], fov: CAMERA.fov }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        className="!absolute inset-0 !bg-transparent"
      >
        <Suspense fallback={null}>
          <BearMilkScene
            milk={milk}
            reducedMotion={reducedMotion}
            onReady={handleReady}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
