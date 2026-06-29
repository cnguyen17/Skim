// src/three/useLabelTexture.ts
// PART A — rasterize the 2D <NutritionFacts /> card into a THREE.CanvasTexture so
// the 3D milk carton can wear it as a swappable front-face label (never baked).
//
// Approach / sharpness (CLAUDE.md §10):
//   • Render the BARE card (no <Reveal>, so it's fully opaque) into an off-screen
//     host positioned OFF-VIEWPORT (left:-99999px) — NOT display:none, so CSS,
//     layout and webfonts actually compute.
//   • AWAIT fonts before capture (document.fonts.load + document.fonts.ready) so
//     Anton/Inter/JetBrains Mono render as real faces, not swap fallbacks.
//   • Capture at 3x pixelRatio via html-to-image, then build a CanvasTexture with
//     SRGB colorSpace, mipmaps, and max anisotropy from the live renderer.
//   • Capture is memoized at module scope — it runs exactly once per session.

import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import * as htmlToImage from "html-to-image";
import {
  CanvasTexture,
  LinearMipmapLinearFilter,
  LinearFilter,
  SRGBColorSpace,
  type WebGLRenderer,
} from "three";
import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { CartonLabel, CARTON_LABEL_WIDTH } from "../components/CartonLabel";

/** Natural CSS width of the portrait carton panel before the 3x scale. */
const LABEL_CSS_WIDTH = CARTON_LABEL_WIDTH;
const LABEL_CAPTURE_VERSION = 6;
const PIXEL_SCALE = 4;

/** Force the brand faces to load so the capture never grabs a swap fallback. */
async function awaitFonts(): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await Promise.all([
      document.fonts.load('400 1rem "Anton"'),
      document.fonts.load('500 1rem "JetBrains Mono"'),
      document.fonts.load('500 1rem "Inter"'),
    ]);
  } catch {
    /* a font may be unavailable offline — fall through to ready() anyway */
  }
  await document.fonts.ready;
}

let canvasPromise: Promise<HTMLCanvasElement> | null = null;
let captureVersion = 0;

/** Kick off the (memoized) capture early so the label is ready before it's needed
 *  — e.g. while the heavy bear GLB is still streaming in. Safe to call repeatedly. */
export function preloadLabelTexture(): void {
  if (captureVersion !== LABEL_CAPTURE_VERSION) {
    canvasPromise = null;
    captureVersion = LABEL_CAPTURE_VERSION;
  }
  void captureLabelCanvas();
}

/** Render <NutritionFacts /> off-screen and rasterize it to a canvas — once. */
function captureLabelCanvas(): Promise<HTMLCanvasElement> {
  if (captureVersion !== LABEL_CAPTURE_VERSION) {
    canvasPromise = null;
    captureVersion = LABEL_CAPTURE_VERSION;
  }
  if (canvasPromise) return canvasPromise;

  canvasPromise = (async () => {
    const host = document.createElement("div");
    host.style.cssText =
      "position:absolute;left:-99999px;top:0;width:" +
      LABEL_CSS_WIDTH +
      "px;pointer-events:none;";
    document.body.appendChild(host);

    const root: Root = createRoot(host);
    // flushSync so the card is in the DOM before we read fonts/layout.
    flushSync(() => root.render(createElement(CartonLabel)));

    await awaitFonts();
    // one paint so layout/fonts settle before capture
    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    const node = host.firstElementChild as HTMLElement;
    const canvas = await htmlToImage.toCanvas(node, {
      pixelRatio: PIXEL_SCALE,
      // capture exactly the card box; bg stays the card's own milk fill
      width: node.offsetWidth,
      height: node.offsetHeight,
    });

    root.unmount();
    host.remove();
    return canvas;
  })();

  return canvasPromise;
}

function makeTexture(canvas: HTMLCanvasElement, gl: WebGLRenderer): CanvasTexture {
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = gl.capabilities.getMaxAnisotropy();
  tex.generateMipmaps = true;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  // CanvasTexture defaults flipY=true (matches UV-mapped planes / Decals); the
  // preview confirms orientation before any bear work.
  tex.needsUpdate = true;
  return tex;
}

/**
 * Returns the Nutrition-Facts label as a CanvasTexture, or null until ready.
 * Must be used inside a <Canvas> (reads the live renderer for anisotropy).
 */
export function useLabelTexture(): CanvasTexture | null {
  const gl = useThree((s) => s.gl);
  const [texture, setTexture] = useState<CanvasTexture | null>(null);

  useEffect(() => {
    let alive = true;
    let created: CanvasTexture | null = null;
    captureLabelCanvas().then((canvas) => {
      if (!alive) return;
      created = makeTexture(canvas, gl);
      setTexture(created);
    });
    return () => {
      alive = false;
      created?.dispose();
    };
  }, [gl]);

  return texture;
}
