import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import App from "./App.tsx";
import { preloadHeroAssets } from "./lib/preloadHero";
import { preloadBearAssets } from "./three/bearAssets";

// Warm hero faces + Bio bear/three chunk as soon as JS runs — before React
// mounts, and before the logo loader / Home effects fire.
void preloadHeroAssets();
void preloadBearAssets();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
