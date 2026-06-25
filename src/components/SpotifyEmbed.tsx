// src/components/SpotifyEmbed.tsx
// §9/§10 — official Spotify iframe, mounted lazily only when scrolled near the
// viewport so it never costs anything on initial load.

import { useEffect, useRef, useState } from "react";

export function SpotifyEmbed({
  id,
  title,
  kind = "track",
}: {
  id: string;
  title: string;
  kind?: "track" | "album" | "playlist" | "artist";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="overflow-hidden rounded-xl border border-line bg-ink-2">
      {show ? (
        <iframe
          title={`Spotify — ${title}`}
          src={`https://open.spotify.com/embed/${kind}/${id}?utm_source=skim`}
          width="100%"
          height={152}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          style={{ border: 0 }}
        />
      ) : (
        <div className="flex h-[152px] items-center justify-center font-mono text-xs uppercase tracking-[0.2em] text-mid">
          Loading player…
        </div>
      )}
    </div>
  );
}
