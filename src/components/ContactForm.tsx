// src/components/ContactForm.tsx
// §9 contact — a plain form that POSTs to Web3Forms (no backend). It just emails
// skim. The access key lives in site.config (§0). If the key is still the TODO
// placeholder, the form explains what's needed instead of failing silently.
//
// Accessible: real <label>s, a honeypot for bots, status announced via
// aria-live, and disabled/aria-busy states while sending.

import { useState } from "react";
import { site } from "../data/site.config";

type Status = "idle" | "submitting" | "success" | "error";

const KEY = site.booking.web3formsKey;
const CONFIGURED = !!KEY && !KEY.startsWith("TODO");

export function ContactForm({ subject = "New message from skim.site" }: { subject?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!CONFIGURED) return;
    setStatus("submitting");
    setError("");

    const form = e.currentTarget;
    const data = new FormData(form);
    data.append("access_key", KEY);
    data.append("subject", subject);

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      if (json.success) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
        setError(json.message || "Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  }

  const inputClass =
    "w-full rounded-lg border border-line bg-ink-2 px-4 py-3 font-body text-sm text-milk placeholder:text-mid focus:border-accent focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!CONFIGURED && (
        <p className="rounded-lg border border-accent-2/40 bg-accent-2/10 px-4 py-3 font-mono text-xs uppercase tracking-[0.15em] text-accent-2">
          Form not yet configured — add a Web3Forms key in site.config.
        </p>
      )}

      {/* honeypot */}
      <input
        type="checkbox"
        name="botcheck"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block font-mono text-[0.7rem] uppercase tracking-[0.2em] text-mid">
            Name
          </span>
          <input name="name" required autoComplete="name" className={inputClass} placeholder="Your name" />
        </label>
        <label className="block">
          <span className="mb-1 block font-mono text-[0.7rem] uppercase tracking-[0.2em] text-mid">
            Email
          </span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            placeholder="you@email.com"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block font-mono text-[0.7rem] uppercase tracking-[0.2em] text-mid">
          What do you need?
        </span>
        <textarea
          name="message"
          required
          rows={5}
          className={inputClass}
          placeholder="Booking, equipment, a collab — tell skim what you're after."
        />
      </label>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={!CONFIGURED || status === "submitting"}
          aria-busy={status === "submitting"}
          className="rounded-full bg-accent px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-ink transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "submitting" ? "Sending…" : "Send message"}
        </button>

        <p aria-live="polite" className="font-mono text-xs">
          {status === "success" && (
            <span className="text-accent">Sent — skim will be in touch.</span>
          )}
          {status === "error" && <span className="text-accent-2">{error}</span>}
        </p>
      </div>
    </form>
  );
}
