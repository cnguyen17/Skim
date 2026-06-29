// src/components/NutritionFacts.tsx
// The milk-carton "Nutrition Facts" panel (skim → skim milk): the site's
// signature data device that encodes real info (roles, genres, interests).
// Extracted verbatim from Bio.tsx so it has TWO consumers:
//   1. Bio.tsx renders it inside a <Reveal> — identical on-page card as before.
//   2. useLabelTexture renders it BARE (no Reveal, fully opaque) off-screen to
//      rasterize into a CanvasTexture for the 3D carton's front face.
// Because of (2), keep this a pure, presentational card with no animation/opacity
// state of its own — the Reveal wrapper lives in Bio.

import { site } from "../data/site.config";

const FACTS: { label: string; value: string; big?: boolean }[] = [
  { label: "Serving size", value: "1 set" },
  { label: "Roles", value: "DJ · Producer", big: true },
  { label: "Genres", value: "Hip-Hop · R&B · Amapiano · Bass House" },
  { label: "Energy", value: "Party · Confident · Clean" },
  { label: "Off the decks", value: "Golf · Music · Health" },
  { label: "Handle", value: `@${site.handle}` },
];

export function NutritionFacts() {
  return (
    <div className="rounded-xl border-[4px] border-black bg-white text-black">
      <div className="border-b-[10px] border-black px-6 pb-3 pt-5">
        <p className="font-display text-5xl uppercase leading-none text-black">
          Nutrition Facts
        </p>
        <p className="mt-2 font-mono text-sm font-bold uppercase tracking-[0.15em] text-black">
          Per 1 night · {site.tagline}
        </p>
      </div>
      <dl className="px-6 py-1">
        {FACTS.map((f, i) => (
          <div
            key={f.label}
            className={`flex items-baseline justify-between gap-4 py-3 ${
              i < FACTS.length - 1 ? "border-b-[5px] border-black" : ""
            }`}
          >
            <dt className="font-mono text-xs font-bold uppercase tracking-[0.15em]">
              {f.label}
            </dt>
            <dd
              className={`text-right font-bold ${
                f.big
                  ? "font-display text-2xl uppercase"
                  : "font-body text-base leading-relaxed"
              }`}
            >
              {f.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="border-t-[10px] border-black px-6 py-4 font-mono text-sm font-bold uppercase tracking-[0.15em] text-black">
        * Best served loud. Contains no actual dairy.
      </p>
    </div>
  );
}
