// src/components/Hero.tsx
// HERO_SEQUENCE.md — the signature hero: ONE pinned section playing ONE GSAP
// timeline that is SCRUBBED by scroll (Lenis-smoothed), so every element moves
// as a single continuous motion. Tracks on that timeline:
//   • background contour shader inverts milk → ink (driven via the `progress` ref)
//   • the centerpiece "window" frames + scales down, then exits up
//   • two side display-text rows slide in and drift horizontally
//   • the SKIM wordmark assembles letter-by-letter over the window
//   • the Nav inverts (discrete light→dark flip via the heroTheme store)
//
// Performance/a11y (CLAUDE.md §10/§11):
//   • the R3F canvas chunk is React.lazy + only mounts while the hero is near the
//     viewport; scrolling past it unmounts it (render loop paused).
//   • under reduced motion / no WebGL we render a calm STATIC hero (no pin, no
//     scrub, no canvas): dark surface, framed centerpiece, logo assembled.

import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { site } from "../data/site.config";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { setHeroTheme } from "../lib/heroTheme";
import { Centerpiece } from "./Centerpiece";
import { LogoReveal, type LogoRevealHandle } from "./LogoReveal";

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
  const windowRef = useRef<HTMLDivElement | null>(null);
  const subjectRef = useRef<HTMLDivElement | null>(null);
  const shadeRef = useRef<HTMLDivElement | null>(null);
  const textTopRef = useRef<HTMLDivElement | null>(null);
  const textBotRef = useRef<HTMLDivElement | null>(null);
  const foreRef = useRef<HTMLDivElement | null>(null);
  const logoRevealRef = useRef<LogoRevealHandle | null>(null);

  const [nearView, setNearView] = useState(false);
  const use3D = !reducedMotion && webglAvailable();
  // Final hero frame copy (config). Headline string lives in site.config; the sub
  // is the handle (shown as @MYNAMEIZSKIM via CSS uppercase).
  const headline = site.hero.outro.headline;
  const sub = `@${site.handle}`;

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
  useLayoutEffect(() => {
    if (!use3D) {
      setHeroTheme("dark");
      const framing = site.hero.faceFraming;
      const narrow = window.matchMedia("(max-width: 1023px)").matches;
      const x = narrow && framing.mobile ? framing.mobile.xPercent : framing.xPercent;
      if (subjectRef.current) gsap.set(subjectRef.current, { xPercent: x });
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
    const milkColor =
      getComputedStyle(document.documentElement).getPropertyValue("--milk").trim() || "#F7F2E8";

    // Lando-style: the portrait OPENS full-bleed (entire viewport), then the whole
    // screen minimizes to a centered letterbox. One frame — not a box on a bg.
    // On narrow viewports, keep a taller (near-portrait) letterbox so the filtered
    // face stays readable as it rises with the frame.
    const isNarrow = () => window.matchMedia("(max-width: 1023px)").matches;
    const openW = () => section.clientWidth || window.innerWidth;
    const openH = () => section.clientHeight || window.innerHeight;
    const smallW = () =>
      isNarrow()
        ? Math.min(window.innerWidth * 0.84, 440)
        : Math.min(window.innerWidth * 0.62, 760);
    // Mobile letterbox stays near-square so bottom-planted cover fills the
    // cyan frame without a tall empty band above his head.
    const smallH = () => (isNarrow() ? smallW() * (5 / 4) : smallW() * (9 / 16));

    const FRAME_END = 0.45;
    const FRAME_EARLY = 0.2; // first fifth of scroll — photo "pushes away" fast
    const LOGO_START = 0.50;
    const EXIT_START = 0.92;

    const midW = () => openW() * (isNarrow() ? 0.9 : 0.76);
    const midH = () => openH() * (isNarrow() ? 0.82 : 0.76);

    const framing = site.hero.faceFraming;
    const m = framing.mobile;
    const scaleOpen = () => (isNarrow() && m ? m.scaleOpen : framing.scaleOpen);
    const scaleClosed = () => (isNarrow() && m ? m.scaleClosed : framing.scaleClosed);
    const yOpen = () => (isNarrow() && m ? m.yOpen : 0);
    const yMid = () => (isNarrow() && m ? m.yMid : -6);
    const yClosed = () => (isNarrow() && m ? m.yClosed : -3);
    const xNudge = () => (isNarrow() && m ? m.xPercent : framing.xPercent);

    // Sync initial subject framing before the scrubbed timeline owns the transform.
    if (subjectRef.current) {
      gsap.set(subjectRef.current, {
        scale: scaleOpen(),
        yPercent: yOpen(),
        xPercent: xNudge(),
      });
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=400%",
          scrub: true,
          pin: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            progress.current = self.progress;
            setHeroTheme(self.progress < 0.14 ? "light" : "dark");
          },
        },
      });

      // Foreground (handle + scroll cue) fades out first.
      tl.to(foreRef.current, { autoAlpha: 0, duration: 0.1 }, 0);

      // Full viewport → letterbox. Phase 1 shrinks fast (border + dark matte
      // visible immediately); phase 2 eases to final size.
      tl.fromTo(
        windowRef.current,
        { width: openW, height: openH },
        { width: midW, height: midH, duration: FRAME_EARLY, ease: "power2.out" },
        0,
      );
      tl.to(
        windowRef.current,
        { width: smallW, height: smallH, duration: FRAME_END - FRAME_EARLY, ease: "power1.inOut" },
        FRAME_EARLY,
      );

      // Cyan frame + milk fill land together. Opening stays transparent so the
      // marble Background shows through; milk only fills once the blue border is
      // on (clipped by overflow+radius — no cream bleed outside the frame).
      tl.fromTo(
        windowRef.current,
        {
          borderColor: "rgba(88,215,255,0)",
          borderRadius: 0,
          backgroundColor: "rgba(247,242,232,0)",
        },
        {
          borderColor: frameColor,
          borderRadius: 12,
          backgroundColor: milkColor,
          duration: 0.07,
          ease: "power2.out",
        },
        0,
      );

      // Subject scale / y — xPercent holds the optical-center nudge the whole way.
      tl.fromTo(
        subjectRef.current,
        { scale: scaleOpen, yPercent: yOpen, xPercent: xNudge },
        { scale: scaleClosed, yPercent: yMid, xPercent: xNudge, duration: FRAME_EARLY, ease: "power2.out" },
        0,
      );
      tl.to(
        subjectRef.current,
        {
          yPercent: yClosed,
          scale: scaleClosed,
          xPercent: xNudge,
          duration: FRAME_END - FRAME_EARLY,
          ease: "power1.inOut",
        },
        FRAME_EARLY,
      );

      // Studio shade on transparent PNG edges — follows the early shrink.
      tl.fromTo(shadeRef.current, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: "power2.out" }, 0.04);

      // Side display text — fade in as the window recedes, exit before logo lands.
      tl.fromTo(textTopRef.current, { yPercent: 90, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.08, ease: "power2.out" }, 0.04);
      tl.to(textTopRef.current, { yPercent: -170, autoAlpha: 0, duration: 0.34 }, 0.22);

      tl.fromTo(textBotRef.current, { yPercent: -90, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.08, ease: "power2.out" }, 0.04);
      tl.to(textBotRef.current, { yPercent: -210, autoAlpha: 0, duration: 0.34 }, 0.22);

      // Logo reveal: letters → full → halo → sparkles. Child tl duration is
      // capped at 0.36 so it fully completes by ~0.86, then a hold before exit.
      const logo = logoRevealRef.current;
      if (logo?.group && logo.letters.length === 4 && logo.full && logo.halo && logo.sparkles) {
        const { group, letters, full, halo, sparkles } = logo;

        letters.forEach((el) => {
          const ox = el.dataset.ox ?? "0";
          const oy = el.dataset.oy ?? "0";
          gsap.set(el, { opacity: 0, scale: 0.55, svgOrigin: `${ox} ${oy}` });
        });
        gsap.set(full, { opacity: 0 });
        gsap.set(halo, { opacity: 0, scale: 0.3, y: -50, svgOrigin: "298 43" });
        gsap.set(sparkles, { opacity: 0, scale: 0, svgOrigin: "347 12" });
        gsap.set(group, { scale: 1, svgOrigin: "243 128" });

        const logoTl = gsap.timeline();
        logoTl.to(
          letters,
          { opacity: 1, scale: 1, ease: "back.out(2.2)", stagger: 0.05, duration: 0.09 },
          0,
        );
        logoTl.set(full, { opacity: 1 }, 0.22);
        logoTl.set(letters, { opacity: 0 }, 0.22);
        logoTl.to(
          halo,
          { opacity: 1, scale: 1, y: 0, ease: "elastic.out(1, 0.5)", duration: 0.1 },
          0.22,
        );
        logoTl.to(
          sparkles,
          { opacity: 1, scale: 1, ease: "back.out(2.5)", duration: 0.08 },
          0.28,
        );
        logoTl.to(group, { scale: 1.05, duration: 0.04, ease: "power2.out" }, 0.32);
        logoTl.to(group, { scale: 1, duration: 0.06, ease: "elastic.out(1, 0.6)" }, 0.36);

        tl.add(logoTl, LOGO_START);
      }

      // Exit up — only after logo has finished assembling.
      tl.to(windowRef.current, { yPercent: -120, autoAlpha: 0, duration: 0.08 }, EXIT_START);

      // Pin geometry depends on the display font; re-measure once it's ready.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    }, section);

    return () => {
      ctx.revert();
      setHeroTheme("dark");
    };
  }, [use3D]);

  // White-ish source + mix-blend-difference = auto-inverting contrast: the text
  // reads dark on the light opening and light once the background flips to ink,
  // tracking the transition continuously without a JS color tween. Positioning
  // lives on the outer wrapper so GSAP can own the inner transform cleanly.
  const sideTextBase =
    "inline-block uppercase leading-[0.9] text-milk mix-blend-difference";

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
            <HeroCanvas progress={progress} box={windowRef} />
          </Suspense>
        ) : (
          // Static fallback (reduced motion / no WebGL): dark, calm.
          <div className="absolute inset-0 bg-ink" />
        )}
      </div>

      {/* Side display text — skim's own words (config). Stacked top/bottom and
          centered so it always fits; GSAP rises + scrolls each row up and out. */}
      {headline && (
        <div className="pointer-events-none absolute inset-x-0 top-[10%] z-10 flex justify-center px-5 text-center">
          <div ref={textTopRef} className={`${sideTextBase} font-display text-[7vw] sm:text-[3.6vw]`}>
            {headline}
          </div>
        </div>
      )}
      {sub && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[10%] z-10 flex justify-center px-5 text-center">
          <div ref={textBotRef} className={`${sideTextBase} font-mono tracking-[0.06em] text-[6vw] sm:text-[3vw]`}>
            {sub}
          </div>
        </div>
      )}

      {/* Full-bleed stage → minimizes to center on scroll (Lando-style) */}
      <div className="absolute inset-0 z-20">
        <div ref={floatRef} className="absolute inset-0 flex items-center justify-center">
          <div
            ref={windowRef}
            className={`relative isolate overflow-hidden border will-change-[width,height] ${
              use3D
                ? // Transparent at open so the marble canvas shows; GSAP fades in
                  // milk with the cyan border (clipped — no cream bleed).
                  "h-full w-full border-transparent bg-transparent"
                : "scale-[0.62] rounded-xl border-[color:var(--hero-frame)] bg-[color:var(--milk)]"
            }`}
          >
            <div
              ref={shadeRef}
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_30%,rgba(247,242,232,0)_35%,rgba(15,14,12,0.12)_72%,rgba(15,14,12,0.28)_100%)] opacity-0"
            />
            <Centerpiece
              ref={subjectRef}
              variant={site.hero.centerpiece}
              progress={progress}
              settled={!use3D}
            />
            {/* Logo assembles over the framed face as the window zooms out */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <LogoReveal
                ref={logoRevealRef}
                assembled={!use3D}
                className="h-auto w-[86%] drop-shadow-[0_0_30px_rgba(88,215,255,0.2)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Foreground: handle + scroll cue (fades out on scroll) */}
      <div ref={foreRef} className="pointer-events-none absolute inset-0 z-30">
        <p className="absolute left-5 top-24 font-mono text-xs uppercase tracking-[0.35em] text-milk mix-blend-difference sm:left-8 sm:top-20">
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
