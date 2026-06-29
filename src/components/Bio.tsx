// src/components/Bio.tsx
// §6 "get to know him". Left: short DJ + producer story with the off-deck beat
// (golf, music, health). Right: the site's signature device — a milk-carton
// "Nutrition Facts" panel (skim → skim milk) that encodes real info: genres,
// roles, interests. This is the brand's reinterpretation of the telemetry/data
// motif, not generic numbering.

import { Reveal } from "./Reveal";
import { BioCarton } from "./BioCarton";

export function Bio() {
  return (
    <section id="bio" className="overflow-visible border-t border-line">
      <div className="relative mx-auto grid max-w-[90rem] grid-cols-1 gap-y-10 px-5 pt-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_780px] lg:items-stretch lg:gap-x-8 lg:pt-16">
        {/* Story */}
        <div className="pb-20 lg:pr-2 lg:pb-24">
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

        {/* Bear sticker — bottom-anchored 780×800 stage; grows upward so feet stay put
            while the head can reach toward the hero. */}
        <Reveal
          className="relative z-10 flex w-full flex-col justify-end self-stretch overflow-visible lg:-mt-[8.5rem]"
          delay={0.05}
        >
          <BioCarton />
        </Reveal>
      </div>
    </section>
  );
}
