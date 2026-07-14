// src/components/Loader.tsx
// §8 loader. The SKIM wordmark scales/fades in with a soft halo glow, holds
// until hero-critical assets (face frames) are decoded, then the panel wipes
// up to reveal the hero. Shows only on the FIRST load per session.
// §11: under reduced motion it does not animate — content is visible immediately.

import { useEffect, useRef, useState } from "react";
import { gsap } from "../lib/gsap";
import { preloadHeroAssets } from "../lib/preloadHero";
import { site } from "../data/site.config";
import { useReducedMotion } from "../hooks/useReducedMotion";

const SEEN_KEY = "skim:loaded";

export function Loader() {
  const reducedMotion = useReducedMotion();
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(SEEN_KEY) !== "1";
  });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!show) return;

    // Mark seen regardless of path so it's once-per-session.
    sessionStorage.setItem(SEEN_KEY, "1");

    if (reducedMotion) {
      void preloadHeroAssets(4_000);
      setShow(false);
      return;
    }

    let cancelled = false;
    document.body.style.overflow = "hidden";

    // Start fetching/decoding faces in parallel with the logo intro.
    const assetsReady = preloadHeroAssets(12_000);

    const ctx = gsap.context(() => {
      const logo = logoRef.current;
      const root = rootRef.current;
      if (!logo || !root) return;

      const intro = gsap.timeline();
      intro
        .from(logo, {
          scale: 0.7,
          autoAlpha: 0,
          filter: "blur(12px)",
          duration: 0.7,
          ease: "power3.out",
        })
        .to(
          logo,
          {
            filter: "drop-shadow(0 0 26px rgba(255,226,77,0.55))",
            duration: 0.5,
            ease: "sine.inOut",
          },
          "-=0.2",
        )
        .to(logo, { duration: 0.35 }); // short beat before wait pulse

      void intro.then(async () => {
        if (cancelled) return;

        // Soft halo pulse while faces finish loading — keeps the logo “alive”
        // instead of freezing if the network is slow.
        const waitPulse = gsap.to(logo, {
          filter: "drop-shadow(0 0 34px rgba(255,226,77,0.7))",
          duration: 0.7,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });

        await assetsReady;
        if (cancelled) {
          waitPulse.kill();
          return;
        }

        waitPulse.kill();
        gsap.set(logo, {
          filter: "drop-shadow(0 0 26px rgba(255,226,77,0.55))",
        });

        await gsap.to(root, {
          yPercent: -100,
          duration: 0.7,
          ease: "power3.inOut",
        });

        if (cancelled) return;
        document.body.style.overflow = "";
        setShow(false);
      });
    }, rootRef);

    return () => {
      cancelled = true;
      document.body.style.overflow = "";
      ctx.revert();
    };
  }, [show, reducedMotion]);

  if (!show) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink"
      aria-hidden
    >
      <img
        ref={logoRef}
        src={site.assets.logo}
        alt=""
        width={240}
        height={96}
        className="h-24 w-auto sm:h-32"
      />
    </div>
  );
}
