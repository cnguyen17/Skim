// src/components/LenisProvider.tsx
// §8 smooth scroll. Wraps the app in Lenis and runs its RAF loop.
// §11: when prefers-reduced-motion is set, Lenis is NOT initialized — native
// scrolling stays on so the page is calm and fully usable.
//
// Phase 2 will feed `lenis.on('scroll', ScrollTrigger.update)` here once GSAP
// ScrollTrigger is wired. For Phase 1 this just establishes the smooth-scroll
// base and the reduced-motion gate.

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function LenisProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return; // §11 — skip Lenis entirely under reduced motion

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [reducedMotion]);

  return <>{children}</>;
}
