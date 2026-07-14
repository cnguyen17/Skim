// src/components/WorkFridge.tsx
// §6 "The Work" — a real 3D fridge (Three.js). The cabinet/door live in the lazy
// FridgeScene; this component owns state (open / which item is playing), the
// toggle button, and the HTML overlay player that pops over the canvas so only
// ONE iframe is ever mounted (§9).
//
// Progressive enhancement: on small screens, under prefers-reduced-motion, or
// without WebGL we render the original accessible <WorkTabs/> tabbed grid.

import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { site } from "../data/site.config";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useLenis } from "./LenisProvider";
import { WorkTabs } from "./WorkTabs";
import type { FridgeItem, FridgeLayout, FridgeScreen } from "../three/FridgeScene";

const FridgeScene = lazy(() => import("../three/FridgeScene"));

type Media = { type: "youtube" | "spotify"; id: string; title: string };

function webglAvailable() {
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

// Build the carton list + a key→media lookup once, straight from config.
function buildItems(): { items: FridgeItem[]; media: Record<string, Media> } {
  const items: FridgeItem[] = [];
  const media: Record<string, Media> = {};

  site.producing.forEach((p, i) => {
    const key = `prod-${i}`;
    items.push({
      key,
      title: p.title,
      badge: p.type === "spotify" ? "TRACK" : "PROD",
      group: "producing",
      ...(p.type === "youtube"
        ? {
            thumb: `https://img.youtube.com/vi/${p.id}/maxresdefault.jpg`,
            thumbAlt: `https://img.youtube.com/vi/${p.id}/hqdefault.jpg`,
          }
        : { spotifyId: p.id }),
    });
    media[key] = { type: p.type, id: p.id, title: p.title };
  });
  site.sets.forEach((s, i) => {
    const key = `set-${i}`;
    items.push({
      key,
      title: s.title,
      badge: `SET ${String(i + 1).padStart(2, "0")}`,
      group: "set",
      thumb: `https://img.youtube.com/vi/${s.id}/maxresdefault.jpg`,
      thumbAlt: `https://img.youtube.com/vi/${s.id}/hqdefault.jpg`,
    });
    media[key] = { type: "youtube", id: s.id, title: s.title };
  });
  site.collaborations.forEach((c, i) => {
    const key = `collab-${i}`;
    items.push({
      key,
      title: c.title,
      badge: "COLLAB",
      group: "collab",
      ...(c.type === "youtube"
        ? {
            thumb: `https://img.youtube.com/vi/${c.id}/maxresdefault.jpg`,
            thumbAlt: `https://img.youtube.com/vi/${c.id}/hqdefault.jpg`,
          }
        : {}),
    });
    media[key] = { type: c.type, id: c.id, title: c.title };
  });

  return { items, media };
}

export function WorkFridge() {
  const isSmall = useMediaQuery("(max-width: 768px)");
  const reducedMotion = useReducedMotion();
  const lenis = useLenis();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [layout, setLayout] = useState<FridgeLayout>({ producing: null, sets: null });
  const [screen, setScreen] = useState<FridgeScreen>(null);
  const { items, media } = useMemo(buildItems, []);

  // WebGL probe runs after mount so SSR/build never touches the DOM.
  const [hasWebgl, setHasWebgl] = useState<boolean | null>(null);
  useEffect(() => setHasWebgl(webglAvailable()), []);

  // Lock page scroll while the fridge fills the viewport.
  useEffect(() => {
    if (!expanded) return;
    lenis?.stop();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      lenis?.start();
      document.body.style.overflow = prev;
    };
  }, [expanded, lenis]);

  // Esc: close player → exit fullscreen → close fridge.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (activeKey) setActiveKey(null);
      else if (expanded) setExpanded(false);
      else if (open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeKey, expanded, open]);

  // Fallback path — the original accessible tabbed grid.
  if (isSmall || reducedMotion || hasWebgl === false) return <WorkTabs />;

  const active = activeKey ? media[activeKey] : null;

  const select = (key: string) => {
    setActiveKey(key);
    setOpen(true);
  };
  const toggle = () => {
    setOpen((o) => {
      if (o) setActiveKey(null); // closing also clears the player
      return !o;
    });
  };

  return (
    <div className={`fridge3d${expanded ? " fridge3d--expanded" : ""}`}>
      {/* Holds scroll layout while the stage is position:fixed. */}
      {expanded && <div className="fridge3d__spacer" aria-hidden />}

      <div
        className="fridge3d__stage"
        role={expanded ? "dialog" : undefined}
        aria-modal={expanded ? true : undefined}
        aria-label={expanded ? "Fridge — fullscreen" : undefined}
      >
        {/* hasWebgl===null on first paint: render nothing heavy until probed. */}
        {hasWebgl && (
          <Suspense fallback={<div className="fridge3d__loading">Loading the fridge…</div>}>
            <FridgeScene
              items={items}
              open={open}
              selectedKey={activeKey}
              expanded={expanded}
              onToggle={toggle}
              onSelect={select}
              onLayout={setLayout}
              onScreen={setScreen}
            />
          </Suspense>
        )}

        {/* Category leader-lines — hide while a carton is zoomed so they don't sit on top of the player. */}
        {open && !activeKey && layout.producing && (
          <div
            className="fridge3d__label"
            style={{ left: `${layout.producing.x * 100}%`, top: `${layout.producing.y * 100}%` }}
          >
            <span className="fridge3d__label-line" />
            <span className="fridge3d__label-text">Producing</span>
          </div>
        )}
        {open && !activeKey && layout.sets && (
          <div
            className="fridge3d__label"
            style={{ left: `${layout.sets.x * 100}%`, top: `${layout.sets.y * 100}%` }}
          >
            <span className="fridge3d__label-line" />
            <span className="fridge3d__label-text">DJ Sets</span>
          </div>
        )}

        {/* The video plays IN the zoomed carton's face window (rect from the 3D
            scene). One iframe at a time; the carton's printed title stays visible
            below it on the carton itself. */}
        {active && screen && (
          <div
            key={activeKey}
            className={`fridge3d__screen${active.type === "spotify" ? " fridge3d__screen--audio" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
            style={{
              left: `${screen.x * 100}%`,
              top: `${screen.y * 100}%`,
              width: `${screen.w * 100}%`,
              height: `${screen.h * 100}%`,
            }}
          >
            {active.type === "youtube" ? (
              <iframe
                title={active.title}
                src={`https://www.youtube-nocookie.com/embed/${active.id}?autoplay=1&rel=0&modestbranding=1`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            ) : (
              <iframe
                title={active.title}
                src={`https://open.spotify.com/embed/track/${active.id}?utm_source=skim`}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              />
            )}
          </div>
        )}

        {/* Stage chrome — enlarge lives inside the frame; Close when a carton is open. */}
        <div className="fridge3d__chrome">
          {active && (
            <button type="button" className="fridge3d__close" onClick={() => setActiveKey(null)}>
              Put carton back
            </button>
          )}
          <button
            type="button"
            className="fridge3d__enlarge"
            aria-label={expanded ? "Exit fullscreen" : "Enlarge fridge"}
            aria-pressed={expanded}
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="fridge3d__ui">
        <span className="fridge3d__hint">
          {expanded
            ? "Click the fridge to open it, then pick a carton — Esc to exit"
            : "Click the fridge to open it, then pick a carton"}
        </span>
        <button type="button" className="fridge3d__toggle" aria-pressed={open} onClick={toggle}>
          {open ? "Close fridge" : "Open the fridge"}
        </button>
      </div>
    </div>
  );
}
