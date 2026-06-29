// Scroll to an in-page section by hash id. Works with Lenis + ScrollTrigger
// (hero pin) and retries until the target mounts (lazy routes / menu close).

import type Lenis from "lenis";
import { ScrollTrigger } from "./gsap";

const MAX_TRIES = 40;
const RETRY_MS = 50;

/** Fixed header height + tiny gap so content doesn't kiss the nav edge. */
function navOffset(): number {
  const header = document.querySelector("header");
  if (!header) return 72;
  return Math.ceil(header.getBoundingClientRect().height) + 4;
}

/** Map `work`, `work-producing`, etc. to the `#work` tab bar anchor. */
export function sectionIdFromHash(hash: string): string {
  if (hash.startsWith("work")) return "work";
  return hash;
}

/**
 * Scroll so the target sits under the fixed nav.
 * `#work` aligns the tab bar's bottom rule flush under the nav (section feels
 * "complete"). Other anchors align their top edge.
 */
function scrollYFor(el: HTMLElement, id: string): number {
  const nav = navOffset();
  const rect = el.getBoundingClientRect();
  const docTop = window.scrollY + rect.top;
  const docBottom = window.scrollY + rect.bottom;

  if (id === "work") {
    // Pin the horizontal rule (bottom of tablist) just under the nav.
    return docBottom - nav;
  }

  // `#bio` — section border / top edge under the nav.
  return docTop - nav;
}

export function scrollToSection(
  hash: string,
  lenis: Lenis | null,
  { immediate = false }: { immediate?: boolean } = {},
) {
  const id = sectionIdFromHash(hash.replace(/^#/, ""));
  if (!id) return;

  const run = (attempt = 0) => {
    lenis?.start();

    const el = document.getElementById(id);
    if (!el) {
      if (attempt < MAX_TRIES) {
        setTimeout(() => run(attempt + 1), RETRY_MS);
      }
      return;
    }

    const y = Math.max(0, scrollYFor(el, id));

    if (lenis) {
      lenis.scrollTo(y, { immediate });
    } else {
      window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
    }

    ScrollTrigger.update();
  };

  requestAnimationFrame(() => run());
}
