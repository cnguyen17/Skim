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

import { useEffect, useState, type RefObject } from "react";
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

// EVENTUAL: cycle through aligned sunglasses frames, fast at first then settling
// on the last pair as the window shrinks (progress 0 → ~0.5). Preload all frames.
// This branch only runs once `faceFrames` is non-empty; the scroll/scale logic in
// Hero is untouched either way.
function FaceSubject({ progress }: { progress: RefObject<number> }) {
  const frames = site.hero.faceFrames;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (frames.length === 0) return;
    let raf = 0;
    const ease = (x: number) => 1 - Math.pow(1 - x, 2); // power2.out
    const tick = () => {
      const p = Math.min((progress.current ?? 0) / 0.5, 1);
      const next = Math.min(frames.length - 1, Math.floor(ease(p) * frames.length));
      setIdx((cur) => (cur === next ? cur : next));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [frames.length, progress]);

  if (frames.length === 0) return <LogoSubject />; // safe fallback until provided

  return (
    <div className="relative h-full w-full">
      {frames.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-75"
          style={{ opacity: i === idx ? 1 : 0 }}
          draggable={false}
        />
      ))}
    </div>
  );
}

export function Centerpiece({
  variant,
  progress,
}: {
  variant: "logo" | "face";
  progress: RefObject<number>;
}) {
  return variant === "face" ? <FaceSubject progress={progress} /> : <LogoSubject />;
}
