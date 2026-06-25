// src/components/LenisProvider.tsx
// §8 smooth scroll. Wraps the app in Lenis, runs its RAF loop off the GSAP
// ticker, and feeds Lenis scroll into ScrollTrigger so scroll-linked animation
// stays in sync with the smoothed scroll position.
//
// §11: under prefers-reduced-motion, Lenis is NOT initialized — native scroll
// stays on, ScrollTrigger still works against the native scroller, and the page
// is calm and fully usable.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { useReducedMotion } from "../hooks/useReducedMotion";

const LenisContext = createContext<Lenis | null>(null);

/** Access the live Lenis instance (null under reduced motion or before mount). */
export function useLenis() {
  return useContext(LenisContext);
}

export function LenisProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      // Make sure any triggers measured during a smooth session still work.
      ScrollTrigger.refresh();
      return;
    }

    const instance = new Lenis({ duration: 1.1, smoothWheel: true });
    setLenis(instance);

    instance.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // Lenis changes document height as it settles; keep triggers accurate.
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(onTick);
      instance.off("scroll", ScrollTrigger.update);
      instance.destroy();
      setLenis(null);
    };
  }, [reducedMotion]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
