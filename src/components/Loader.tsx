// src/components/Loader.tsx
// §8 loader. The SKIM wordmark scales/fades in with a soft halo glow, holds,
// then the panel wipes up to reveal the hero. Shows only on the FIRST load per
// session (sessionStorage). §11: under reduced motion it does not animate — it
// simply never shows (content is visible immediately).

import { useEffect, useRef, useState } from "react";
import { gsap } from "../lib/gsap";
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
      setShow(false);
      return;
    }

    document.body.style.overflow = "hidden";
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          document.body.style.overflow = "";
          setShow(false);
        },
      });
      tl.from(logoRef.current, {
        scale: 0.7,
        autoAlpha: 0,
        filter: "blur(12px)",
        duration: 0.7,
        ease: "power3.out",
      })
        .to(
          logoRef.current,
          {
            // soft halo pulse on the yellow glow
            filter: "drop-shadow(0 0 26px rgba(255,226,77,0.55))",
            duration: 0.5,
            ease: "sine.inOut",
          },
          "-=0.2",
        )
        .to(logoRef.current, { duration: 0.6 }) // hold ~600ms
        .to(rootRef.current, {
          yPercent: -100,
          duration: 0.7,
          ease: "power3.inOut",
        });
    }, rootRef);

    return () => {
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
