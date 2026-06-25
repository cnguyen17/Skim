# HERO_SEQUENCE.md — scroll-driven hero (attach alongside CLAUDE.md for Phase 4)

> **This is an addendum to `CLAUDE.md`.** It refines and **supersedes** the hero
> described in CLAUDE.md §7, and overrides the "consistently dark hero" assumption
> in §3/§8: the hero now **starts on a light/near-white background and flips to dark
> as you scroll.** Everything else in CLAUDE.md (stack, tokens, content, rules) still applies.
>
> Reference feel: the landonorris.com hero. We recreate the **techniques and motion**,
> not its assets or copy. All faces, signatures, headlines, and colors are skim's own.

---

## 0. The single most important idea

The whole hero is **ONE pinned section** playing **ONE GSAP timeline** that is
**scrubbed by scroll position** (not by time), with **Lenis** providing smooth scroll.
Every element below is a track on that one timeline, so they move together as a single
continuous, fluid motion. Do not build these as separate, independently-triggered
animations — that's what kills the "fluidity" the client is asking for.

The two client priorities, in order:
1. **The ambient background + its fluidity** (drifting contour lines; colors invert white→dark).
2. **The continuous scrubbed motion** of the whole hero as you scroll.

---

## 1. Beat sheet (scroll choreography)

The pinned hero spans ~**300vh** of scroll (tune later). `p` = scroll progress 0→1
through the pinned section. Approximate timing:

| p | Background | Centerpiece (window) | Side display text | Signature | Nav |
|------|-----------|----------------------|-------------------|-----------|-----|
| 0.00 | **light/near-white**, faint contour lines | full-bleed, large, centered; ambient idle motion | hidden | hidden | dark text on light |
| 0.15 | begins lerp light→dark | drops into a **framed window**; begins to **scale down** | slides in from both side edges | hidden | inverts to light text as bg darkens |
| 0.40 | **dark** | window noticeably smaller (letterbox) | **drifting horizontally** with scroll | **starts drawing** (stroke reveal) over the window | light |
| 0.65 | dark | window small, slightly muted/darkened overlay | continues drifting | **fully drawn** across the window | light |
| 0.85→1.0 | dark | window **scales/translates up and out** | exits | exits with window | light |
| >1.0 | dark content section | — | huge headline + emblem (CLAUDE.md §6 step 5) | — | light |

The background **never hard-cuts** white→dark — it's a continuous lerp driven by `p`.

---

## 2. Elements (each is a track on the one timeline)

### A. Ambient background (highest priority)
- Full-viewport, sits behind everything, **fixed** while the hero is pinned.
- Look: slowly **drifting contour / topographic lines** (faint), with very subtle **mouse parallax**.
- Its base color/tone is driven by `p`: **`--milk` → `--ink`** as you scroll. The line color
  inverts too (dark lines on light at top, light lines on dark below).
- Recommended build: an **R3F full-screen shader plane** for the tone + flow, with a faint
  **SVG/canvas contour overlay** drifting on top. The white→dark is a single shader uniform
  (`uMix`) you set from `p`. (A pure-canvas flow-field is an acceptable lighter alternative.)

### B. Centerpiece "window" (the swappable layer)
- At `p=0` it's effectively full-bleed; as `p` increases it animates into a **bordered
  rectangle that scales down** (scale + inset), like the subject getting "framed."
- **NOW:** the centerpiece is the **SKIM wordmark** (`/skim-logo.png`) — or a placeholder
  face if you'd rather test the frame mechanic early.
- **LATER:** the centerpiece is **skim's face with the sunglasses frame-swap** (§3).
- Build this as `<Centerpiece variant="logo" | "face" />` so swapping is a prop change,
  and the scale/scroll logic never assumes which variant is mounted.

### C. Side display text (horizontal marquee, scroll-linked)
- Two oversized text rows (display + a secondary weight) that **slide in from the side
  edges** around `p≈0.15` and **drift horizontally** as `p` increases (translateX tied to `p`).
- **Copy is skim's own** — a short message/hype line he writes (e.g. his own "message from skim").
  Do NOT use Lando's words. Put the strings in `site.config.ts`.

### D. Signature draw
- An **SVG of skim's signature** (`/signature.svg`), revealed via **`stroke-dasharray` /
  `stroke-dashoffset`** scrubbed from `p≈0.40` (start) to `p≈0.65` (fully drawn), in `--accent`.
- Sits **over** the centerpiece window. Exits with the window after `p≈0.85`.

### E. Nav inversion
- Nav text/logo color crossfades **dark→light** as the background darkens (tie to the same `p`,
  or a ScrollTrigger toggle around `p≈0.15`). Keep contrast AA at every point.

---

## 3. NOW vs EVENTUAL — the centerpiece

**NOW (build this):** `variant="logo"` — the SKIM wordmark in the window, with idle
float + mouse parallax, scaling down on scroll. Ship the full motion (background flip,
window shrink, side text, signature, exit) with the logo as the subject.

