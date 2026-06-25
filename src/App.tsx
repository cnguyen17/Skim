// src/App.tsx
// App shell: router + Lenis smooth-scroll provider + the §5/§6 routes.
// Routes are code-split with React.lazy (§10 lazy-load mindset) so each page's
// JS only loads when visited. Real sections arrive in later phases.

import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LenisProvider } from "./components/LenisProvider";

const Home = lazy(() => import("./routes/Home"));
const Sets = lazy(() => import("./routes/Sets"));
const Equipment = lazy(() => import("./routes/Equipment"));
const Booking = lazy(() => import("./routes/Booking"));

function RouteFallback() {
  return (
    <div className="min-h-dvh bg-ink text-mid flex items-center justify-center font-mono text-sm">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LenisProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sets" element={<Sets />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/booking" element={<Booking />} />
          </Routes>
        </Suspense>
      </LenisProvider>
    </BrowserRouter>
  );
}
