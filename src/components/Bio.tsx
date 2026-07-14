// src/components/Bio.tsx
// §6 "get to know him". Left: short DJ + producer story with the off-deck beat
// (golf, music, health). Right: the site's signature device — a milk-carton
// "Nutrition Facts" panel (skim → skim milk) that encodes real info: genres,
// roles, interests. This is the brand's reinterpretation of the telemetry/data
// motif, not generic numbering.
//
// Mobile/tablet: readable 2D NutritionFacts card (text + label first — the 3D
// bear is too tall to keep both copy and the carton info legible). Desktop (lg+):
// the full bear+carton WebGL scene.

import { Reveal } from "./Reveal";
import { BioCarton } from "./BioCarton";
import { NutritionFacts } from "./NutritionFacts";

export function Bio() {
  return (
    <section id="bio" className="overflow-visible border-t border-line">
      {/* Mobile / tablet — copy first, readable carton label beside or below */}
      <div className="relative mx-auto grid max-w-[90rem] grid-cols-1 items-start gap-8 px-5 pt-12 sm:grid-cols-[minmax(0,1fr)_minmax(14rem,38%)] sm:gap-x-6 sm:px-8 sm:pt-14 lg:hidden">
        <div className="min-w-0">
          <Reveal>
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-accent sm:text-xs">
              Get to know him
            </p>
          </Reveal>
          <Reveal>
            <h2 className="mt-3 max-w-2xl font-display text-[1.65rem] uppercase leading-[0.95] text-milk sm:mt-5 sm:text-5xl">
              DJ by night, producer by trade, bear with the milk by name.
            </h2>
          </Reveal>
          <Reveal>
            <div className="mt-4 max-w-xl space-y-3 font-body text-sm leading-relaxed text-mid sm:mt-8 sm:space-y-4 sm:text-base">
              <p className="hidden sm:block">
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

        <Reveal className="w-full sm:pt-2" delay={0.05}>
          <div className="bio-label-card mx-auto w-full max-w-[22rem] sm:mx-0 sm:ml-auto sm:max-w-none">
            <NutritionFacts compact />
          </div>
        </Reveal>
      </div>

      {/* Desktop — story + 3D bear (unchanged) */}
      <div className="relative mx-auto hidden max-w-[90rem] grid-cols-[minmax(0,1fr)_780px] items-stretch gap-x-8 px-8 pt-16 lg:grid">
        <div className="min-w-0 pb-24 pr-2">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
              Get to know him
            </p>
          </Reveal>
          <Reveal>
            <h2 className="mt-5 max-w-2xl font-display text-6xl uppercase leading-[0.95] text-milk">
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

        <Reveal
          className="relative z-10 -mt-[8.5rem] flex w-full flex-col justify-end self-stretch overflow-visible"
          delay={0.05}
        >
          <BioCarton />
        </Reveal>
      </div>
    </section>
  );
}
