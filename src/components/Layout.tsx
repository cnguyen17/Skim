// src/components/Layout.tsx
// Shared chrome around every route: fixed Nav, the routed page (Outlet), and the
// Footer. The Loader (first-load intro) is mounted here too so it overlays the
// whole shell.

import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { Loader } from "./Loader";

function PageFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink font-mono text-sm text-mid">
      Loading…
    </div>
  );
}

export function Layout() {
  return (
    <>
      <Loader />
      <Nav />
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
      <Footer />
    </>
  );
}
