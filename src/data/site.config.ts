// src/data/site.config.ts
// §13 Content manifest — SINGLE SOURCE OF TRUTH for all content/links.
// Never hardcode links/titles in components; read everything from here.

export const site = {
  name: "skim",
  handle: "mynameizskim",
  tagline: "prod. skim | dj skim",
  blurb: "DJ and producer. Bear holding skim milk, because — skim.",

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
    message: ["turn it up", "prod. skim · dj skim"], // TODO: skim's own hype line
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
    { id: "blFw202KP9k", title: "TODO set title" },
    { id: "ndCgRAfnuYk", title: "TODO set title" },
    { id: "VXxkAAP2G9E", title: "TODO set title" },
    { id: "3JTcG711GcA", title: "TODO set title" },
  ],

  // Production credits
  producing: [
    { type: "spotify", id: "6NVrIy22BHf8CybljCdohU", title: "TODO track" },
    { type: "youtube", id: "1ots2rodrq0",            title: "TODO track" },
  ],

  // Set photos for the filterable gallery
  // gallery: [{ src: "/images/sets/xxx.webp", set: "the-pool", alt: "..." }, ...]
  gallery: [] as { src: string; set: string; alt: string }[],

  // Equipment available to rent (owner fills)
  equipment: [
    // { name: "Pioneer DJ CDJ-3000 (pair)", img: "/images/gear/cdj.webp", note: "Setup available" },
  ],

  booking: {
    calcomUser: "TODO-calcom-username",   // create at cal.com (free)
    web3formsKey: "TODO-web3forms-access-key", // get free key at web3forms.com
  },
} as const;
