// src/data/site.config.ts
// §13 Content manifest — SINGLE SOURCE OF TRUTH for all content/links.
// Never hardcode links/titles in components; read everything from here.

import { galleryPhotos } from "./gallery.generated";

export const site = {
  name: "skim",
  handle: "mynameizskim",
  tagline: "prod. skim | dj skim",
  blurb: "DJ and producer. Bear holding skim milk, because — skim.",

  // Primary CTAs — labels + routes (Nav, ContactCTA, etc.)
  ctas: {
    booking: { label: "Schedule booking", to: "/booking" },
  },

  // Brand assets
  assets: {
    logo:      "/skim-logo.png",  // PROVIDED — SKIM wordmark (nav + loader)
    mascot:    "/bear.svg",       // bear-with-milk — 3D hero (owner provides)
    signature: "/signature.svg",  // legacy — replaced by logoReveal in hero
    logoReveal: {
      full:     "/images/logo/full.png",
      letters:  [
        "/images/logo/letter-s.png",
        "/images/logo/letter-k.png",
        "/images/logo/letter-i.png",
        "/images/logo/letter-m.png",
      ],
      halo:     "/images/logo/halo.png",
      sparkles: "/images/logo/sparkles.png",
    },
  },

  // Scroll-driven hero (HERO_SEQUENCE.md). `centerpiece` is "logo" now and
  // becomes "face" once skim provides the aligned sunglasses frames below.
  // `message` is the side display text drifting through the hero — skim's OWN
  // words (not Lando's). Edit these here, never in the component.
  hero: {
    centerpiece: "face" as "logo" | "face",
    // Final hero frame copy (end of the scrubbed sequence). Strings only — the
    // styling/animation live in Hero.tsx. The sub line is rendered from
    // `site.handle` (shown as @MYNAMEIZSKIM via CSS uppercase), so the handle
    // stays a single source of truth.
    outro: { headline: "WELCOME TO THE FRIDGE" },
    // variant="face": transparent PNGs (source headshots 3–14), position-registered
    // in `aligned/` so the swap reads as glasses changing. Alpha preserved so
    // marble shows through. Cycle settles on headshot-14.
    faceFrames: [
      "/images/sets/Skim/aligned/skim-headshot-3.webp",
      "/images/sets/Skim/aligned/skim-headshot-4.webp",
      "/images/sets/Skim/aligned/skim-headshot-5.webp",
      "/images/sets/Skim/aligned/skim-headshot-6.webp",
      "/images/sets/Skim/aligned/skim-headshot-7.webp",
      "/images/sets/Skim/aligned/skim-headshot-8.webp",
      "/images/sets/Skim/aligned/skim-headshot-9.webp",
      "/images/sets/Skim/aligned/skim-headshot-10.webp",
      "/images/sets/Skim/aligned/skim-headshot-11.webp",
      "/images/sets/Skim/aligned/skim-headshot-12.webp",
      "/images/sets/Skim/aligned/skim-headshot-13.webp",
      "/images/sets/Skim/aligned/skim-headshot-14.webp",
    ] as string[],
    settleFrame: 11, // lands on headshot-14
    // Framing for face-aligned 1600×1067 transparent PNGs.
    // Bottom-planted: torso rests on the cyan frame edge the whole scrub
    // (overflow clips headroom; scale grows from the bottom).
    // xPercent stays 0 so the cutout sits centered in the cyan frame.
    faceFraming: {
      objectFit: "contain" as const,
      objectPosition: "50% 100%",
      scaleOpen: 1.1,
      scaleClosed: 1.14,
      xPercent: 0,
      yOpen: 0,
      yMid: 0,
      yClosed: 0,
      mobile: {
        objectFit: "cover" as const,
        objectPosition: "50% 100%",
        scaleOpen: 1.22,
        scaleClosed: 1.26,
        xPercent: 0,
        // Keep planting the torso on the frame bottom (cover + bottom origin).
        yOpen: 0,
        yMid: 0,
        yClosed: 0,
      },
    },
  },

  socials: {
    instagram:  "https://www.instagram.com/mynameizskim",
    tiktok:     "https://www.tiktok.com/@mynameizskim",
    soundcloud: "https://soundcloud.com/mynameizskim",
    linktree:   "https://linktr.ee/mynameizskim",
  },

  // DJ sets (YouTube video IDs)
  sets: [
    { id: "blFw202KP9k", title: "Birthday Mix 2025" },
    { id: "ndCgRAfnuYk", title: "In Night of R&B" },
    { id: "VXxkAAP2G9E", title: "Poolside Set" },
    { id: "3JTcG711GcA", title: "Hip Hop Set" },
  ],

  // Production credits
  producing: [
    { type: "spotify", id: "6NVrIy22BHf8CybljCdohU", title: "Crush Lounge Rework" },
    { type: "youtube", id: "1ots2rodrq0",            title: "Reset by Cadabloo feat. Skim" },
  ],

  // Collaborations — sets & skits skim produced for others. Its own standalone
  // section on Home (no longer bundled under the Work tabs). Reuses the media
  // embeds; empty until skim lists credits here.
  collaborations: [] as {
    type: "youtube" | "spotify";
    id: string;
    title: string;
    role?: string;
  }[],

  // Set photos — paginated grid gallery + lightbox. AUTO-SYNCED from a Google
  // Drive folder at build time (scripts/sync-gallery.mjs → gallery.generated.ts).
  // To add photos: drop them in the Drive folder (see README "Updating gallery
  // photos"). Do not hand-edit — this reads the generated manifest.
  gallery: galleryPhotos as { src: string; set: string; alt: string }[],

  booking: {
    // Override via VITE_CALCOM_USER / VITE_WEB3FORMS_KEY in .env.local (see .env.example).
    calcomUser: "skimproductionent", // cal.com/skimproductionent
    web3formsKey: "TODO-web3forms-access-key", // free key at web3forms.com
    // One Cal.com event type per service. Slug = URL segment after the username
    // (cal.com/{username}/{slug}). Leave TODO until event types exist in Cal.com.
    events: [
      {
        id: "dj-set",
        title: "Book a DJ set",
        note: "Parties, clubs, events — pick a time.",
        slug: "TODO-dj-set-slug", // e.g. "dj-set"
      },
      {
        id: "meeting",
        title: "General meeting",
        note: "Collabs, production, or just a chat.",
        slug: "TODO-meeting-slug", // e.g. "30min" or "general-meeting"
      },
    ],
  },
} as const;

// Event history (46 shows, Dec 2023 → Jul 2026) powering the Collaborations
// timeline. Kept in its own module for size, re-exported here so content still
// has one front door (§0).
export { timelineEvents, timelineNewestFirst, type TimelineEvent } from "./timeline";
