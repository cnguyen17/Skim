// src/components/BookingEmbed.tsx
// §9 booking — Cal.com inline embed (free, no backend). Credentials live in
// site.config or VITE_CALCOM_USER. Mounts lazily when scrolled near (§10).

import { useEffect, useRef, useState } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { buildCalLink, calcomReady } from "../lib/booking";

const NS = "skim-booking";

type Props = {
  /** Cal.com event slug — embeds cal.com/{user}/{slug}. Omit for all event types. */
  eventSlug?: string;
};

export function BookingEmbed({ eventSlug }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);
  const calLink = buildCalLink(eventSlug);

  useEffect(() => {
    const el = ref.current;
    if (!el || !calcomReady) return;
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

  useEffect(() => {
    if (!show) return;
    (async () => {
      const cal = await getCalApi({ namespace: NS });
      cal("ui", {
        theme: "dark",
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, [show]);

  if (!calcomReady || !calLink) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-ink-2 p-10 text-center">
        <p className="font-display text-2xl uppercase text-milk">Booking opens soon</p>
        <p className="mt-2 font-body text-sm text-mid">
          Add your Cal.com username in{" "}
          <code className="text-accent">site.config.ts</code> or{" "}
          <code className="text-accent">.env.local</code> to embed live scheduling here.
        </p>
      </div>
    );
  }

  return (
    <div ref={ref} className="overflow-hidden rounded-xl border border-line bg-ink-2">
      {show ? (
        <Cal
          key={calLink}
          namespace={NS}
          calLink={calLink}
          style={{ width: "100%", height: "640px", overflow: "scroll" }}
          config={{ layout: "month_view", theme: "dark" }}
        />
      ) : (
        <div className="flex h-[640px] items-center justify-center font-mono text-xs uppercase tracking-[0.2em] text-mid">
          Loading scheduler…
        </div>
      )}
    </div>
  );
}
