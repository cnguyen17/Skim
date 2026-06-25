// src/components/Reveal.tsx
// §8 section reveal — elements rise + fade in on enter, optionally staggered.
// Uses IntersectionObserver (cheap, no layout thrash) and toggles the .reveal /
// .is-in classes defined in globals.css.
//
// §11: under reduced motion the CSS forces content visible with no transition,
// and we add .is-in immediately so nothing depends on the observer firing.

import { createElement, useEffect, useRef, type ElementType, type ReactNode } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function Reveal({
  children,
  as = "div",
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** seconds to offset the transition, for manual staggering */
  delay?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reducedMotion) {
      el.classList.add("is-in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("is-in");
            io.unobserve(el);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  return createElement(
    as,
    {
      ref,
      className: `reveal ${className}`.trim(),
      style: delay ? { transitionDelay: `${delay}s` } : undefined,
    },
    children,
  );
}
