// src/App.tsx
// App shell: router + Lenis smooth-scroll provider + a shared Layout (Nav +
// Footer + Loader) wrapping the §5/§6 routes. Routes are code-split with
// React.lazy (§10 lazy-load mindset) so each page's JS only loads when visited.

import { lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LenisProvider } from "./components/LenisProvider";
import { Layout } from "./components/Layout";

const Home = lazy(() => import("./routes/Home"));
const Sets = lazy(() => import("./routes/Sets"));
const Booking = lazy(() => import("./routes/Booking"));
// TEMP (Part A verification) — remove with /_label route once label is confirmed.
const LabelPreview = lazy(() => import("./routes/LabelPreview"));
// TEMP (Part B tuning) — remove with /_bear route once the scene is confirmed.
const BearPreview = lazy(() => import("./routes/BearPreview"));
// TEMP (model orientation diag) — remove with /_model route once scene is dialed.
const ModelDiag = lazy(() => import("./routes/ModelDiag"));

export default function App() {
  return (
    <BrowserRouter>
      <LenisProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/sets" element={<Sets />} />
            <Route path="/booking" element={<Booking />} />
          </Route>
          {/* TEMP (Part A verification) — standalone, no Layout. Remove later. */}
          <Route path="/_label" element={<LabelPreview />} />
          {/* TEMP (Part B tuning) — standalone, no Layout. Remove later. */}
          <Route path="/_bear" element={<BearPreview />} />
          {/* TEMP (model orientation diag) — remove later. */}
          <Route path="/_model" element={<ModelDiag />} />
        </Routes>
      </LenisProvider>
    </BrowserRouter>
  );
}
