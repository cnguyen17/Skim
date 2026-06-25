// src/routes/Home.tsx — §6 scroll narrative.
// Phase 4: 3D hero. Phase 5 fills in bio + work toggle + contact below it.
import { Hero } from "../components/Hero";
import { Reveal } from "../components/Reveal";
import { site } from "../data/site.config";

export default function Home() {
  return (
    <>
      <Hero />

      {/* Bio anchor (DJ Info) — full treatment lands in Phase 5 */}
      <section id="bio" className="mx-auto max-w-6xl px-5 py-28 sm:px-8">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            Get to know him
          </p>
        </Reveal>
        <Reveal>
          <h2 className="mt-4 max-w-3xl font-display text-4xl uppercase leading-tight text-milk sm:text-6xl">
            {site.blurb}
          </h2>
        </Reveal>
      </section>
    </>
  );
}
