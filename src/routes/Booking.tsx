// src/routes/Booking.tsx — §2/§9 contact paths: book a DJ set or a general
// meeting. Cal.com handles scheduling; Web3Forms handles the message. No backend.
import { useState } from "react";
import { BookingEmbed } from "../components/BookingEmbed";
import { ContactForm } from "../components/ContactForm";
import { Reveal } from "../components/Reveal";
import { isBookingConfigured } from "../lib/booking";
import { site } from "../data/site.config";

const EVENTS = site.booking.events;
type EventId = (typeof EVENTS)[number]["id"];

export default function Booking() {
  const [activeId, setActiveId] = useState<EventId>(EVENTS[0]?.id ?? "dj-set");
  const active = EVENTS.find((e) => e.id === activeId) ?? EVENTS[0];
  const eventSlug =
    active && isBookingConfigured(active.slug) ? active.slug : undefined;

  return (
    <div className="pt-28">
      <div className="mx-auto max-w-6xl px-5 pb-24 sm:px-8 lg:pb-32">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            Get in contact
          </p>
        </Reveal>
        <Reveal>
          <h1 className="mt-5 max-w-3xl font-display text-5xl uppercase leading-[0.9] text-milk sm:text-7xl">
            Booking
          </h1>
        </Reveal>

        {/* Services — pick which Cal.com event type to embed */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2" role="tablist" aria-label="Booking type">
          {EVENTS.map((event, i) => {
            const selected = event.id === activeId;
            return (
              <Reveal key={event.id} delay={i * 0.05}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveId(event.id)}
                  className={`h-full w-full rounded-xl border p-6 text-left transition-colors ${
                    selected
                      ? "border-accent bg-accent/5"
                      : "border-line bg-ink-2 hover:border-accent/40"
                  }`}
                >
                  <p className="font-display text-xl uppercase text-milk">{event.title}</p>
                  <p className="mt-2 font-body text-sm text-mid">{event.note}</p>
                </button>
              </Reveal>
            );
          })}
        </div>

        {/* Scheduler */}
        <div className="mt-20 grid gap-12 lg:grid-cols-2">
          <div role="tabpanel" aria-label={active?.title}>
            <Reveal>
              <h2 className="mb-6 font-display text-3xl uppercase text-milk">
                Pick a time
              </h2>
            </Reveal>
            <Reveal>
              <BookingEmbed eventSlug={eventSlug} />
            </Reveal>
          </div>

          <div>
            <Reveal>
              <h2 className="mb-6 font-display text-3xl uppercase text-milk">
                Or send a message
              </h2>
            </Reveal>
            <Reveal>
              <ContactForm subject={`New booking enquiry (${active?.title ?? "skim"}) — skim.site`} />
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
