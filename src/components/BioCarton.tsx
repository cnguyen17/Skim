// src/components/BioCarton.tsx
// Bio's right-column signature piece. Replaces the 2D Nutrition-Facts card slot
// with the 3D bear+carton scene, while keeping the 2D <NutritionFacts /> card as
// the graceful fallback under reduced-motion / no-WebGL (§8/§11).
//
// While the GLB / three chunk is still cold, a compact NutritionFacts card sits in
// the lower (carton) zone only — never stretched into the upper ear-overlap area
// that the 3D bear intentionally occupies. Bear stage size stays unchanged.

import { lazy, Suspense, useEffect, useState } from "react";
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

/** Card centered in the bear stage — sized to read near the bio copy column. */
function LoadingFacts() {
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center px-6">
      <div className="w-full max-w-[28rem]">
        <NutritionFacts />
      </div>
    </div>
  );
}

export function BioCarton() {
  const reducedMotion = useReducedMotion();
  const [assetsReady, setAssetsReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const use3D = !reducedMotion && webglAvailable();

  // Label raster + bear assets (no-ops if Home/Loader already kicked them off).
  // As soon as the GLB bytes + chunk are in, we mount the canvas — even though
  // the Bio section is still far offscreen — so the scene builds, uploads to the
  // GPU, and renders ONCE up top. By the time the user scrolls here the bear is
  // already fully drawn: no cold mount / decode / "pop" mid-scroll.
  useEffect(() => {
    if (!use3D) return;
    preloadLabelTexture();
    void preloadBearAssets().then(() => setAssetsReady(true));
  }, [use3D]);

  // Reduced motion / no WebGL → card in the section body (offset cancels Bio -mt).
  if (!use3D) {
    return (
      <div className="ml-auto w-full max-w-[22rem] pt-[8.5rem]">
        <NutritionFacts />
      </div>
    );
  }

  const showCanvas = assetsReady;

  return (
    <div className="bio-bear relative ml-auto h-[min(22rem,58svh)] w-full overflow-visible sm:h-[min(28rem,62svh)] lg:h-[800px] lg:w-[780px] lg:max-w-none lg:shrink-0">
      {/* Placeholder only in the lower carton band — not the upper ear overhang. */}
      <div
        className="transition-opacity duration-500"
        style={{
          opacity: sceneReady ? 0 : 1,
          pointerEvents: sceneReady ? "none" : "auto",
        }}
        aria-hidden={sceneReady}
      >
        <LoadingFacts />
      </div>

      {showCanvas ? (
        <div
          className="absolute inset-0 z-[1] transition-opacity duration-500"
          style={{ opacity: sceneReady ? 1 : 0 }}
        >
          <Suspense fallback={null}>
            <BioCartonCanvas
              reducedMotion={reducedMotion}
              onReady={() => setSceneReady(true)}
            />
          </Suspense>
        </div>
      ) : null}
    </div>
  );
}
