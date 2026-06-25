// src/lib/heroTheme.ts
// Tiny external store for the hero's light/dark state, so the Nav can invert its
// colors as the hero background flips (HERO_SEQUENCE §2E) WITHOUT re-rendering on
// every scroll frame. The hero timeline calls setHeroTheme() at a threshold (a
// discrete flip, ~twice per pass); Nav subscribes via useSyncExternalStore.
//
//  "light" = light hero background  → Nav uses dark text
//  "dark"  = dark background / rest of site → Nav uses light text (the default)

export type HeroTheme = "light" | "dark";

let current: HeroTheme = "dark";
const listeners = new Set<() => void>();

export function setHeroTheme(next: HeroTheme) {
  if (next === current) return;
  current = next;
  if (typeof document !== "undefined") {
    document.documentElement.dataset.heroTheme = next;
  }
  listeners.forEach((fn) => fn());
}

export function getHeroTheme(): HeroTheme {
  return current;
}

export function subscribeHeroTheme(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
