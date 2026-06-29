// src/routes/Home.tsx — §6 scroll narrative:
// loader (Layout) → 3D hero → bio → work toggle → contact → footer (Layout).
import { Hero } from "../components/Hero";
import { Bio } from "../components/Bio";
import { WorkFridge } from "../components/WorkFridge";
import { Collaborations } from "../components/Collaborations";
import { Gallery } from "../components/Gallery";
import { ContactCTA } from "../components/ContactCTA";
import { Reveal } from "../components/Reveal";

export default function Home() {
  return (
    <>
      <Hero />
      <Bio />

      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
              The work
            </p>
          </Reveal>
          <Reveal>
            <h2 className="mb-12 mt-5 font-display text-4xl uppercase leading-tight text-milk sm:text-6xl">
              Sets, production &amp; collabs
            </h2>
          </Reveal>
          <WorkFridge />
        </div>
      </section>

      {/* Collaborations — its own standalone section (config-driven). */}
      <Collaborations />

      {/* Gallery — set photos, its own standalone section (config-driven). */}
      <section id="gallery" className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
              From the sets
            </p>
          </Reveal>
          <Reveal>
            <h2 className="mb-12 mt-5 font-display text-4xl uppercase leading-tight text-milk sm:text-6xl">
              Gallery
            </h2>
          </Reveal>
          <Gallery />
        </div>
      </section>

      <ContactCTA />
    </>
  );
}
