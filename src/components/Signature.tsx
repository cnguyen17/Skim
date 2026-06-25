// src/components/Signature.tsx
// §8 signature draw-in. An inline SVG "skim" mark drawn via stroke-dashoffset,
// scrubbed by the hero's scroll. Placeholder vector until the owner provides
// signature.svg — drop that in and swap the <path> data, nothing else changes.
//
// §11: under reduced motion it renders fully drawn with no scroll animation.

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { useReducedMotion } from "../hooks/useReducedMotion";

// A loose one-stroke "skim" script (placeholder).
const PATH =
  "M12 54 C 22 30, 34 30, 30 46 C 27 58, 40 58, 46 44 " +
  "M54 30 L54 56 M54 38 C 62 28, 70 34, 64 46 C 60 54, 70 56, 76 48 " +
  "M86 56 L86 38 M86 44 C 92 36, 98 36, 98 44 L98 56 M98 44 C104 36, 112 36, 112 44 L112 56";

export function Signature({ triggerId }: { triggerId: string }) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;

    if (reducedMotion) {
      path.style.strokeDashoffset = "0";
      return;
    }

    path.style.strokeDashoffset = `${len}`;
    const trigger = document.getElementById(triggerId);
    if (!trigger) {
      path.style.strokeDashoffset = "0";
      return;
    }

    const st = ScrollTrigger.create({
      trigger,
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        gsap.set(path, { strokeDashoffset: len * (1 - self.progress) });
      },
    });
    return () => st.kill();
  }, [reducedMotion, triggerId]);

  return (
    <svg
      viewBox="0 0 124 72"
      className="h-12 w-auto text-accent sm:h-16"
      fill="none"
      aria-hidden
    >
      <path
        ref={pathRef}
        d={PATH}
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
