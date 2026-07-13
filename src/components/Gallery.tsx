// src/components/Gallery.tsx
// Paginated set-photo grid (Schoeny-style): slides a full page of thumbnails,
// auto-advances every 8s, click opens a minimal lightbox with counter + arrows.
// Photos come from site.config.gallery (§0). §11: Esc/arrows;
// reduced-motion disables auto-advance.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { site } from "../data/site.config";
import { useReducedMotion } from "../hooks/useReducedMotion";

type Photo = { src: string; set: string; alt: string };

const AUTO_MS = 8000;
const ROWS = 3;

function pageSizeForWidth(w: number): number {
  if (w < 640) return 2 * ROWS; // 2×3
  if (w < 1024) return 3 * ROWS; // 3×3
  return 4 * ROWS; // 4×3
}

export function Gallery() {
  const photos = site.gallery as Photo[];
  const reducedMotion = useReducedMotion();

  const [pageSize, setPageSize] = useState(() =>
    typeof window !== "undefined" ? pageSizeForWidth(window.innerWidth) : 12,
  );
  const [page, setPage] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [slideDir, setSlideDir] = useState<0 | 1 | -1>(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const pageCount = Math.max(1, Math.ceil(photos.length / pageSize));

  useLayoutEffect(() => {
    const onResize = () => setPageSize(pageSizeForWidth(window.innerWidth));
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Keep page in range when pageSize changes.
  useEffect(() => {
    setPage((p) => Math.min(p, pageCount - 1));
  }, [pageCount]);

  const goPage = useCallback(
    (next: number, dir: 1 | -1) => {
      setSlideDir(dir);
      setPage(((next % pageCount) + pageCount) % pageCount);
    },
    [pageCount],
  );

  const prevPage = useCallback(() => goPage(page - 1, -1), [goPage, page]);
  const nextPage = useCallback(() => goPage(page + 1, 1), [goPage, page]);

  // Auto-advance every 8s when multiple pages and not paused / lightbox / PRM.
  useEffect(() => {
    if (
      reducedMotion ||
      paused ||
      openIndex !== null ||
      pageCount <= 1 ||
      photos.length === 0
    ) {
      return;
    }
    const id = window.setInterval(() => {
      setSlideDir(1);
      setPage((p) => (p + 1) % pageCount);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion, paused, openIndex, pageCount, photos.length]);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (dir: number) =>
      setOpenIndex((i) =>
        i === null ? i : (i + dir + photos.length) % photos.length,
      ),
    [photos.length],
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

  const pagePhotos = useMemo(() => {
    const start = page * pageSize;
    return photos.slice(start, start + pageSize).map((p, i) => ({
      photo: p,
      globalIndex: start + i,
    }));
  }, [photos, page, pageSize]);

  const cols =
    pageSize === 6 ? "grid-cols-2" : pageSize === 9 ? "grid-cols-3" : "grid-cols-4";

  if (photos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-ink-2 p-10 text-center">
        <p className="font-display text-2xl uppercase text-milk">Photos coming soon</p>
        <p className="mt-2 font-body text-sm text-mid">
          Set photography drops here.
        </p>
      </div>
    );
  }

  const current = openIndex === null ? null : photos[openIndex];

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) setPaused(false);
      }}
    >
      {/* Paginated grid — mid size: readable thumbs, not full-bleed */}
      <div className="relative mx-auto w-full max-w-4xl px-9 sm:px-11">
        <button
          type="button"
          onClick={prevPage}
          aria-label="Previous photo page"
          disabled={pageCount <= 1}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 font-mono text-2xl text-mid transition-colors hover:text-milk disabled:opacity-30 sm:text-3xl"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={nextPage}
          aria-label="Next photo page"
          disabled={pageCount <= 1}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 font-mono text-2xl text-mid transition-colors hover:text-milk disabled:opacity-30 sm:text-3xl"
        >
          ›
        </button>

        <div
          key={page}
          className={`grid ${cols} gap-1.5 sm:gap-2 ${
            reducedMotion || slideDir === 0
              ? ""
              : slideDir === 1
                ? "animate-gallery-in-right"
                : "animate-gallery-in-left"
          }`}
        >
          {pagePhotos.map(({ photo, globalIndex }) => (
            <button
              key={photo.src}
              type="button"
              onClick={() => setOpenIndex(globalIndex)}
              className="group relative aspect-square overflow-hidden bg-ink-2"
            >
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                width={640}
                height={640}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <span className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/20" />
            </button>
          ))}
          {/* Fill incomplete last page so the grid height stays steady */}
          {Array.from({ length: Math.max(0, pageSize - pagePhotos.length) }).map(
            (_, i) => (
              <div key={`pad-${i}`} className="aspect-square bg-transparent" aria-hidden />
            ),
          )}
        </div>

        {/* Accent page cue */}
        {pageCount > 1 && (
          <div className="mt-5 flex items-center justify-center gap-3">
            <div className="flex gap-1.5" role="tablist" aria-label="Gallery pages">
              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === page}
                  aria-label={`Page ${i + 1}`}
                  onClick={() => goPage(i, i > page ? 1 : -1)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === page ? "w-5 bg-accent-2" : "w-1.5 bg-mid/50 hover:bg-mid"
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mid">
              {page + 1} / {pageCount}
            </span>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {current && openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Previous photo"
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
              {openIndex + 1} of {photos.length}
            </figcaption>
          </figure>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-milk/40 font-mono text-xl text-milk transition-colors hover:border-accent hover:text-accent sm:right-6 sm:h-14 sm:w-14"
          >
            ›
          </button>

          <button
            type="button"
            onClick={close}
            className="absolute right-5 top-5 font-mono text-xs uppercase tracking-[0.2em] text-milk/70 hover:text-accent"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
