// src/components/Layout.tsx
// Shared chrome around every route: fixed Nav, the routed page (Outlet), and the
// Footer. The Loader (first-load intro) is mounted here too so it overlays the
// whole shell.

import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { Loader } from "./Loader";
import { useLenis } from "./LenisProvider";
import { scrollToSection } from "../lib/scrollToSection";

function PageFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink font-mono text-sm text-mid">
      Loading…
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  const lenis = useLenis();

  // Scroll to #bio, #work, etc. after route changes (e.g. menu from /booking → /#bio).
  useEffect(() => {
    const hash = location.hash.replace(/^#/, "");
    if (!hash) return;
    scrollToSection(hash, lenis);
  }, [location.pathname, location.hash, lenis]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-[0.2em] focus:text-ink"
      >
        Skip to content
      </a>
      <Loader />
      <Nav />
      <main id="main">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
