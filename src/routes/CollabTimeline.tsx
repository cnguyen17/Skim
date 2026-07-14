// src/routes/CollabTimeline.tsx
// The full event history — 46 shows, newest first, as a zigzag timeline around a
// centre spine. Year markers on the spine make the arc legible: DJ MIKS at SIP
// Little Tokyo → resident → headliner.
//
// §8: each row's image and text slide in from opposite outer edges, scrubbed.
// §11: under reduced motion no GSAP runs at all and every row renders static.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap, ScrollTrigger } from "../lib/gsap";
import {
  eventYear,
  formatEventDate,
  isAliasBilling,
  timelineNewestFirst,
  type TimelineEvent,
} from "../data/timeline";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useLenis } from "../components/LenisProvider";
import { Lightbox, type LightboxItem } from "../components/Lightbox";

/** Rows and year markers interleaved, so one map renders the whole spine. */
type Node =
  | { kind: "year"; year: number }
  | { kind: "event"; event: TimelineEvent; index: number };

function buildNodes(events: TimelineEvent[]): Node[] {
  const nodes: Node[] = [];
  let currentYear: number | null = null;

  events.forEach((event, index) => {
    const year = eventYear(event);
    if (year !== currentYear) {
      nodes.push({ kind: "year", year });
      currentYear = year;
    }
    nodes.push({ kind: "event", event, index });
  });

  return nodes;
}

