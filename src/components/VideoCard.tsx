// src/components/VideoCard.tsx
// §9 fast YouTube — wraps the <lite-youtube> custom element (thumbnail first,
// the real iframe only mounts on click, so the page never loads N iframes).
// The label strip uses the JetBrains-Mono "nutrition facts" treatment (the
// site's milk-carton motif).

import "lite-youtube-embed";
import "lite-youtube-embed/src/lite-yt-embed.css";
import { useTilt } from "../hooks/useTilt";

export function VideoCard({
  id,
  title,
  index,
}: {
  id: string;
  title: string;
  index?: number;
}) {
  const ref = useTilt<HTMLDivElement>(5);

  return (
    <figure className="group">
      <div
        ref={ref}
        className="overflow-hidden rounded-xl border border-line bg-ink-2 will-change-transform"
      >
        <lite-youtube
          videoid={id}
          playlabel={`Play: ${title}`}
          style={{ borderRadius: "0.75rem" }}
        />
      </div>
      <figcaption className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
        <span className="font-body text-sm text-milk">{title}</span>
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.15em] text-mid">
          {typeof index === "number" ? `Set ${String(index + 1).padStart(2, "0")}` : "YouTube"}
        </span>
      </figcaption>
    </figure>
  );
}
