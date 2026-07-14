// src/components/CollabTimelinePreview.tsx
// A compact agenda of the most recent shows, sitting inside the Collaborations
// section. Two animations run on two different axes so they never fight:
//
//   X — the rows converge "outside-in" (odd from the left, even from the right),
//       scrubbed against the panel entering the viewport.
//   Y — once settled and idle, the track drifts upward inside a masked, fixed
//       height panel: a slow ticker. It moves the TRACK, the scrub moves the
//       ROWS, so the two never touch the same transform.
//
// The ticker deliberately never touches page scroll — doing so would fight
// Lenis's momentum and steal the viewport. It yields instantly to any real
// scroll, hover, or focus.
//
// §11: under reduced motion there is no GSAP at all — it renders as a plain,
// static, fully-visible list.

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { dateBlock, recentEvents, type TimelineEvent } from "../data/timeline";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useLenis } from "./LenisProvider";

const PREVIEW_COUNT = 10;
/** Seconds each row takes to drift past — high enough to read as ambient, not motion. */
const SECONDS_PER_ROW = 3.2;
/** How long after the last scroll event before the ticker may resume. */
const IDLE_MS = 400;

function EventRow({ event }: { event: TimelineEvent }) {
  const { primary, secondary } = dateBlock(event);

  return (
    <div className="timeline-row flex items-center gap-4 rounded-xl border border-line bg-milk/[0.03] px-4 py-3 sm:gap-6 sm:px-5 sm:py-4">
      <div className="w-16 shrink-0 text-center sm:w-[72px]">
        <div className="font-display text-3xl leading-none text-milk sm:text-4xl">
          {primary}
        </div>
        {/* nowrap: "JUN 2026" otherwise breaks across two lines in this column */}
        <div className="mt-1 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.08em] text-mid">
          {secondary}
        </div>
      </div>

      <div className="min-w-0 flex-1 text-right">
        <p className="truncate font-display text-lg uppercase leading-tight text-milk sm:text-xl">
          {event.title}
        </p>
        <p className="mt-1 truncate font-body text-xs text-mid sm:text-sm">
          {event.venue} · {event.city}
        </p>
      </div>
    </div>
  );
}

export function CollabTimelinePreview() {
  const reducedMotion = useReducedMotion();
  const lenis = useLenis();

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  const tickerRef = useRef<gsap.core.Tween | null>(null);
  // Kept off React state on purpose: scroll fires constantly, and re-rendering
  // 20 rows on every frame to toggle a tween would be absurd.
  const gate = useRef({
    settled: false,
    inView: false,
    hovered: false,
    scrolling: false,
  });

  const events = recentEvents(PREVIEW_COUNT);

  /** Single decision point: the ticker runs only when everything says it may. */
  const sync = useCallback(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;

    const g = gate.current;
    const shouldRun = g.settled && g.inView && !g.hovered && !g.scrolling;

    if (shouldRun && ticker.paused()) ticker.play();
    else if (!shouldRun && !ticker.paused()) ticker.pause();
  }, []);

  useLayoutEffect(() => {
    if (reducedMotion) return;

    const root = rootRef.current;
    const panel = panelRef.current;
    const track = trackRef.current;
    if (!root || !panel || !track) return;

    const ctx = gsap.context(() => {
      const rows = gsap.utils.toArray<HTMLElement>(".timeline-row", track);

      // X — outside-in convergence, scrubbed by the section entering view.
      gsap.fromTo(
        rows,
        {
          x: (i: number) => (i % 2 === 0 ? -64 : 64),
          autoAlpha: 0,
        },
        {
          x: 0,
          autoAlpha: 1,
          ease: "none",
          stagger: { each: 0.05 },
          scrollTrigger: {
            trigger: panel,
            start: "top 90%",
            end: "top 45%",
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              // Only let the ticker start once every row has landed at x:0 —
              // otherwise a duplicate row could drift into view still parked
              // off-axis at x:-64.
              gate.current.settled = self.progress >= 1;
              sync();
            },
          },
        },
      );

      // Y — the idle ticker. The track holds two identical copies of the rows,
      // so travelling exactly half its height lands copy 2 where copy 1 began:
      // the reset to y:0 is invisible.
      const loopDistance = () => track.scrollHeight / 2;

      tickerRef.current = gsap.fromTo(
        track,
        { y: 0 },
        {
          y: () => -loopDistance(),
          duration: events.length * SECONDS_PER_ROW,
          ease: "none",
          repeat: -1,
          paused: true,
          invalidateOnRefresh: true,
        },
      );

      // Cheap in/out gate so the tween isn't burning frames off-screen.
      ScrollTrigger.create({
        trigger: panel,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          gate.current.inView = self.isActive;
          sync();
        },
      });

      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    }, root);

    return () => {
      ctx.revert();
      tickerRef.current = null;
    };
  }, [reducedMotion, events.length, sync]);

  // Any real scroll input takes priority: pause the drift, resume once idle.
  useEffect(() => {
    if (reducedMotion) return;

    let idleTimer = 0;
    const onScroll = () => {
      if (!gate.current.scrolling) {
        gate.current.scrolling = true;
        sync();
      }
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        gate.current.scrolling = false;
        sync();
      }, IDLE_MS);
    };

    // Lenis owns the scroll when it's alive; fall back to the native event.
    if (lenis) lenis.on("scroll", onScroll);
    else window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(idleTimer);
      if (lenis) lenis.off("scroll", onScroll);
      else window.removeEventListener("scroll", onScroll);
      gate.current.scrolling = false;
    };
  }, [lenis, reducedMotion, sync]);

  const setHovered = (hovered: boolean) => {
    gate.current.hovered = hovered;
    sync();
  };

  // Duplicated only to feed the seamless loop; the copy is decorative.
  const rows = reducedMotion ? events : [...events, ...events];

  return (
    // Capped width: stretched across the full section the date block and the
    // right-aligned title end up on opposite sides of a void.
    <div ref={rootRef} className="mx-auto mt-16 max-w-3xl sm:mt-20">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
          Event history
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mid">
          {events.length} of 46 shows
        </p>
      </div>

      <div
        ref={panelRef}
        className={
          reducedMotion
            ? "relative"
            : "relative h-[520px] overflow-hidden"
        }
        style={
          reducedMotion
            ? undefined
            : {
                maskImage:
                  "linear-gradient(to bottom, transparent, #000 10%, #000 88%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent, #000 10%, #000 88%, transparent)",
              }
        }
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setHovered(true)}
        onBlurCapture={(e) => {
          if (!panelRef.current?.contains(e.relatedTarget as Node)) setHovered(false);
        }}
      >
        <ul ref={trackRef} className="space-y-3">
          {rows.map((event, i) => (
            <li
              key={`${event.id}-${i}`}
              // The second copy exists purely so the loop has no seam — screen
              // readers should only hear the list once.
              aria-hidden={i >= events.length || undefined}
            >
              <EventRow event={event} />
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          to="/collaborations/timeline"
          className="rounded-full bg-accent px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-ink transition-transform hover:-translate-y-0.5"
        >
          Explore more
        </Link>
      </div>
    </div>
  );
}
