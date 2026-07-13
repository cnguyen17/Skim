// src/components/BioCarton.tsx
// Bio's right-column signature piece. Replaces the 2D Nutrition-Facts card slot
// with the 3D bear+carton scene, while keeping the 2D <NutritionFacts /> card as
// the graceful fallback under reduced-motion / no-WebGL (§8/§11). The card is also
// what the scene bakes into the carton's label texture, so it's never wasted.
//
// Perf (§10): the R3F/three/drei + scene chunk is lazy-loaded; Home preloads
// the GLB + chunk on idle so by the time Bio scrolls in the canvas mounts warm.
// Canvas mounts once near the viewport and stays mounted (no remount/reparse).

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { preloadBearAssets } from "../three/bearAssets";
import { preloadLabelTexture } from "../three/useLabelTexture";
import { NutritionFacts } from "./NutritionFacts";

const BioCartonCanvas = lazy(() => import("./BioCartonCanvas"));

function webglAvailable() {
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function BioCarton() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const use3D = !reducedMotion && webglAvailable();

  // Mount once when within ~1.5 viewports — stay mounted so scroll away/back
  // doesn't re-decode the meshopt GLB or rebuild the head skin.
  useEffect(() => {
    const el = ref.current;
    if (!el || !use3D || mounted) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true);
          io.disconnect();
        }
      },
      { rootMargin: "150% 0px 150% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [use3D, mounted]);

  // Label raster + bear assets (no-ops if Home already kicked them off).
  useEffect(() => {
    if (!use3D) return;
    preloadLabelTexture();
    preloadBearAssets();
  }, [use3D]);

  // Reduced motion / no WebGL → the calm 2D card (fully usable, no canvas).
  if (!use3D) return <NutritionFacts />;

  return (
    // Fixed 780×800 stage on desktop (the size you dialed in via devtools). Bottom-
    // anchored in the column so height grows upward; overflow visible = no clip frame.
    <div
      ref={ref}
      className="bio-bear relative mx-auto h-[min(42rem,88svh)] w-full max-w-[780px] overflow-visible lg:mx-0 lg:ml-auto lg:h-[800px] lg:w-[780px] lg:max-w-none lg:shrink-0"
    >
      {mounted ? (
        <Suspense fallback={<NutritionFacts />}>
          <BioCartonCanvas reducedMotion={reducedMotion} />
        </Suspense>
      ) : (
        <NutritionFacts />
      )}
    </div>
  );
}