**EVENTUAL (scaffold hooks, don't fully build):** `variant="face"` — the **sunglasses
frame-swap**:
- skim provides **6–7 photos of the same face**, identically framed, each with **different
  sunglasses**. Put them in `public/images/face/01.webp … 07.webp` and list in `site.config.ts`.
- As `p` advances through a sub-range (say `0.0→0.5`), map progress to a **frame index** so the
  glasses appear to **flip through** the options — fast at first, **easing to settle on a final
  pair** by the time the window is small.
- Mechanic: render the frames stacked; show `frames[index]` where
  `index = Math.min(n-1, Math.floor(ease(pSub) * n))`. Preload all frames. Keep faces pixel-aligned
  so only the glasses appear to change. This drops in without touching the scroll/scale logic.

```ts
// site.config.ts additions
hero: {
  centerpiece: "logo",              // "logo" now → "face" later
  message: ["TODO line one", "TODO line two"],   // side display text (skim's own words)
  faceFrames: [                     // for variant="face" (eventual)
    // "/images/face/01.webp", ... "/images/face/07.webp"
  ],
},
```

---

## 4. Technical implementation

### 4.1 Smooth scroll + ScrollTrigger (fluidity backbone)
```ts
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({ smoothWheel: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```

### 4.2 The one pinned, scrubbed timeline
```ts
// inside a useGSAP/useLayoutEffect in the Hero component
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: heroRef.current,
    start: "top top",
    end: "+=300%",     // pinned length; tune
    scrub: true,       // <-- scroll drives the timeline (the "fluidity")
    pin: true,
    onUpdate: (self) => setP(self.progress), // feed p to the bg shader uniform if needed
  },
});

// A. background tone (if not shader-driven): lerp a CSS var
tl.to(":root", { "--bg-mix": 1, ease: "none" }, 0);          // 0 = milk, 1 = ink
// B. centerpiece window shrink
tl.fromTo(windowRef.current,
  { scale: 1.15, borderRadius: 0 },
  { scale: 0.46, borderRadius: 8, ease: "none" }, 0);
// C. side text drift in + across
tl.fromTo(textLeftRef.current,  { xPercent: -8, autoAlpha: 0 }, { xPercent: -34, autoAlpha: 1, ease: "none" }, 0.12);
tl.fromTo(textRightRef.current, { xPercent: 8,  autoAlpha: 0 }, { xPercent: 34,  autoAlpha: 1, ease: "none" }, 0.12);
// D. signature draw
tl.fromTo(sigPathRef.current,
  { strokeDashoffset: SIG_LEN },
  { strokeDashoffset: 0, ease: "none" }, 0.40);   // finishes ~0.65 via duration
// E. exit
tl.to(windowRef.current, { yPercent: -120, autoAlpha: 0, ease: "none" }, 0.85);
```

### 4.3 Background white→dark
- **Preferred:** a shader uniform `uMix` on the R3F background plane, set from `p`
  (lerp `--milk`→`--ink`, and invert line color). One uniform, no layout thrash.
- **Fallback:** animate a CSS variable `--bg-mix` (as above) and compute the page bg with
  `color-mix(in srgb, var(--milk), var(--ink) calc(var(--bg-mix) * 100%))`.

### 4.4 Signature SVG
- Inline the `<svg>`, single `<path>`. On mount, `SIG_LEN = path.getTotalLength()`, set
  `strokeDasharray = strokeDashoffset = SIG_LEN`, then scrub offset → 0. Color `var(--accent)`.

### 4.5 Sunglasses frame-swap (eventual, scaffold only)
```tsx
const frames = site.hero.faceFrames;
const idx = Math.min(frames.length - 1,
  Math.floor(gsap.parseEase("power2.out")(Math.min(p / 0.5, 1)) * frames.length));
return frames.map((src, i) => (
  <img key={src} src={src} alt="" style={{ opacity: i === idx ? 1 : 0 }} />
));
```

---

## 5. Reduced motion / performance / mobile

- `prefers-reduced-motion`: **disable the pin/scrub entirely.** Render a **static hero**:
  dark background, centerpiece (logo/face) at its small size, signature already drawn, side
  text in place. No flip, no scrub. Fully usable and calm.
- Lazy-mount the R3F background; cap DPR ~2; pause its loop when the hero is offscreen.
- Preload `skim-logo.png` (and the 7 face frames when `variant="face"`). Compress to WebP/AVIF.
- On small screens: reduce pinned length, simplify the background (fewer contour lines), and
  keep the side text inside the viewport (smaller `xPercent`).

---

## 6. Definition of done (this hero)

- Pinned hero plays as **one continuous scrubbed motion**; nothing pops independently.
- Background **lerps light→dark** with inverting contour lines; subtle mouse parallax.
- Centerpiece **frames + scales down**, signature **draws over it**, side text **drifts**, then it **exits up** to the dark headline section.
- `variant="logo"` works now with `skim-logo.png`; `variant="face"` frame-swap is scaffolded and swappable via prop + config.
- Reduced-motion shows a clean static hero. Mobile is smooth and readable.

---

## 7. How to run this in Claude Code

Attach **both** `CLAUDE.md` and `HERO_SEQUENCE.md`, then for the hero phase:

```
Read CLAUDE.md, then read HERO_SEQUENCE.md. HERO_SEQUENCE.md refines the Phase 4 hero
and supersedes CLAUDE.md §7 plus the dark-only note in §3/§8.

Implement the Phase 4 hero exactly as specified in HERO_SEQUENCE.md:
one pinned, scroll-scrubbed GSAP timeline driven by Lenis; the ambient contour
background that lerps light→dark; the centerpiece window that frames + scales down;
the side display-text drift; the signature stroke draw; and the exit.

Build the centerpiece as <Centerpiece variant="logo"|"face" />. Use variant="logo"
with /skim-logo.png for now, and scaffold (do not finish) the variant="face"
sunglasses frame-swap per §3. Honor reduced-motion (§5) with a static hero.

Add the `hero` block to site.config.ts (§3). Before coding, give me a short plan and
confirm the pinned length and the p-values you'll use. Then build. Use the
frontend-design skill for the visual pass. Stop when `npm run build` is clean and
show me a preview to scrub.
```
