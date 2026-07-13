// src/routes/Home.tsx — §6 scroll narrative:
// loader (Layout) → 3D hero → bio → work toggle → contact → footer (Layout).
import { useEffect } from "react";
import { Hero } from "../components/Hero";
import { Bio } from "../components/Bio";
import { WorkFridge } from "../components/WorkFridge";
import { Collaborations } from "../components/Collaborations";
import { Gallery } from "../components/Gallery";
import { ContactCTA } from "../components/ContactCTA";
import { Reveal } from "../components/Reveal";
import { preloadBearAssets } from "../three/bearAssets";
import { useReducedMotion } from "../hooks/useReducedMotion";

export default function Home() {
  const reducedMotion = useReducedMotion();

  // After the hero has had a beat to paint, warm the bear GLB + R3F chunk so
  // Bio can mount the scene without a cold multi-second (or worse) fetch.
  useEffect(() => {
    if (reducedMotion) return;
    const kick = () => preloadBearAssets();
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(kick, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = globalThis.setTimeout(kick, 400);
    return () => globalThis.clearTimeout(t);
  }, [reducedMotion]);

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

      {/* Gallery — paginated set-photo grid + lightbox (config-driven). */}
      <section id="gallery" className="relative overflow-hidden border-t border-line">
        <div className="relative mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            From the sets
          </p>
          <h2 className="mt-4 font-display text-5xl uppercase leading-none tracking-tight text-milk sm:text-7xl lg:text-8xl">
            Photos
          </h2>
          <div className="mt-8 sm:mt-10">
            <Gallery />
          </div>
        </div>
      </section>

      <ContactCTA />
    </>
  );
}
