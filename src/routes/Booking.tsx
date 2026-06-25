// src/routes/Booking.tsx — §2/§9 contact paths: book a DJ set, a general
// meeting, or an equipment request. Cal.com handles scheduling; Web3Forms
// handles the message. No backend.
import { BookingEmbed } from "../components/BookingEmbed";
import { ContactForm } from "../components/ContactForm";
import { Reveal } from "../components/Reveal";

const SERVICES = [
  { title: "Book a DJ set", note: "Parties, clubs, events — pick a time." },
  { title: "General meeting", note: "Collabs, production, or just a chat." },
  { title: "Equipment + setup", note: "Rent his gear; he can set it up." },
];

export default function Booking() {
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

        {/* Three services */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {SERVICES.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.05}>
              <div className="h-full rounded-xl border border-line bg-ink-2 p-6">
                <p className="font-display text-xl uppercase text-milk">{s.title}</p>
                <p className="mt-2 font-body text-sm text-mid">{s.note}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Scheduler */}
        <div className="mt-20 grid gap-12 lg:grid-cols-2">
          <div>
            <Reveal>
              <h2 className="mb-6 font-display text-3xl uppercase text-milk">
                Pick a time
              </h2>
            </Reveal>
            <Reveal>
              <BookingEmbed />
            </Reveal>
          </div>

          <div>
            <Reveal>
              <h2 className="mb-6 font-display text-3xl uppercase text-milk">
                Or send a message
              </h2>
            </Reveal>
            <Reveal>
              <ContactForm subject="New booking enquiry — skim.site" />
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  );
}
