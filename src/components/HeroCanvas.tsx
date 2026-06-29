// src/components/HeroCanvas.tsx
// HERO_SEQUENCE §2A — the R3F canvas is now PURELY the ambient contour-line
// background; the centerpiece is a DOM "window" (see Centerpiece.tsx). Kept in
// its own module so three.js / R3F are code-split and only fetched on Home (§10),
// and lazy-mounted by Hero.tsx only while the hero is near the viewport (§10).
//
// Brand colors are read from the CSS tokens (§3) so nothing is hardcoded here.

import { Suspense, useMemo, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { Background } from "../three/Background";

function token(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export default function HeroCanvas({
  progress,
  box,
}: {
  progress: RefObject<number>;
  box: RefObject<HTMLElement | null>;
}) {
  // Two marble tones sourced from tokens (§3): swap cream↔white (or a future
  // palette) by editing the token, not the shader. --milk is the light tone.
  const colors = useMemo(
    () => ({
      light: token("--milk", "#F7F2E8"),
      dark: token("--ink", "#0F0E0C"),
      accent: token("--accent", "#58D7FF"),
    }),
    [],
  );

  // Cheaper shader + lower DPR on mobile / weak GPUs (brief: fall back on mobile).
  const lowPower =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;

  return (
    <Canvas
      dpr={[1, lowPower ? 1.5 : 2]}
      // Fixed orthographic-feel perspective; the plane covers the frustum and all
      // motion lives in the shader, so the camera never moves.
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      className="!absolute inset-0"
    >
      <Suspense fallback={null}>
        <Background
          progress={progress}
          box={box}
          colorLight={colors.light}
          colorDark={colors.dark}
          accent={colors.accent}
          lowPower={lowPower}
        />
      </Suspense>
    </Canvas>
  );
}
