// src/components/Lightbox.tsx
// Minimal full-screen image viewer — extracted from Gallery so the set-photo
// grid and the Collaborations timeline share one implementation (§11: Esc to
// close, ←/→ to step, body scroll locked while open).

import { useEffect } from "react";

export type LightboxItem = { src: string; alt: string };

export function Lightbox({
  items,
  index,
  onClose,
  onStep,
  caption,
}: {
  items: LightboxItem[];
  /** Index into `items` of the image on screen. */
  index: number;
  onClose: () => void;
  /** dir is +1 (next) or -1 (previous); wrapping is the caller's business. */
  onStep: (dir: number) => void;
  /** Overrides the default "3 of 46" counter. */
  caption?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onStep(1);
      if (e.key === "ArrowLeft") onStep(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onStep]);

  const current = items[index];
  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.alt}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onStep(-1);
        }}
        aria-label="Previous image"
        className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-milk/40 font-mono text-xl text-milk transition-colors hover:border-accent hover:text-accent sm:left-6 sm:h-14 sm:w-14"
      >
        ‹
      </button>

      <figure
        className="relative flex max-h-[88vh] max-w-[min(92vw,1100px)] flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.src}
          alt={current.alt}
          className="max-h-[80vh] w-auto max-w-full object-contain"
        />
        <figcaption className="mt-4 self-start font-mono text-xs uppercase tracking-[0.2em] text-mid">
          {caption ?? `${index + 1} of ${items.length}`}
        </figcaption>
      </figure>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onStep(1);
        }}
        aria-label="Next image"
        className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-milk/40 font-mono text-xl text-milk transition-colors hover:border-accent hover:text-accent sm:right-6 sm:h-14 sm:w-14"
      >
        ›
      </button>

      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 font-mono text-xs uppercase tracking-[0.2em] text-milk/70 hover:text-accent"
      >
        Close
      </button>
    </div>
  );
}
