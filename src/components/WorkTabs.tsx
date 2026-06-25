// src/components/WorkTabs.tsx
// §6 work toggle — DJ Sets / Producing / Collaborations. Accessible tabs
// (role=tablist/tab/tabpanel, arrow-key navigation). All content comes from
// site.config (§0). Empty categories show a calm, directive empty state.

import { useId, useRef, useState } from "react";
import { site } from "../data/site.config";
import { VideoCard } from "./VideoCard";
import { SpotifyEmbed } from "./SpotifyEmbed";
import { Reveal } from "./Reveal";

const TABS = ["DJ Sets", "Producing", "Collaborations"] as const;
type Tab = (typeof TABS)[number];

export function WorkTabs() {
  const [active, setActive] = useState<Tab>("DJ Sets");
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = (i + dir + TABS.length) % TABS.length;
    setActive(TABS[next]);
    tabRefs.current[next]?.focus();
  };

  return (
    <div>
      {/* Tablist */}
      <div
        role="tablist"
        aria-label="Work"
        className="flex flex-wrap gap-x-8 gap-y-2 border-b border-line"
      >
        {TABS.map((tab, i) => {
          const selected = tab === active;
          return (
            <button
              key={tab}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${i}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`-mb-px border-b-2 pb-3 font-display text-2xl uppercase tracking-wide transition-colors sm:text-3xl ${
                selected
                  ? "border-accent text-milk"
                  : "border-transparent text-mid hover:text-milk"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      <div className="pt-10">
        {TABS.map((tab, i) => {
          if (tab !== active) return null;
          return (
            <div
              key={tab}
              role="tabpanel"
              id={`${baseId}-panel-${i}`}
              aria-labelledby={`${baseId}-tab-${i}`}
            >
              {tab === "DJ Sets" && (
                <div className="grid gap-8 sm:grid-cols-2">
                  {site.sets.map((s, idx) => (
                    <Reveal key={s.id} delay={idx * 0.04}>
                      <VideoCard id={s.id} title={s.title} index={idx} />
                    </Reveal>
                  ))}
                </div>
              )}

              {tab === "Producing" && (
                <div className="grid gap-8 sm:grid-cols-2">
                  {site.producing.map((p, idx) => (
                    <Reveal key={`${p.type}-${p.id}`} delay={idx * 0.04}>
                      {p.type === "spotify" ? (
                        <SpotifyEmbed id={p.id} title={p.title} />
                      ) : (
                        <VideoCard id={p.id} title={p.title} />
                      )}
                    </Reveal>
                  ))}
                </div>
              )}

              {tab === "Collaborations" && (
                <Reveal>
                  <div className="rounded-xl border border-dashed border-line bg-ink-2 p-10 text-center">
                    <p className="font-display text-2xl uppercase text-milk">
                      More on the way
                    </p>
                    <p className="mt-2 font-body text-sm text-mid">
                      Sets and skits skim produced for others. Want to collaborate?{" "}
                      <a href="/booking" className="text-accent underline-offset-4 hover:underline">
                        Get in contact
                      </a>
                      .
                    </p>
                  </div>
                </Reveal>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
