// src/components/Placeholder.tsx
// Phase 1 scaffold only — a minimal, branded stand-in for each route so the
// router + shell are verifiable. Real sections land in later phases.

import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { site } from "../data/site.config";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/sets", label: "DJ Sets" },
  { to: "/equipment", label: "Equipment" },
  { to: "/booking", label: "Booking" },
];

export function Placeholder({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-ink text-milk flex flex-col items-center justify-center gap-8 px-6 py-20 text-center">
      <Link to="/" aria-label={`${site.name} — home`}>
        <img
          src={site.assets.logo}
          alt={`${site.name} wordmark logo`}
          width={140}
          height={140}
          className="h-20 w-auto"
        />
      </Link>

      <div className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
          {eyebrow}
        </p>
        <h1 className="font-display text-5xl sm:text-7xl text-milk">{title}</h1>
        <p className="font-body text-mid max-w-md mx-auto">
          {children ?? "Placeholder — built in a later phase."}
        </p>
      </div>

      <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-sm">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="text-mid hover:text-milk transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
