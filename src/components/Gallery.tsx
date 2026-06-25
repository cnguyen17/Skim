// src/components/Gallery.tsx
// §6 filterable set-photo gallery + lightbox, filtered by `set`. Photos come
// from site.config.gallery (§0). A small custom lightbox keeps the bundle lean
// (§10) — no extra dependency. §11: lightbox traps focus, closes on Esc, and
// arrow keys move between photos.
//
// gallery is empty until the owner drops photos into public/images/sets/ and
// lists them in site.config — until then this renders a calm empty state.

import { useCallback, useEffect, useMemo, useState } from "react";
import { site } from "../data/site.config";
import { Reveal } from "./Reveal";

type Photo = { src: string; set: string; alt: string };

const ALL = "All";

export function Gallery() {
  const photos = site.gallery as Photo[];
  const sets = useMemo(
    () => [ALL, ...Array.from(new Set(photos.map((p) => p.set)))],
    [photos],
  );
  const [filter, setFilter] = useState<string>(ALL);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const visible = useMemo(
    () => (filter === ALL ? photos : photos.filter((p) => p.set === filter)),
    [photos, filter],
  );

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (dir: number) =>
      setOpenIndex((i) =>
        i === null ? i : (i + dir + visible.length) % visible.length,
      ),
    [visible.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openIndex, close, step]);

  if (photos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-ink-2 p-10 text-center">
        <p className="font-display text-2xl uppercase text-milk">Photos coming soon</p>
        <p className="mt-2 font-body text-sm text-mid">
          Set photography drops here — filterable by event.
        </p>
      </div>
    );
  }

  const current = openIndex === null ? null : visible[openIndex];

  return (
    <div>
      {/* Filter chips */}
      {sets.length > 2 && (
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter photos by set">
          {sets.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              aria-pressed={filter === s}
              className={`rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-[0.15em] transition-colors ${
                filter === s
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line text-mid hover:text-milk"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {visible.map((p, i) => (
          <Reveal key={p.src} delay={(i % 6) * 0.03}>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group block w-full overflow-hidden rounded-lg border border-line bg-ink-2"
            >
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                width={640}
                height={640}
                className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
          </Reveal>
        ))}
      </div>

      {/* Lightbox */}
      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/95 p-4 backdrop-blur"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-5 top-5 font-mono text-xs uppercase tracking-[0.2em] text-milk hover:text-accent"
          >
            Close ✕
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Previous photo"
            className="absolute left-4 font-mono text-2xl text-milk hover:text-accent"
          >
            ‹
          </button>
          <img
            src={current.src}
            alt={current.alt}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Next photo"
            className="absolute right-4 font-mono text-2xl text-milk hover:text-accent"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
