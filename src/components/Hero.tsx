// src/components/Hero.tsx
// §7/§8 signature hero. A full-viewport stage: the ambient WebGL canvas + the
// floating centerpiece behind, a big display name + tagline + signature draw-in
// in front, and a scroll cue. The camera dollies out as you scroll (progressRef
// → HeroCanvas).
//
// Performance/a11y:
//  - The canvas chunk is React.lazy and only mounts while the hero is near the
//    viewport; scrolling it offscreen unmounts it (render loop paused). §10
//  - Under reduced motion or when WebGL is unavailable, we render a static
//    wordmark instead — calm and fully usable. §11

import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { site } from "../data/site.config";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { RollText } from "./RollText";
import { Signature } from "./Signature";

const HeroCanvas = lazy(() => import("./HeroCanvas"));

const HERO_ID = "hero";

function webglAvailable() {
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function Hero() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const progress = useRef(0);
  const [nearView, setNearView] = useState(false);

  const use3D = !reducedMotion && webglAvailable();

  // Mount/unmount the canvas based on proximity to the viewport (pause offscreen).
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !use3D) return;
    const io = new IntersectionObserver(
      ([entry]) => setNearView(entry.isIntersecting),
      { rootMargin: "200px 0px 200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [use3D]);

  // Scroll progress for the camera dolly + parallax/fade of the overlay.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reducedMotion) {
      progress.current = 0;
      return;
    }
    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });

    const fade = gsap.to(contentRef.current, {
      yPercent: -18,
      autoAlpha: 0,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "60% top",
        scrub: true,
      },
    });

    return () => {
      st.kill();
      fade.scrollTrigger?.kill();
      fade.kill();
    };
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id={HERO_ID}
      className="relative flex h-dvh min-h-[640px] w-full items-end overflow-hidden bg-ink"
    >
      {/* Background / centerpiece layer */}
      <div className="pointer-events-none absolute inset-0">
        {use3D && nearView ? (
          <Suspense fallback={null}>
            <HeroCanvas progress={progress} />
          </Suspense>
        ) : (
          // Static fallback (reduced motion / no WebGL)
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={site.assets.logo}
              alt={`${site.name} wordmark logo`}
              width={320}
              height={128}
              className="h-28 w-auto opacity-90 sm:h-40"
            />
          </div>
        )}
        {/* readability gradient at the bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
      </div>

      {/* Foreground copy */}
      <div
        ref={contentRef}
        className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8 sm:pb-20"
      >
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.35em] text-accent">
          @{site.handle}
        </p>
        <h1 className="leading-[0.85]">
          <RollText
            text={site.name}
            as="span"
            className="font-display text-[22vw] uppercase text-milk sm:text-[16vw] lg:text-[13rem]"
          />
        </h1>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <p className="max-w-sm font-body text-base text-mid">{site.blurb}</p>
          <Signature triggerId={HERO_ID} />
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-mid">
          Scroll
        </span>
      </div>
    </section>
  );
}
