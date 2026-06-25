// src/components/Nav.tsx
// §6 information architecture. Top-left: SKIM wordmark (→ Home) + a Menu button
// that opens a full-screen overlay of .roll links. Top-right: "Get in contact"
// → Booking. §11: the overlay traps focus, closes on Esc, restores focus to the
// trigger, and locks scroll while open.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { site } from "../data/site.config";
import { RollText } from "./RollText";
import { useLenis } from "./LenisProvider";
import { getHeroTheme, subscribeHeroTheme } from "../lib/heroTheme";

type MenuItem = { label: string; to: string };

// §6 menu. "DJ Info" targets the bio section on Home; the rest are routes.
const MENU: MenuItem[] = [
  { label: "Home", to: "/" },
  { label: "DJ Info", to: "/#bio" },
  { label: "DJ Sets", to: "/sets" },
  { label: "Equipment Rentals", to: "/equipment" },
  { label: "Booking", to: "/booking" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const lenis = useLenis();

  // Invert with the hero background (HERO_SEQUENCE §2E). Discrete flip from the
  // heroTheme store — no re-render on scroll frames. "light" only on the light
  // hero opening; everywhere else it's "dark" (the store's default).
  const heroTheme = useSyncExternalStore(subscribeHeroTheme, getHeroTheme, () => "dark" as const);
  const light = heroTheme === "light";

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock scroll + trap focus + Esc handling while open.
  useEffect(() => {
    if (!open) return;
    lenis?.stop();
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    );
    focusables?.[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "Tab" && focusables && focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lenis?.start();
      previouslyFocused?.focus?.();
    };
  }, [open, lenis]);

  // Navigate, handling "/#bio" style in-page anchors via Lenis when possible.
  const go = useCallback(
    (to: string) => {
      setOpen(false);
      const [path, hash] = to.split("#");
      const targetPath = path || "/";
      const scrollToHash = () => {
        if (!hash) return;
        const el = document.getElementById(hash);
        if (!el) return;
        if (lenis) lenis.scrollTo(el, { offset: -64 });
        else el.scrollIntoView({ behavior: "auto", block: "start" });
      };

      if (location.pathname === targetPath) {
        if (hash) scrollToHash();
        else lenis ? lenis.scrollTo(0) : window.scrollTo(0, 0);
      } else {
        navigate(targetPath);
        if (hash) setTimeout(scrollToHash, 300);
      }
    },
    [lenis, location.pathname, navigate],
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
          {/* Left: logo + menu */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              to="/"
              aria-label={`${site.name} — home`}
              className="block shrink-0"
              onClick={(e) => {
                if (location.pathname === "/") {
                  e.preventDefault();
                  lenis ? lenis.scrollTo(0) : window.scrollTo(0, 0);
                }
              }}
            >
              <img
                src={site.assets.logo}
                alt={`${site.name} wordmark logo`}
                width={120}
                height={48}
                className="h-9 w-auto sm:h-10"
              />
            </Link>

            <button
              ref={triggerRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="dialog"
              className={`group flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] transition-colors ${
                light ? "text-ink/80 hover:text-ink" : "text-milk/90 hover:text-milk"
              }`}
            >
              <span className="flex flex-col gap-[3px]" aria-hidden>
                <span className="block h-px w-5 bg-current" />
                <span className="block h-px w-5 bg-current" />
              </span>
              <RollText text="Menu" />
            </button>
          </div>

          {/* Right: get in contact — filled cyan on the light hero (high contrast,
              like Lando's top-right CTA), readable secondary pill on dark. */}
          <Link
            to="/booking"
            className={
              light
                ? "rounded-full bg-accent px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-ink transition-transform hover:-translate-y-0.5"
                : "rounded-full border border-milk/40 bg-ink/40 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-milk backdrop-blur transition-colors hover:border-accent hover:text-accent"
            }
          >
            <RollText text="Get in contact" />
          </Link>
        </div>
      </header>

      {/* Overlay menu */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        hidden={!open}
        className={`fixed inset-0 z-[60] flex flex-col bg-ink/95 backdrop-blur-xl transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 sm:px-8">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-mid">
            {site.tagline}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="font-mono text-xs uppercase tracking-[0.25em] text-milk hover:text-accent"
          >
            <RollText text="Close" /> ✕
          </button>
        </div>

        <nav className="flex flex-1 flex-col justify-center gap-2 px-5 sm:px-8">
          {MENU.map((item, i) => (
            <button
              key={item.to}
              type="button"
              onClick={() => go(item.to)}
              className="group flex items-baseline gap-4 py-1 text-left"
            >
              <span className="font-mono text-xs text-mid tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <RollText
                text={item.label}
                as="span"
                className="font-display text-4xl uppercase leading-none text-milk transition-colors group-hover:text-accent sm:text-6xl"
              />
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
