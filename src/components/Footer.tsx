// src/components/Footer.tsx
// §6 footer — socials pulled from site.config (single source of truth, §0).
// Linktree aggregates the rest (YouTube/Spotify live there), so we surface the
// four direct handles + Linktree rather than hardcoding links we don't have.

import { site } from "../data/site.config";
import { SOCIAL_ICONS, SOCIAL_LABELS } from "./icons";
import { RollText } from "./RollText";

export function Footer() {
  const socials = Object.entries(site.socials);

  return (
    <footer className="border-t border-line bg-ink px-5 py-12 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
          <div className="space-y-3">
            <img
              src={site.assets.logo}
              alt={`${site.name} wordmark logo`}
              width={120}
              height={48}
              className="h-10 w-auto"
            />
            <p className="max-w-xs font-mono text-xs uppercase tracking-[0.2em] text-mid">
              {site.tagline}
            </p>
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {socials.map(([key, url]) => {
              const Icon = SOCIAL_ICONS[key];
              const label = SOCIAL_LABELS[key] ?? key;
              return (
                <li key={key}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-mid transition-colors hover:text-accent"
                  >
                    {Icon ? <Icon /> : null}
                    <span className="font-mono text-xs uppercase tracking-[0.15em]">
                      {label}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col items-start justify-between gap-2 border-t border-line pt-6 sm:flex-row sm:items-center">
          {/* Roll letter-spacing reads as broken "© SKI M" on small screens —
              plain type on mobile, roll kept from sm up (web looks fine). */}
          <span className="font-mono text-xs uppercase tracking-[0.12em] text-mid sm:hidden">
            © {site.name}
          </span>
          <span className="hidden sm:contents">
            <RollText
              text={`© ${site.name}`}
              className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-mid"
            />
          </span>
          <span className="hidden font-mono text-[0.7rem] uppercase tracking-[0.2em] text-mid sm:inline">
            Built in code · deployed free
          </span>
        </div>
      </div>
    </footer>
  );
}
