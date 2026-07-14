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

export function NutritionFacts({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`border-black bg-white text-black ${
        compact
          ? "rounded-lg border-[3px]"
          : "rounded-xl border-[4px]"
      }`}
    >
      <div
        className={`border-black ${
          compact
            ? "border-b-[6px] px-3 pb-2 pt-3"
            : "border-b-[10px] px-6 pb-3 pt-5"
        }`}
      >
        <p
          className={`font-display uppercase leading-none text-black ${
            compact ? "text-2xl" : "text-5xl"
          }`}
        >
          Nutrition Facts
        </p>
        <p
          className={`font-mono font-bold uppercase text-black ${
            compact
              ? "mt-1 text-[0.6rem] tracking-[0.12em]"
              : "mt-2 text-sm tracking-[0.15em]"
          }`}
        >
          Per 1 night · {site.tagline}
        </p>
      </div>
      <dl className={compact ? "px-3 py-0.5" : "px-6 py-1"}>
        {FACTS.map((f, i) => (
          <div
            key={f.label}
            className={`flex items-baseline justify-between gap-2 ${
              compact ? "py-1.5" : "gap-4 py-3"
            } ${i < FACTS.length - 1 ? (compact ? "border-b-[3px] border-black" : "border-b-[5px] border-black") : ""}`}
          >
            <dt
              className={`font-mono font-bold uppercase ${
                compact
                  ? "text-[0.55rem] tracking-[0.1em]"
                  : "text-xs tracking-[0.15em]"
              }`}
            >
              {f.label}
            </dt>
            <dd
              className={`text-right font-bold ${
                f.big
                  ? `font-display uppercase ${compact ? "text-sm" : "text-2xl"}`
                  : `font-body leading-relaxed ${compact ? "text-[0.7rem]" : "text-base"}`
              }`}
            >
              {f.value}
            </dd>
          </div>
        ))}
      </dl>
      <p
        className={`border-black font-mono font-bold uppercase text-black ${
          compact
            ? "border-t-[6px] px-3 py-2 text-[0.55rem] tracking-[0.1em]"
            : "border-t-[10px] px-6 py-4 text-sm tracking-[0.15em]"
        }`}
      >
        * Best served loud. Contains no actual dairy.
      </p>
    </div>
  );
}
