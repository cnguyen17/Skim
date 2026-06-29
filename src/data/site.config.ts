// src/data/site.config.ts
// §13 Content manifest — SINGLE SOURCE OF TRUTH for all content/links.
// Never hardcode links/titles in components; read everything from here.

export const site = {
  name: "skim",
  handle: "mynameizskim",
  tagline: "prod. skim | dj skim",
  blurb: "DJ and producer. Bear holding skim milk, because — skim.",

  // Primary CTAs — labels + routes (Nav, ContactCTA, etc.)
  ctas: {
    booking: { label: "Schedule booking", to: "/booking" },
    equipment: { label: "Equipment rental", to: "/equipment" },
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
    // variant="face": aligned transparent-PNG cutouts of the same face, each with
    // different sunglasses. Sorted by filename; the glasses cycle through all of
    // these on scroll and settle on `settleFrame`.
    faceFrames: [
      "/images/sets/Skim/face-01.png",
      "/images/sets/Skim/face-02.png",
      "/images/sets/Skim/face-03.png",
      "/images/sets/Skim/face-04.png",
      "/images/sets/Skim/face-05.png",
      "/images/sets/Skim/face-07.png",
      "/images/sets/Skim/face-08.png",
      "/images/sets/Skim/face-09.png",
    ] as string[],
    settleFrame: 7, // index the cycle eases to / lands on (default: last frame)
    // Framing for 683×683 aligned face PNGs. object-contain = no crop; full head
    // + shoulders always visible. Scale nudges slightly on scroll as letterbox forms.
    faceFraming: {
      objectFit: "contain" as const,
      objectPosition: "50% 50%",
      scaleOpen: 1,
      scaleClosed: 1.06,
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
    { type: "youtube", id: "1ots2rodrq0",            title: "Reset by Cadabloo feat. DJ Skim" },
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

  // Set photos for the filterable gallery
  // gallery: [{ src: "/images/sets/xxx.webp", set: "the-pool", alt: "..." }, ...]
  gallery: [] as { src: string; set: string; alt: string }[],

  // Equipment available to rent (owner fills)
  equipment: [
    // { name: "Pioneer DJ CDJ-3000 (pair)", img: "/images/gear/cdj.webp", note: "Setup available" },
  ],

  booking: {
    // Override via VITE_CALCOM_USER / VITE_WEB3FORMS_KEY in .env.local (see .env.example).
    calcomUser: "TODO-calcom-username", // e.g. "skim" → cal.com/skim
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
      {
        id: "equipment",
        title: "Equipment + setup",
        note: "Rent his gear; he can set it up.",
        slug: "TODO-equipment-slug", // e.g. "equipment-rental"
      },
    ],
  },
} as const;
