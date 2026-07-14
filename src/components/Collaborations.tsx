// src/components/Collaborations.tsx
// §6 — Collaborations as its OWN standalone section (its own heading + #anchor),
// no longer bundled under the Work tabs. Content (sets & skits skim produced for
// others) comes from site.config.collaborations (§0); reuses the media embeds.
// Below the credits sits the event-history timeline preview, which links out to
// the full /collaborations/timeline route.

import { site } from "../data/site.config";
import { VideoCard } from "./VideoCard";
import { SpotifyEmbed } from "./SpotifyEmbed";
import { Reveal } from "./Reveal";
import { CollabTimelinePreview } from "./CollabTimelinePreview";

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

        {/* Credits grid — unchanged, and still the first thing shown the moment
            site.collaborations has entries. While it's empty we simply say
            nothing rather than show a placeholder, because the event timeline
            below is the real proof of work. */}
        {items.length > 0 && (
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
        )}

        <CollabTimelinePreview />
      </div>
    </section>
  );
}
