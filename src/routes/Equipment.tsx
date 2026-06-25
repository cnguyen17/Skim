// src/routes/Equipment.tsx — §2 equipment rental + setup. Gear comes from
// site.config; each item has a "Request this" action that routes to Booking.
// Empty until the owner lists gear — then this grid fills automatically.
import { Link } from "react-router-dom";
import { site } from "../data/site.config";
import { Reveal } from "../components/Reveal";
import { useTilt } from "../hooks/useTilt";

type Gear = { name: string; img?: string; note?: string };

function GearCard({ item }: { item: Gear }) {
  const ref = useTilt<HTMLDivElement>(4);
  return (
    <div ref={ref} className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-ink-2 will-change-transform">
      {item.img ? (
        <img
          src={item.img}
          alt={item.name}
          loading="lazy"
          width={640}
          height={400}
          className="aspect-[16/10] w-full object-cover"
        />
      ) : (
        <div className="aspect-[16/10] w-full bg-gradient-to-br from-ink to-ink-2" />
      )}
      <div className="flex flex-1 flex-col justify-between gap-4 p-5">
        <div>
          <p className="font-display text-xl uppercase text-milk">{item.name}</p>
          {item.note && <p className="mt-1 font-mono text-xs uppercase tracking-[0.15em] text-mid">{item.note}</p>}
        </div>
        <Link
          to="/booking"
          className="self-start rounded-full border border-line px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-milk transition-colors hover:border-accent hover:text-accent"
        >
          Request this
        </Link>
      </div>
    </div>
  );
}

export default function Equipment() {
  const items = site.equipment as readonly Gear[];

  return (
    <div className="pt-28">
      <div className="mx-auto max-w-6xl px-5 pb-24 sm:px-8 lg:pb-32">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            Rent &amp; setup
          </p>
        </Reveal>
        <Reveal>
          <h1 className="mt-5 max-w-3xl font-display text-5xl uppercase leading-[0.9] text-milk sm:text-7xl">
            Equipment Rentals
          </h1>
        </Reveal>
        <Reveal>
          <p className="mt-6 max-w-xl font-body text-base text-mid">
            skim owns gear he rents out and can set up for your event. Pick what
            you need and request it — he&apos;ll handle the rest.
          </p>
        </Reveal>

        <div className="mt-12">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-ink-2 p-10 text-center">
              <p className="font-display text-2xl uppercase text-milk">Gear list coming soon</p>
              <p className="mt-2 font-body text-sm text-mid">
                In the meantime,{" "}
                <Link to="/booking" className="text-accent underline-offset-4 hover:underline">
                  get in contact
                </Link>{" "}
                about what you need.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, i) => (
                <Reveal key={item.name} delay={i * 0.04}>
                  <GearCard item={item} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
