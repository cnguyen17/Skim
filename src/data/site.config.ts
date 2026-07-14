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
      "/images/sets/Skim/aligned/skim-headshot-3.png",
      "/images/sets/Skim/aligned/skim-headshot-4.png",
      "/images/sets/Skim/aligned/skim-headshot-5.png",
      "/images/sets/Skim/aligned/skim-headshot-6.png",
      "/images/sets/Skim/aligned/skim-headshot-7.png",
      "/images/sets/Skim/aligned/skim-headshot-8.png",
      "/images/sets/Skim/aligned/skim-headshot-9.png",
      "/images/sets/Skim/aligned/skim-headshot-10.png",
      "/images/sets/Skim/aligned/skim-headshot-11.png",
      "/images/sets/Skim/aligned/skim-headshot-12.png",
      "/images/sets/Skim/aligned/skim-headshot-13.png",
      "/images/sets/Skim/aligned/skim-headshot-14.png",
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

  // Set photos — paginated grid gallery + lightbox. Drop more into
  // public/images/gallery/ and list them here.
  // Order = page order. Best set (former page 3) leads so it opens first.
  gallery: [
    { src: "/images/gallery/collage_11.webp", set: "sets", alt: "skim photo collage" },
    { src: "/images/gallery/img_2282.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_2912.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_2916.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_3480.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_3482.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_3483.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_3495.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_3496.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_4019.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_4020.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_4021.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/01jdy0p0jqage66jdg39883g75-low-res-branded.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/01jdy0z1amzcg4acc6n96zhez8-low-res-branded.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/01jx4q15wqsgpp4whpzpeqkp1x-low-res-branded.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/01jx4q68cq2csxvy92j11tg9bz-low-res-branded.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/105_9996.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/106_0003.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/8e9bad19-75c0-4f4c-8124-ac604fd30849.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/_glv7915-1.webp", set: "sets", alt: "skim at the decks" },
    { src: "/images/gallery/_glv7977.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/_glv8196.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/_glv8216.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/b1368eb2-6f61-4f1d-8762-bd72ece7df51.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/capture-one-catalog2833.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/capture-one-catalog2863.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/capture-one-catalog2906-1.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/capture-one-catalog2925.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/capture-one-catalog2982.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/capture-one-catalog3024.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/capture-one-catalog3062.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/capture-one-catalog3075.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/capture-one-catalog3104.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/capture-one-catalog3180.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/capture-one-catalog3215.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/capture-one-catalog3261.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_4023.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_4850.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_9093.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_9927.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_9929.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_9931.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_9934.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_9936.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_9938.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_9939.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_9940.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_9941.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_9942.webp", set: "sets", alt: "skim live set" },
    { src: "/images/gallery/img_9943.webp", set: "sets", alt: "skim live set" },
  ] as { src: string; set: string; alt: string }[],

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
