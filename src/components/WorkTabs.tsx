// src/components/WorkTabs.tsx
// §6 work toggle — DJ Sets / Producing. Accessible tabs (role=tablist/tab/
// tabpanel, arrow-key navigation). All content comes from site.config (§0).
// Empty categories show a calm, directive empty state. Collaborations is now its
// own standalone section (see Collaborations.tsx), no longer a tab here.

import { useEffect, useId, useRef, useState } from "react";
import { site } from "../data/site.config";
import { VideoCard } from "./VideoCard";
import { SpotifyEmbed } from "./SpotifyEmbed";
import { Reveal } from "./Reveal";

const TABS = ["DJ Sets", "Producing"] as const;
type Tab = (typeof TABS)[number];

const TAB_BY_HASH: Record<string, Tab> = {
  work: "DJ Sets",
  "work-producing": "Producing",
};

function tabFromHash(): Tab | null {
  const hash = window.location.hash.replace(/^#/, "");
  return TAB_BY_HASH[hash] ?? null;
}

export function WorkTabs() {
  const [active, setActive] = useState<Tab>(() => tabFromHash() ?? "DJ Sets");
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const sync = () => {
      const tab = tabFromHash();
      if (tab) setActive(tab);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

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
      {/* Tablist — scroll anchor for #work (tabs + rule sit flush under the nav) */}
      <div
        id="work"
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
