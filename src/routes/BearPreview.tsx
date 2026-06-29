// src/routes/BearPreview.tsx
// TEMPORARY (Part B verification) — renders the PRODUCTION BioCartonCanvas inside a
// Bio-sized column on a dark surface, so we see exactly what the Bio section will
// show (fixed camera, no orbit). Delete this route + file once confirmed.

import { useEffect } from "react";
import BioCartonCanvas from "../components/BioCartonCanvas";
import { preloadLabelTexture } from "../three/useLabelTexture";

export default function BearPreview() {
  useEffect(() => preloadLabelTexture(), []);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0F0E0C",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 16,
          font: '12px "JetBrains Mono", monospace',
          color: "#58D7FF",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        Part B preview · production framing (Bio column)
      </div>
      {/* mimic the Bio right column: ~0.8fr of a 6xl grid at lg:min-h-[46rem] */}
      <div style={{ position: "relative", width: 442, height: 736, outline: "1px solid #1d1b18" }}>
        <BioCartonCanvas />
      </div>
    </div>
  );
}
