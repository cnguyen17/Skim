// src/components/Bio.tsx
// §6 "get to know him". Left: short DJ + producer story with the off-deck beat
// (golf, music, health). Right: the site's signature device — a milk-carton
// "Nutrition Facts" panel (skim → skim milk) that encodes real info: genres,
// roles, interests. This is the brand's reinterpretation of the telemetry/data
// motif, not generic numbering.

import { site } from "../data/site.config";
import { Reveal } from "./Reveal";

const FACTS: { label: string; value: string; big?: boolean }[] = [
  { label: "Serving size", value: "1 set" },
  { label: "Roles", value: "DJ · Producer", big: true },
  { label: "Genres", value: "Hip-Hop · R&B · Amapiano · Bass House" },
  { label: "Energy", value: "Party · Confident · Clean" },
  { label: "Off the decks", value: "Golf · Music · Health" },
  { label: "Handle", value: `@${site.handle}` },
];

export function Bio() {
  return (
    <section id="bio" className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:py-32">
        {/* Story */}
        <div>
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
              Get to know him
            </p>
          </Reveal>
          <Reveal>
            <h2 className="mt-5 max-w-2xl font-display text-4xl uppercase leading-[0.95] text-milk sm:text-6xl">
              DJ by night, producer by trade, bear with the milk by name.
            </h2>
          </Reveal>
          <Reveal>
            <div className="mt-8 max-w-xl space-y-4 font-body text-base leading-relaxed text-mid">
              <p>
                skim plays the kind of set that reads a room and turns it up —
                hip-hop and R&B threaded through amapiano and bass house until the
                floor forgets it was ever standing still.
              </p>
              <p>
                Off the decks he's in the studio producing for other artists, and
                away from music it's golf, more music, and keeping healthy. Same
                person, two speeds: the show and the craft behind it.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Nutrition Facts panel — signature device */}
        <Reveal className="lg:pt-2" delay={0.05}>
          <div className="rounded-xl border-2 border-milk bg-milk text-ink">
            <div className="border-b-[6px] border-ink px-5 pb-2 pt-4">
              <p className="font-display text-3xl uppercase leading-none">
                Nutrition Facts
              </p>
              <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-[0.15em] text-ink/70">
                Per 1 night · {site.tagline}
              </p>
            </div>
            <dl className="px-5 py-2">
              {FACTS.map((f, i) => (
                <div
                  key={f.label}
                  className={`flex items-baseline justify-between gap-4 py-2 ${
                    i < FACTS.length - 1 ? "border-b border-ink/20" : ""
                  }`}
                >
                  <dt className="font-mono text-[0.7rem] uppercase tracking-[0.15em] text-ink/70">
                    {f.label}
                  </dt>
                  <dd
                    className={`text-right ${
                      f.big
                        ? "font-display text-lg uppercase"
                        : "font-body text-sm font-medium"
                    }`}
                  >
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="border-t-[6px] border-ink px-5 py-3 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-ink/70">
              * Best served loud. Contains no actual dairy.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
