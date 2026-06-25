// src/components/Centerpiece.tsx
// HERO_SEQUENCE §2B/§3 — the swappable hero subject that lives inside the framed
// "window". The window's scale / frame / exit are driven by the Hero timeline;
// this component only renders the SUBJECT, so the scroll logic never assumes
// which variant is mounted.
//
//  variant="logo"  (NOW): the SKIM wordmark, idle-floated by the Hero.
//  variant="face"  (EVENTUAL, scaffolded): skim's face with the sunglasses
//                  frame-swap — stacked, pixel-aligned frames whose visible index
//                  is mapped from scroll progress, easing to settle on a final
//                  pair. Inert until `site.hero.faceFrames` is populated.

import { forwardRef, useEffect, useState, type RefObject } from "react";
import { site } from "../data/site.config";

function LogoSubject() {
  return (
    <img
      src={site.assets.logo}
      alt={`${site.name} wordmark logo`}
      width={680}
      height={272}
      className="h-full w-full object-contain p-[8%]"
      draggable={false}
    />
  );
}

// STAGE 1 FILTER (HERO_SEQUENCE §3): the sunglasses frame-swap. Aligned, transparent
// face cutouts are stacked and only the active index is opaque, so the face appears
// to flip through pairs of glasses. Driven by the SAME scroll progress the rest of
// the hero uses: progress 0.00 → 0.45 maps to a frame index that cycles through ALL
// frames, decelerating (power3.out) and settling on `settleFrame` by 0.45 — i.e.
// filtering finishes before Stage 2 (recede + logo reveal). The scroll/scale/exit logic
// in Hero is untouched; this component only chooses which frame is visible.
const FILTER_END = 0.45; // p at which the cycle has settled (Stage 1 → Stage 2 handoff)
const power3Out = (x: number) => 1 - Math.pow(1 - x, 3);

function FaceFilter({
  progress,
  settled,
}: {
  progress: RefObject<number>;
  settled: boolean; // reduced motion / static hero: lock to settleFrame, no cycle
}) {
  const frames = site.hero.faceFrames;
  const n = frames.length;
  const settleFrame = Math.min(Math.max(site.hero.settleFrame, 0), Math.max(n - 1, 0));
  const [idx, setIdx] = useState(settled ? settleFrame : 0);

  // Preload every frame once so the swap never flickers on first reveal.
  useEffect(() => {
    frames.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [frames]);

  useEffect(() => {
    if (n === 0 || settled) {
      setIdx(settleFrame);
      return;
    }
    let raf = 0;
    const tick = () => {
      const t = Math.min((progress.current ?? 0) / FILTER_END, 1);
      // Decelerating cycle through all frames; snap to settleFrame once settled.
      const next = t >= 1 ? settleFrame : Math.min(n - 1, Math.floor(power3Out(t) * n));
      setIdx((cur) => (cur === next ? cur : next));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [n, settleFrame, settled, progress]);

  if (n === 0) return <LogoSubject />; // safe fallback until frames are provided

  const { objectFit, objectPosition } = site.hero.faceFraming;

  return (
    <div className="relative h-full w-full">
      {frames.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={i === settleFrame ? `${site.name}` : ""}
          aria-hidden={i !== settleFrame}
          className="absolute inset-0 h-full w-full"
          style={{
            objectFit,
            objectPosition,
            opacity: i === idx ? 1 : 0,
          }}
          draggable={false}
        />
      ))}
    </div>
  );
}

export const Centerpiece = forwardRef<
  HTMLDivElement,
  {
    variant: "logo" | "face";
    progress: RefObject<number>;
    settled?: boolean;
  }
>(function Centerpiece({ variant, progress, settled = false }, ref) {
  return (
    <div
      ref={ref}
      className="absolute inset-0 h-full w-full will-change-transform"
      style={{ transformOrigin: "50% 50%" }}
    >
      {variant === "face" ? (
        <FaceFilter progress={progress} settled={settled} />
      ) : (
        <LogoSubject />
      )}
    </div>
  );
});
