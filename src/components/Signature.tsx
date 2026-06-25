// src/components/Signature.tsx
// HERO_SEQUENCE §2D — skim's signature, revealed via stroke-dashoffset. It is one
// TRACK on the Hero's single scrubbed timeline (drawn ~p 0.40 → 0.65), so the
// reveal stays in lockstep with the rest of the hero. This component just renders
// the mark and forwards its <path>; the Hero owns the animation.
//
// Placeholder vector until the owner drops in signature.svg — swap the PATH data,
// nothing else changes. §11: pass `drawn` to render it fully drawn (reduced motion).

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// A loose one-stroke "skim" script (placeholder).
const PATH =
  "M12 54 C 22 30, 34 30, 30 46 C 27 58, 40 58, 46 44 " +
  "M54 30 L54 56 M54 38 C 62 28, 70 34, 64 46 C 60 54, 70 56, 76 48 " +
  "M86 56 L86 38 M86 44 C 92 36, 98 36, 98 44 L98 56 M98 44 C104 36, 112 36, 112 44 L112 56";

type Props = { drawn?: boolean; className?: string };

export const Signature = forwardRef<SVGPathElement, Props>(function Signature(
  { drawn = false, className },
  ref,
) {
  const pathRef = useRef<SVGPathElement | null>(null);
  useImperativeHandle(ref, () => pathRef.current as SVGPathElement, []);

  // Prime the dash so the Hero timeline can scrub the offset (or render drawn).
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = drawn ? "0" : `${len}`;
  }, [drawn]);

  return (
    <svg
      viewBox="0 0 124 72"
      className={className ?? "h-16 w-auto text-accent sm:h-24"}
      fill="none"
      aria-hidden
    >
      <path
        ref={pathRef}
        d={PATH}
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});
