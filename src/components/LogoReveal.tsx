// src/components/LogoReveal.tsx
// HERO_SEQUENCE §2D — scroll-scrubbed SKIM wordmark assembly (S→K→I→M → full
// → halo → sparkles). One TRACK on the Hero's single scrubbed timeline; this
// component renders the layered SVG and exposes element refs for GSAP.

import { forwardRef, useImperativeHandle, useRef } from "react";
import { site } from "../data/site.config";

const LETTER_ORIGINS = [
  { ox: 71, oy: 128 },
  { ox: 203, oy: 128 },
  { ox: 297, oy: 129 },
  { ox: 400, oy: 128 },
] as const;

export type LogoRevealHandle = {
  group: SVGGElement | null;
  letters: SVGImageElement[];
  full: SVGImageElement | null;
  halo: SVGImageElement | null;
  sparkles: SVGImageElement | null;
};

type Props = {
  /** Reduced motion / static hero: show finished logo immediately */
  assembled?: boolean;
  className?: string;
};

export const LogoReveal = forwardRef<LogoRevealHandle, Props>(function LogoReveal(
  { assembled = false, className },
  ref,
) {
  const groupRef = useRef<SVGGElement | null>(null);
  const fullRef = useRef<SVGImageElement | null>(null);
  const haloRef = useRef<SVGImageElement | null>(null);
  const sparklesRef = useRef<SVGImageElement | null>(null);
  const letterRefs = useRef<(SVGImageElement | null)[]>([]);

  useImperativeHandle(
    ref,
    () => ({
      group: groupRef.current,
      letters: letterRefs.current.filter(Boolean) as SVGImageElement[],
      full: fullRef.current,
      halo: haloRef.current,
      sparkles: sparklesRef.current,
    }),
    [],
  );

  const { full, letters, halo, sparkles } = site.assets.logoReveal;

  return (
    <svg
      viewBox="0 0 487 226"
      role="img"
      aria-label={`${site.name} wordmark`}
      className={className ?? "h-auto w-full"}
      style={{ overflow: "visible", display: "block" }}
    >
      <g ref={groupRef} id="logo-reveal">
        <image
          ref={fullRef}
          href={full}
          x={0}
          y={0}
          width={487}
          height={226}
          style={{ opacity: assembled ? 1 : 0 }}
        />
        {letters.map((src, i) => (
          <image
            key={src}
            ref={(el) => {
              letterRefs.current[i] = el;
            }}
            className="logo-reveal-letter"
            data-ox={LETTER_ORIGINS[i].ox}
            data-oy={LETTER_ORIGINS[i].oy}
            href={src}
            x={0}
            y={0}
            width={487}
            height={226}
            style={{ opacity: assembled ? 0 : 0 }}
          />
        ))}
        <image
          ref={haloRef}
          href={halo}
          x={0}
          y={0}
          width={487}
          height={226}
          style={{ opacity: assembled ? 1 : 0 }}
        />
        <image
          ref={sparklesRef}
          href={sparkles}
          x={0}
          y={0}
          width={487}
          height={226}
          style={{ opacity: assembled ? 1 : 0 }}
        />
      </g>
    </svg>
  );
});
