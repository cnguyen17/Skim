// Bear+carton model assets. Keep URLs here so preload, scene, and HTML
// link tags stay in sync. Early preload is what makes the Bio 3D feel
// instant — without it, scroll-into-view starts a cold fetch of three.js
// + a 3MB meshopt GLB and users stare at a blank canvas.

export const BEAR_URL = "/models/bear-carton.glb";

let readyPromise: Promise<void> | null = null;

/**
 * Warm the GLB HTTP cache + kick the lazy R3F/drei chunk + useGLTF decode.
 * Safe to call multiple times; starts at most once. Returns a promise that
 * resolves when the chunk has evaluated (useGLTF.preload kicked) and the GLB
 * bytes are in cache — Bio can wait on this before showing the canvas.
 */
export function preloadBearAssets(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
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

    await Promise.all([
      fetch(BEAR_URL, { mode: "cors", credentials: "same-origin" }).then((r) => {
        // Drain the body so the full response is cached, not just headers.
        return r.ok ? r.arrayBuffer() : undefined;
      }),
      // Evaluating BioCartonCanvas runs useGLTF.preload(BEAR_URL).
      import("../components/BioCartonCanvas"),
    ]);
  })().catch(() => {
    /* useGLTF will retry when the scene mounts */
  });

  return readyPromise;
}
