// src/components/Collaborations.tsx
// §6 — Collaborations as its OWN standalone section (its own heading + #anchor),
// no longer bundled under the Work tabs. Content (sets & skits skim produced for
// others) comes from site.config.collaborations (§0); reuses the media embeds.
// Empty until skim lists credits — then it shows a calm, directive empty state.

import { site } from "../data/site.config";
import { VideoCard } from "./VideoCard";
import { SpotifyEmbed } from "./SpotifyEmbed";
import { Reveal } from "./Reveal";

export function Collaborations() {
  const items = site.collaborations;

  return (
    <section id="collaborations" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            With others
          </p>
        </Reveal>
        <Reveal>
          <h2 className="mb-12 mt-5 font-display text-4xl uppercase leading-tight text-milk sm:text-6xl">
            Collaborations
          </h2>
        </Reveal>

        {items.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2">
            {items.map((c, idx) => (
              <Reveal key={`${c.type}-${c.id}`} delay={idx * 0.04}>
                {c.type === "spotify" ? (
                  <SpotifyEmbed id={c.id} title={c.title} />
                ) : (
                  <VideoCard id={c.id} title={c.title} index={idx} />
                )}
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal>
            <div className="rounded-xl border border-dashed border-line bg-ink-2 p-10 text-center">
              <p className="font-display text-2xl uppercase text-milk">
                More on the way
              </p>
              <p className="mt-2 font-body text-sm text-mid">
                Sets and skits skim produced for others. Want to collaborate?{" "}
                <a
                  href="/booking"
                  className="text-accent underline-offset-4 hover:underline"
                >
                  Get in contact
                </a>
                .
              </p>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
