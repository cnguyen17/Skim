// src/components/ContactCTA.tsx
// §6 contact beat on Home — routes to Booking.

import { Link } from "react-router-dom";
import { site } from "../data/site.config";
import { Reveal } from "./Reveal";

export function ContactCTA() {
  return (
    <section id="contact" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            Book &amp; contact
          </p>
        </Reveal>
        <Reveal>
          <h2 className="mt-5 max-w-3xl font-display text-5xl uppercase leading-[0.9] text-milk sm:text-7xl">
            Book the set. Let&apos;s make some noise.
          </h2>
        </Reveal>
        <Reveal>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to={site.ctas.booking.to}
              className="rounded-full bg-accent px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-ink transition-transform hover:-translate-y-0.5"
            >
              {site.ctas.booking.label}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
