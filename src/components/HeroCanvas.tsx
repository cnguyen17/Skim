// src/components/HeroCanvas.tsx
// The R3F canvas for the hero, kept in its own module so three.js / R3F / drei
// are code-split and only fetched on Home (§10). Default export → lazy-mounted
// by Hero.tsx, and only while the hero is near the viewport (offscreen unmount
// = render loop paused, §10).
//
// Reads brand colors from the CSS tokens (§3) so nothing is hardcoded here.

import { Suspense, useMemo, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MathUtils } from "three";
import { Background } from "../three/Background";
import { HeroBear } from "../three/HeroBear";
import { site } from "../data/site.config";

function token(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

// §7 scroll dolly-out: ease the camera back as the hero scrolls away.
function CameraDolly({ progress }: { progress: RefObject<number> }) {
  const { camera } = useThree();
  useFrame(() => {
    const p = progress.current ?? 0;
    const targetZ = MathUtils.lerp(5, 9, p);
    camera.position.z = MathUtils.lerp(camera.position.z, targetZ, 0.08);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroCanvas({ progress }: { progress: RefObject<number> }) {
  const colors = useMemo(
    () => ({
      ink: token("--ink", "#0F0E0C"),
      accent: token("--accent", "#58D7FF"),
      accent2: token("--accent-2", "#FFE24D"),
    }),
    [],
  );

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      className="!absolute inset-0"
    >
      <CameraDolly progress={progress} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <Suspense fallback={null}>
        <Background ink={colors.ink} accent={colors.accent} accent2={colors.accent2} />
        {/* Swappable centerpiece — wordmark stands in for the owner's bear art. */}
        <HeroBear src={site.assets.logo} />
      </Suspense>
    </Canvas>
  );
}
