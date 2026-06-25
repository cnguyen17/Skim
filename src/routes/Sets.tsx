// src/routes/Sets.tsx — §6 DJ Sets page: sets / producing / collaborations.
// The filterable set-photo gallery lands here in Phase 6.
import { WorkTabs } from "../components/WorkTabs";
import { Reveal } from "../components/Reveal";

export default function Sets() {
  return (
    <main className="pt-28">
      <div className="mx-auto max-w-6xl px-5 pb-24 sm:px-8 lg:pb-32">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            Watch &amp; listen
          </p>
        </Reveal>
        <Reveal>
          <h1 className="mb-12 mt-5 font-display text-5xl uppercase leading-[0.9] text-milk sm:text-7xl">
            DJ Sets
          </h1>
        </Reveal>
        <WorkTabs />
      </div>
    </main>
  );
}
