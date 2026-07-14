// Preload hero-critical images so the loader can hold until faces are ready.
import { site } from "../data/site.config";

function loadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (typeof img.decode === "function") {
        img.decode().then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

/** Logo + face frames when the hero uses the face centerpiece. */
export function heroCriticalUrls(): string[] {
  const urls: string[] = [site.assets.logo];
  if (site.hero.centerpiece === "face" && site.hero.faceFrames.length > 0) {
    urls.push(...site.hero.faceFrames);
  }
  return urls;
}

/**
 * Resolve when critical hero images are decoded (or fail), whichever comes first
 * vs `timeoutMs` so a slow network never blocks forever.
 */
export function preloadHeroAssets(timeoutMs = 12_000): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const urls = heroCriticalUrls();
  const all = Promise.all(urls.map(loadImage)).then(() => undefined);
  const timeout = new Promise<void>((resolve) => {
    window.setTimeout(resolve, timeoutMs);
  });
  return Promise.race([all, timeout]);
}
