// Bear+carton model assets. Keep URLs here so preload, scene, and HTML
// link tags stay in sync. Early preload is what makes the Bio 3D feel
// instant — without it, scroll-into-view starts a cold fetch of three.js
// + a 3MB meshopt GLB and users stare at the 2D card for a long time.

export const BEAR_URL = "/models/bear-carton.glb";

let started = false;

/** Warm the GLB HTTP cache + kick the lazy R3F/drei chunk + useGLTF decode.
 *  Safe to call multiple times; starts at most once. Prefer calling from Home
 *  on idle so the hero stays the priority, then Bio finds everything ready. */
export function preloadBearAssets(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  // Browser-level hint (also covered by index.html preload; this covers
  // client-route remounts that never re-read the document head).
  const existing = document.head.querySelector(`link[data-bear-preload]`);
  if (!existing) {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "fetch";
    link.href = BEAR_URL;
    link.crossOrigin = "anonymous";
    link.setAttribute("data-bear-preload", "1");
    document.head.appendChild(link);
  }

  // Ensure the bytes land in the HTTP cache even if the link hint is ignored.
  void fetch(BEAR_URL, { mode: "cors", credentials: "same-origin" }).catch(() => {
    /* ignore — useGLTF will retry when the scene mounts */
  });

  // Pull the Canvas module (three / R3F / drei) and BearMilkScene, whose
  // module-level useGLTF.preload starts meshopt-decoding into drei's cache.
  void import("../components/BioCartonCanvas");
}
