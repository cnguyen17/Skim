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
  const colors = useMemo(
    () => ({
      surface: token("--hero-surface", "#F7F2E8"),
      ink: token("--ink", "#0F0E0C"),
      lineLo: token("--hero-line-lo", "rgba(15,14,12,0.22)"),
      lineHi: token("--hero-line-hi", "rgba(247,242,232,0.16)"),
      accent: token("--accent", "#58D7FF"),
    }),
    [],
  );

  return (
    <Canvas
      dpr={[1, 2]}
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
          surface={colors.surface}
          ink={colors.ink}
          lineLo={colors.lineLo}
          lineHi={colors.lineHi}
          accent={colors.accent}
        />
      </Suspense>
    </Canvas>
  );
}
