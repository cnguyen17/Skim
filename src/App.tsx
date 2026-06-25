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
const Equipment = lazy(() => import("./routes/Equipment"));
const Booking = lazy(() => import("./routes/Booking"));

export default function App() {
  return (
    <BrowserRouter>
      <LenisProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/sets" element={<Sets />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/booking" element={<Booking />} />
          </Route>
        </Routes>
      </LenisProvider>
    </BrowserRouter>
  );
}
