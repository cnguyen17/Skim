// src/components/CartonLabel.tsx
// PORTRAIT "Nutrition Facts" panel sized for a milk-carton FRONT face (tall +
// narrow, ~0.52 w/h). This is the version rasterized into the 3D carton's label
// texture (see useLabelTexture). The square <NutritionFacts /> stays the on-page
// 2D card / reduced-motion fallback; this one only ever lives on the carton.
//
// Same content/source of truth, stacked vertically (label over value) so it reads
// like a real carton panel and stays legible at the carton's narrow width. Keep it
// a pure, presentational card with no animation — it's rasterized off-screen.

import { site } from "../data/site.config";

const FACTS: { label: string; value: string }[] = [
  { label: "Serving size", value: "1 set" },
  { label: "Roles", value: "DJ · Producer" },
  { label: "Genres", value: "Hip-Hop · R&B · Amapiano · Bass House" },
  { label: "Energy", value: "Party · Confident · Clean" },
  { label: "Off the decks", value: "Golf · Music · Health" },
  { label: "Handle", value: `@${site.handle}` },
];

/** Natural CSS width the rasterizer renders this at; height is content-driven. */
export const CARTON_LABEL_WIDTH = 520;

/** One size for every row label + value — big and uniform on the carton face. */
const ROW = "text-[1.875rem] font-bold leading-snug";

/** Thick rule between rows — real nutrition-label weight. */
const ROW_DIVIDER = "border-b-[5px] border-black";

export function CartonLabel() {
  return (
    <div
      style={{ width: CARTON_LABEL_WIDTH, color: "#000" }}
      className="rounded-sm border-[4px] border-black bg-white"
    >
      <div className="border-b-[10px] border-black px-5 pt-5 pb-3">
        <p className="font-display text-[3.5rem] uppercase leading-[0.9] text-black">
          Nutrition
          <br />
          Facts
        </p>
        <p className="mt-2 font-mono text-base font-bold uppercase tracking-[0.14em] text-black">
          Per 1 night · {site.tagline}
        </p>
      </div>

      <dl className="px-5">
        {FACTS.map((f, i) => (
          <div
            key={f.label}
            className={i < FACTS.length - 1 ? `${ROW_DIVIDER} py-3.5` : "py-3.5"}
          >
            <dt className={`${ROW} font-mono uppercase tracking-[0.12em] text-black`}>
              {f.label}
            </dt>
            <dd className={`${ROW} mt-1 font-body text-black`}>{f.value}</dd>
          </div>
        ))}
      </dl>

      <p className={`${ROW} border-t-[10px] border-black px-5 py-3.5 font-mono uppercase tracking-[0.1em] text-black`}>
        * Best served loud. Contains no actual dairy.
      </p>
    </div>
  );
}
