// src/components/Nav.tsx
// §6 information architecture. Top-left: SKIM wordmark (→ Home) + a Menu button
// that opens a full-screen overlay of .roll links. Top-right: "Get in contact"
// → Booking. §11: the overlay traps focus, closes on Esc, restores focus to the
// trigger, and locks scroll while open.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { site } from "../data/site.config";
import { useLenis } from "./LenisProvider";
import { getHeroTheme, subscribeHeroTheme } from "../lib/heroTheme";
import { scrollToSection } from "../lib/scrollToSection";

type MenuItem = { label: string; to: string };

// §6 menu. "DJ Info" targets the bio section on Home; the rest are routes.
const MENU: MenuItem[] = [
  { label: "Home", to: "/" },
  { label: "DJ Info", to: "/#bio" },
  { label: "DJ Sets", to: "/#work" },
  { label: "Collaborations", to: "/#collaborations" },
  { label: "Gallery", to: "/#gallery" },
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

  // Navigate — in-page hashes scroll to section tops; routes change pathname.
  const go = useCallback(
    (to: string) => {
      setOpen(false);
      const hashIndex = to.indexOf("#");
      const targetPath = hashIndex >= 0 ? to.slice(0, hashIndex) || "/" : to;
      const hash = hashIndex >= 0 ? to.slice(hashIndex + 1) : "";

      if (hash) {
        if (location.pathname !== targetPath) {
          navigate({ pathname: targetPath, hash });
        } else {
          navigate({ pathname: targetPath, hash }, { replace: true });
          // Defer until menu closes and Lenis restarts (menu calls lenis.stop()).
          setTimeout(() => scrollToSection(hash, lenis), 50);
        }
        return;
      }

      if (location.pathname === targetPath) {
        lenis ? lenis.scrollTo(0) : window.scrollTo(0, 0);
      } else {
        navigate(targetPath);
      }
    },
    [lenis, location.pathname, navigate],
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="flex items-start justify-between gap-3 px-5 py-3 sm:items-center sm:gap-4 sm:px-8 sm:py-4">
          {/* Left: logo with menu stacked under it on mobile */}
          <div className="flex min-w-0 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-6">
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
                className="h-8 w-auto sm:h-10"
              />
            </Link>

            <button
              ref={triggerRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="dialog"
              className={`group flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.22em] transition-colors sm:text-xs sm:tracking-[0.25em] ${
                light ? "text-ink/80 hover:text-ink" : "text-milk/90 hover:text-milk"
              }`}
            >
              <span className="flex flex-col gap-[3px]" aria-hidden>
                <span className="block h-px w-4 bg-current sm:w-5" />
                <span className="block h-px w-4 bg-current sm:w-5" />
              </span>
              Menu
            </button>
          </div>

          {/* Right: booking CTA — compact on small phones */}
          <div className="flex shrink-0 items-center pt-0.5 sm:pt-0">
            <Link
              to={site.ctas.booking.to}
              aria-label={site.ctas.booking.label}
              className="rounded-full bg-accent px-2.5 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink transition-transform hover:-translate-y-0.5 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em]"
            >
              <span className="sm:hidden" aria-hidden="true">
                Book
              </span>
              <span className="hidden sm:inline" aria-hidden="true">
                {site.ctas.booking.label}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Overlay backdrop */}
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
        className={`nav-backdrop fixed inset-0 z-[60] bg-ink/60 backdrop-blur-sm transition-opacity duration-500 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sliding menu panel — enters from left */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        aria-hidden={!open}
        className={`nav-panel fixed inset-y-0 left-0 z-[61] flex w-full flex-col border-r border-line bg-ink/97 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:max-w-xl ${
          open ? "is-open translate-x-0" : "pointer-events-none -translate-x-full"
        }`}
        inert={!open ? true : undefined}
      >
        <div className="nav-panel__bar flex items-center justify-between px-5 py-4 sm:px-8">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-mid">
            {site.tagline}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="nav-close group flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-milk"
          >
            <span className="transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:text-accent">
              Close
            </span>
            <span
              className="nav-close__icon relative flex h-9 w-9 items-center justify-center rounded-full border border-line transition-[border-color,background-color,transform] duration-300 group-hover:border-accent group-hover:bg-accent/10 group-hover:rotate-90"
              aria-hidden
            >
              <span className="absolute block h-px w-3.5 rotate-45 bg-current" />
              <span className="absolute block h-px w-3.5 -rotate-45 bg-current" />
            </span>
          </button>
        </div>

        <nav className="flex flex-1 flex-col justify-center gap-1 px-5 pb-16 sm:gap-2 sm:px-8 sm:pb-20">
          {MENU.map((item, i) => (
            <button
              key={item.to}
              type="button"
              onClick={() => go(item.to)}
              style={{ "--i": i } as CSSProperties}
              className="nav-panel__item group flex items-baseline gap-4 py-2 text-left sm:py-2.5"
            >
              <span className="w-8 shrink-0 font-mono text-xs tabular-nums text-mid transition-colors duration-300 group-hover:text-accent group-focus-visible:text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="relative inline-block pb-1 font-display text-[clamp(1.875rem,6.5vw,3.5rem)] uppercase leading-[0.92] tracking-[0.02em] text-milk">
                {item.label}
                <span
                  className="absolute bottom-0 left-0 h-[3px] w-0 bg-accent transition-[width] duration-300 ease-out group-hover:w-full group-focus-visible:w-full"
                  aria-hidden
                />
              </span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