function Chip({ children, accent = false }: { children: string; accent?: boolean }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
        accent ? "border-accent/50 text-accent" : "border-line text-mid"
      }`}
    >
      {children}
    </span>
  );
}

export default function CollabTimeline() {
  const reducedMotion = useReducedMotion();
  const lenis = useLenis();

  const rootRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const events = timelineNewestFirst;
  const nodes = useMemo(() => buildNodes(events), [events]);

  const lightboxItems = useMemo<LightboxItem[]>(
    () => events.map((e) => ({ src: e.image, alt: `${e.title} — ${e.venue}, ${e.city}` })),
    [events],
  );

  // React Router keeps the old scroll position across routes, and Layout only
  // scrolls when there's a hash — so arriving from a scrolled-down Home would
  // land mid-page.
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [lenis]);

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (dir: number) =>
      setOpenIndex((i) => (i === null ? i : (i + dir + events.length) % events.length)),
    [events.length],
  );

  useLayoutEffect(() => {
    if (reducedMotion) return;
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      // Each row's two halves converge from opposite outer edges.
      gsap.utils.toArray<HTMLElement>(".tl-row").forEach((row) => {
        const media = row.querySelector<HTMLElement>(".tl-media");
        const body = row.querySelector<HTMLElement>(".tl-body");
        if (!media || !body) return;

        // Even rows put the image on the left, so that's the edge it flies from.
        const fromLeft = row.dataset.side === "left";

        gsap.fromTo(
          [media, body],
          {
            x: (i: number) => {
              const isMedia = i === 0;
              const outward = isMedia === fromLeft ? -72 : 72;
              return outward;
            },
            autoAlpha: 0,
          },
          {
            x: 0,
            autoAlpha: 1,
            ease: "none",
            stagger: { each: 0.08 },
            scrollTrigger: {
              trigger: row,
              start: "top 88%",
              end: "top 55%",
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      });

      // Year markers light up as you pass them.
      gsap.utils.toArray<HTMLElement>(".tl-year").forEach((marker) => {
        ScrollTrigger.create({
          trigger: marker,
          start: "top 60%",
          end: "bottom top",
          onToggle: (self) => marker.classList.toggle("is-active", self.isActive),
        });
      });

      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    }, root);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    // overflow-x-clip: the scrub parks rows at x:±72 mid-animation, and CSS
    // transforms count toward the scrollable overflow area — without this the
    // page scrolls sideways on mobile, where the container has no slack.
    <div ref={rootRef} className="overflow-x-clip border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        {/* Header */}
        <header className="mb-16 lg:mb-24">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            Event history
          </p>
          <h1 className="mt-5 font-display text-5xl uppercase leading-none tracking-tight text-milk sm:text-7xl lg:text-8xl">
            Timeline
          </h1>
          <p className="mt-6 max-w-xl font-body text-sm text-mid sm:text-base">
            {events.length} shows, Dec 2023 → Jul 2026 — from DJ MIKS at SIP Little
            Tokyo to residencies and headline billings.
          </p>
          <Link
            to="/#collaborations"
            className="mt-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-mid transition-colors hover:text-accent"
          >
            ‹ Back to collaborations
          </Link>
        </header>

        {/* Spine + rows */}
        <div className="relative">
          {/* The spine itself — left rail on mobile, centred on desktop. */}
          <div
            aria-hidden
            className="absolute bottom-0 left-5 top-0 w-px bg-line lg:left-1/2 lg:-translate-x-1/2"
          />

          <ol className="space-y-12 lg:space-y-16">
            {nodes.map((node) =>
              node.kind === "year" ? (
                <li key={`year-${node.year}`} className="relative">
                  <div className="flex lg:justify-center">
                    <span className="tl-year rounded-full border border-line bg-ink px-4 py-1.5 font-display text-xl uppercase tracking-wide text-mid transition-colors duration-300 sm:text-2xl">
                      {node.year}
                    </span>
                  </div>
                </li>
              ) : (
                <TimelineRow
                  key={node.event.id}
                  event={node.event}
                  index={node.index}
                  onOpen={() => setOpenIndex(node.index)}
                />
              ),
            )}
          </ol>
        </div>

        <div className="mt-20 flex justify-center">
          <Link
            to="/#collaborations"
            className="rounded-full bg-accent px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-ink transition-transform hover:-translate-y-0.5"
          >
            Back to collaborations
          </Link>
        </div>
      </div>

      {openIndex !== null && (
        <Lightbox
          items={lightboxItems}
          index={openIndex}
          onClose={close}
          onStep={step}
          caption={`${events[openIndex].title} — ${formatEventDate(events[openIndex])}`}
        />
      )}
    </div>
  );
}

function TimelineRow({
  event,
  index,
  onOpen,
}: {
  event: TimelineEvent;
  index: number;
  onOpen: () => void;
}) {
  // Alternate which side the flyer lands on; "left" means image-left/text-right.
  const side = index % 2 === 0 ? "left" : "right";

  return (
    <li
      className="tl-row relative"
      data-side={side}
    >
      {/* Node dot on the spine */}
      <span
        aria-hidden
        className="absolute left-[15px] top-3 h-2.5 w-2.5 rounded-full border border-accent bg-ink lg:left-1/2 lg:-translate-x-1/2"
      />

      <div className="grid grid-cols-1 gap-5 pl-12 lg:grid-cols-2 lg:gap-14 lg:pl-0">
        {/* Flyer — capped and pulled toward the spine, so 46 rows stay scannable
            rather than becoming 46 full-column posters. */}
        <div
          className={`tl-media w-full max-w-[280px] sm:max-w-[320px] ${
            side === "left"
              ? "lg:order-1 lg:justify-self-end"
              : "lg:order-2 lg:justify-self-start"
          }`}
        >
          <button
            type="button"
            onClick={onOpen}
            aria-label={`View flyer for ${event.title}`}
            className="group block w-full overflow-hidden rounded-xl border border-line bg-ink-2 shadow-lg shadow-ink/50 transition-transform hover:-translate-y-0.5"
          >
            <div className="aspect-[4/5] w-full overflow-hidden">
              <img
                src={event.image}
                alt={`${event.title} flyer — ${event.venue}, ${event.city}`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
          </button>
        </div>

        {/* Copy */}
        <div
          className={`tl-body flex max-w-md flex-col justify-center ${
            side === "left"
              ? "lg:order-2 lg:justify-self-start lg:text-left"
              : "lg:order-1 lg:justify-self-end lg:text-right"
          }`}
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            {formatEventDate(event)}
          </p>

          <h2 className="mt-3 font-display text-2xl uppercase leading-tight text-milk sm:text-3xl">
            {event.title}
          </h2>

          {event.presenter && (
            <p className="mt-2 font-body text-sm text-mid">
              Presented by {event.presenter}
            </p>
          )}

          <p className="mt-3 font-body text-sm text-milk/80">
            {event.venue}
            <span className="text-mid"> · {event.city}</span>
          </p>

          <div
            className={`mt-4 flex flex-wrap gap-2 ${
              side === "left" ? "lg:justify-start" : "lg:justify-end"
            }`}
          >
            {isAliasBilling(event.billedAs) && <Chip accent>{event.billedAs}</Chip>}
            {event.collaborators.map((name) => (
              <Chip key={name}>{name}</Chip>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}
