// src/components/BookingEmbed.tsx
// §9 booking — Cal.com inline embed (free, no backend). The username lives in
// site.config (§0). Mounts lazily when scrolled near (§10). If the username is
// still the TODO placeholder, it shows setup guidance instead of an empty embed.

import { useEffect, useRef, useState } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { site } from "../data/site.config";

const USER = site.booking.calcomUser;
const CONFIGURED = !!USER && !USER.startsWith("TODO");
const NS = "skim-booking";

export function BookingEmbed() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !CONFIGURED) return;
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

  if (!CONFIGURED) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-ink-2 p-10 text-center">
        <p className="font-display text-2xl uppercase text-milk">Booking opens soon</p>
        <p className="mt-2 font-body text-sm text-mid">
          Add a Cal.com username in site.config to embed live scheduling here.
        </p>
      </div>
    );
  }

  return (
    <div ref={ref} className="overflow-hidden rounded-xl border border-line bg-ink-2">
      {show ? (
        <Cal
          namespace={NS}
          calLink={USER}
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
