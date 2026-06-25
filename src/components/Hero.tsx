// src/components/Hero.tsx
// HERO_SEQUENCE.md — the signature hero: ONE pinned section playing ONE GSAP
// timeline that is SCRUBBED by scroll (Lenis-smoothed), so every element moves
// as a single continuous motion. Tracks on that timeline:
//   • background contour shader inverts milk → ink (driven via the `progress` ref)
//   • the centerpiece "window" frames + scales down, then exits up
//   • two side display-text rows slide in and drift horizontally
//   • the signature draws across the window
//   • the Nav inverts (discrete light→dark flip via the heroTheme store)
//
// Performance/a11y (CLAUDE.md §10/§11):
//   • the R3F canvas chunk is React.lazy + only mounts while the hero is near the
//     viewport; scrolling past it unmounts it (render loop paused).
//   • under reduced motion / no WebGL we render a calm STATIC hero (no pin, no
//     scrub, no canvas): dark surface, framed centerpiece, signature drawn.

import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { site } from "../data/site.config";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { setHeroTheme } from "../lib/heroTheme";
import { Centerpiece } from "./Centerpiece";
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
  const progress = useRef(0);

  // animation targets
  const floatRef = useRef<HTMLDivElement | null>(null);
  const parallaxRef = useRef<HTMLDivElement | null>(null);
  const windowRef = useRef<HTMLDivElement | null>(null);
  const textLeftRef = useRef<HTMLDivElement | null>(null);
  const textRightRef = useRef<HTMLDivElement | null>(null);
  const foreRef = useRef<HTMLDivElement | null>(null);
  const sigRef = useRef<SVGPathElement | null>(null);

  const [nearView, setNearView] = useState(false);
  const use3D = !reducedMotion && webglAvailable();
  const [message0, message1] = site.hero.message;

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

  // The one pinned, scrubbed timeline. Static (no pin) under reduced motion / no
  // WebGL — the hero then opens dark with the Nav in its default dark theme.
  useEffect(() => {
    if (!use3D) {
      setHeroTheme("dark");
      return;
    }
    const section = sectionRef.current;
    if (!section) return;

    // The hero opens light.
    setHeroTheme("light");
    progress.current = 0;

    // Resolve the frame color from tokens so GSAP can interpolate it (it can't
    // tween to a `var()` string) while tokens.css stays the source of truth.
    const frameColor =
      getComputedStyle(document.documentElement).getPropertyValue("--hero-frame").trim() ||
      "rgba(88,215,255,0.55)";

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=300%", // ~300vh pinned scroll (HERO_SEQUENCE §1)
          scrub: true,
          pin: true,
          onUpdate: (self) => {
            progress.current = self.progress;
            // discrete Nav flip around the bg midpoint (no per-frame React state)
            setHeroTheme(self.progress < 0.25 ? "light" : "dark");
          },
        },
      });

      // Foreground (handle + scroll cue) fades out first.
      tl.to(foreRef.current, { autoAlpha: 0, duration: 0.18 }, 0);

      // Centerpiece window: frame + scale down, then exit up.
      tl.fromTo(
        windowRef.current,
        { scale: 1.15 },
        { scale: 0.46, duration: 0.82 },
        0,
      );
      tl.fromTo(
        windowRef.current,
        { borderColor: "rgba(88,215,255,0)", borderRadius: 0 },
        { borderColor: frameColor, borderRadius: 12, duration: 0.18 },
        0.12,
      );
      tl.to(windowRef.current, { yPercent: -120, autoAlpha: 0, duration: 0.15 }, 0.85);

      // Side display text: slide in from the edges, drift across, then exit.
      tl.fromTo(
        textLeftRef.current,
        { xPercent: -12, autoAlpha: 0 },
        { xPercent: -40, autoAlpha: 1, duration: 0.1 },
        0.12,
      );
      tl.to(textLeftRef.current, { xPercent: -62, duration: 0.6 }, 0.22);
      tl.to(textLeftRef.current, { autoAlpha: 0, duration: 0.13 }, 0.85);

      tl.fromTo(
        textRightRef.current,
        { xPercent: 12, autoAlpha: 0 },
        { xPercent: 40, autoAlpha: 1, duration: 0.1 },
        0.12,
      );
      tl.to(textRightRef.current, { xPercent: 62, duration: 0.6 }, 0.22);
      tl.to(textRightRef.current, { autoAlpha: 0, duration: 0.13 }, 0.85);

      // Signature draws across the window (it's a child of the window, so it
      // scales + exits with it). Drawn p 0.40 → 0.65.
      const sig = sigRef.current;
      if (sig) {
        const len = sig.getTotalLength();
        tl.fromTo(
          sig,
          { strokeDashoffset: len },
          { strokeDashoffset: 0, duration: 0.25 },
          0.4,
        );
      }

      // Idle float on the centerpiece (independent of scroll).
      gsap.to(floatRef.current, {
        y: 14,
        duration: 3.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      // Subtle mouse parallax on the centerpiece.
      const px = gsap.quickTo(parallaxRef.current, "x", { duration: 0.6, ease: "power2.out" });
      const py = gsap.quickTo(parallaxRef.current, "y", { duration: 0.6, ease: "power2.out" });
      const onMove = (e: PointerEvent) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        px(nx * 16);
        py(ny * 16);
      };
      window.addEventListener("pointermove", onMove);

      // Pin geometry depends on the display font; re-measure once it's ready.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());

      return () => window.removeEventListener("pointermove", onMove);
    }, section);

    return () => {
      ctx.revert();
      setHeroTheme("dark");
    };
  }, [use3D]);

  // White-ish source + mix-blend-difference = auto-inverting contrast: the text
  // reads dark on the light opening and light once the background flips to ink,
  // tracking the transition continuously without a JS color tween.
  const sideTextBase =
    "pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 font-display uppercase leading-[0.85] text-milk mix-blend-difference";

  return (
    <section
      ref={sectionRef}
      id={HERO_ID}
      className="relative flex h-dvh min-h-[640px] w-full items-center justify-center overflow-hidden bg-hero-surface"
    >
      {/* Ambient contour background (or a calm static fallback) */}
      <div className="pointer-events-none absolute inset-0">
        {use3D && nearView ? (
          <Suspense fallback={null}>
            <HeroCanvas progress={progress} />
          </Suspense>
        ) : (
          // Static fallback (reduced motion / no WebGL): dark, calm.
          <div className="absolute inset-0 bg-ink" />
        )}
      </div>

      {/* Side display text — skim's own words from site.config.hero.message */}
      {message0 && (
        <div ref={textLeftRef} className={`${sideTextBase} left-0 text-[12vw] sm:text-[8vw]`}>
          {message0}
        </div>
      )}
      {message1 && (
        <div
          ref={textRightRef}
          className={`${sideTextBase} right-0 text-right font-mono text-[5vw] tracking-[0.04em] sm:text-[3vw]`}
        >
          {message1}
        </div>
      )}

      {/* Centerpiece: idle float → mouse parallax → scroll-driven window */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div ref={floatRef}>
          <div ref={parallaxRef}>
            <div
              ref={windowRef}
              className={`relative flex aspect-[16/10] w-[80vmin] max-w-[680px] items-center justify-center overflow-hidden border will-change-transform ${
                use3D
                  ? "scale-[1.15] border-transparent" // timeline takes over from here
                  : "scale-[0.6] rounded-xl border-[color:var(--hero-frame)]" // calm static frame
              }`}
            >
              <Centerpiece variant={site.hero.centerpiece} progress={progress} />
              {/* Signature drawn over the window */}
              <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-[8%]">
                <Signature ref={sigRef} drawn={!use3D} className="h-[28%] w-auto text-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Foreground: handle + scroll cue (fades out on scroll) */}
      <div ref={foreRef} className="pointer-events-none absolute inset-0 z-30">
        <p className="absolute left-5 top-20 font-mono text-xs uppercase tracking-[0.35em] text-milk mix-blend-difference sm:left-8">
          @{site.handle}
        </p>
        <div className="absolute inset-x-0 bottom-5 flex justify-center">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-milk mix-blend-difference">
            Scroll
          </span>
        </div>
      </div>
    </section>
  );
}
