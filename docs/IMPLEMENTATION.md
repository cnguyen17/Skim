# skim — Implementation Status

> Handoff/context doc. Snapshot of what's built as of the initial scaffold →
> first full pass. Source of truth for the brief is [`../CLAUDE.md`](../CLAUDE.md);
> this file describes **what actually exists in the code** and what's still
> placeholder, so a fresh chat can pick up without re-reading everything.

Last updated: 2026-06-25 · Branch: `main` · Remote: `github.com/cnguyen17/Skim`

---

## 1. TL;DR

A fast, no-backend DJ/producer portfolio. Vite + React + TS SPA with a 3D hero,
smooth scroll, scroll reveals, and lazy external embeds. **All 9 build phases in
CLAUDE.md §14 have a first pass committed.** It builds clean (`npm run build`)
and runs (`npm run dev` → http://localhost:5173). It is **not deployed** and
several owner-provided assets/keys are still placeholders (see §6).

What's good: structure, motion system, performance posture, accessibility
plumbing. What needs work: real content/assets, visual polish on several
sections, and the things called out in §7.

---

## 2. How to run

```bash
npm install        # first time / after dependency changes
npm run dev        # http://localhost:5173  (hot reload)
npm run build      # tsc -b type-check + production build → dist/
npm run preview    # serve the production build → http://localhost:4173
```

Node 24, npm 11 used during build. `node_modules/` and `dist/` are gitignored.

---

## 3. Tech stack (installed & wired)

| Concern | Choice |
|---|---|
| Framework | Vite 8 + React 19 + TypeScript |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`, `@theme` tokens) |
| Smooth scroll | Lenis |
| Scroll animation | GSAP + ScrollTrigger |
| 3D | React Three Fiber + drei + three |
| Routing | react-router-dom v7 |
| YouTube | lite-youtube-embed (thumbnail-first) |
| Spotify | official iframe (lazy) |
| Booking | `@calcom/embed-react` (Cal.com) |
| Contact | Web3Forms (POST, no backend) |

No backend, no DB, no auth — by design (CLAUDE.md §0).

---

## 4. Project structure

```
src/
  main.tsx                  # entry; imports styles/globals.css
  App.tsx                   # Router + LenisProvider + Layout route (lazy routes)
  styles/
    tokens.css              # §3 design tokens → Tailwind @theme (ONLY place colors/fonts live)
    globals.css             # base, .roll, .reveal, Lenis + reduced-motion CSS
  data/
    site.config.ts          # §13 content manifest (ONLY place content/links live)
  lib/
    gsap.ts                 # registers ScrollTrigger once
  hooks/
    useReducedMotion.ts     # prefers-reduced-motion (live)
    useTilt.ts              # cursor tilt for cards (reduced-motion safe)
  three/
    Background.tsx          # ambient mouse-reactive shader plane
    HeroBear.tsx            # swappable textured-plane centerpiece
  components/
    Layout.tsx              # skip-link + Nav + <main> + Footer + Loader
    Nav.tsx                 # logo + focus-trapped overlay menu + "Get in contact"
    Footer.tsx              # socials from config
    Loader.tsx              # first-load wordmark intro (sessionStorage)
    LenisProvider.tsx       # Lenis + ScrollTrigger wiring; exposes useLenis()
    RollText.tsx            # per-letter roll (cross-browser)
    Reveal.tsx              # IntersectionObserver rise+fade
    Hero.tsx                # hero stage; lazy-mounts HeroCanvas; static fallback
    HeroCanvas.tsx          # R3F <Canvas> (lazy chunk); camera dolly
    Signature.tsx           # SVG stroke-dashoffset draw-in (placeholder path)
    Bio.tsx                 # story + "Nutrition Facts" panel (brand device)
    WorkTabs.tsx            # DJ Sets / Producing / Collaborations tabs
    VideoCard.tsx           # <lite-youtube> wrapper + tilt
    SpotifyEmbed.tsx        # lazy Spotify iframe
    Gallery.tsx             # filterable grid + custom lightbox
    ContactForm.tsx         # Web3Forms form
    BookingEmbed.tsx        # Cal.com inline embed (lazy)
    ContactCTA.tsx          # Home contact band
    icons.tsx               # inline social SVGs
  types/
    lite-youtube.d.ts       # JSX typing for <lite-youtube>
public/
  skim-logo.png             # provided wordmark (nav, loader, hero fallback)
  _redirects                # SPA fallback for Cloudflare Pages
  images/sets/.gitkeep      # owner drops set photos here
```

---

## 5. Routes & what each renders

- **`/` (Home)** — `Hero` → `Bio` (`#bio`) → Work section (`#work`, `WorkTabs`)
  → `ContactCTA` (`#contact`). Nav "DJ Info" links to `/#bio`.
- **`/sets`** — `WorkTabs` + `Gallery`.
- **`/equipment`** — gear grid (empty state for now) + "Request this" → Booking.
- **`/booking`** — three services, `BookingEmbed`, `ContactForm`.

Routes are `React.lazy` code-split. Shared chrome (Nav/Footer/Loader/skip-link)
lives in `Layout.tsx`.

---

## 6. Placeholders & owner TODOs (important)

These are intentionally stubbed and gated so nothing breaks while empty:

| Thing | Where | Current behavior |
|---|---|---|
| Cal.com username | `site.config.booking.calcomUser` (`TODO-…`) | Booking shows a "setup soon" notice instead of the embed |
| Web3Forms key | `site.config.booking.web3formsKey` (`TODO-…`) | Contact form shows "not configured" + disabled submit |
| Set / track titles | `site.config.sets[].title`, `producing[].title` | Literal "TODO …" strings render |
| Gallery photos | `site.config.gallery` (empty) + `public/images/sets/` | Gallery shows "Photos coming soon" |
| Equipment list | `site.config.equipment` (empty) | Equipment shows "Gear list coming soon" |
| Bear mascot art | `public/bear.svg` (missing) | Hero centerpiece uses the **wordmark** as a stand-in |
| Signature art | `public/signature.svg` (missing) | `Signature.tsx` draws a **placeholder vector path** |

The hero centerpiece is architected as a **swappable layer** — dropping in
`bear.svg` (or the v2 portrait) needs no scene-logic changes.

---

## 7. Known gaps / candidate improvements (for the next chat)

Honest list of what's thin or worth revisiting:

**Content / assets**
- Real set & track titles (can be pulled from the YouTube/Spotify pages).
- Bear mascot + signature SVGs; until then the hero reads as two wordmarks
  (3D centerpiece + big DOM "SKIM") — fine as placeholder, but the composition
  should be revisited once the bear lands.
- Real bio copy / photography.

**3D hero (Phase 4)**
- It's a textured **plane**, not a true 3D model. The shader background is a
  simple value-noise gradient; could be richer (and tuned for the brand).
- No low-end-mobile downgrade beyond "no WebGL → static image"; consider a
  perf/DPR heuristic to ship the static hero on weak devices (CLAUDE.md §10).
- v2 "many identities / sunglasses" portrait-filter hero (§7) is **not started**
  (roadmap; hooks exist via the swappable centerpiece).

**Visual polish**
- Type scale, spacing rhythm, and section transitions are a first pass.
- Nav overlay uses a numbered index (01–05) — revisit if it reads generic.
- The "Nutrition Facts" panel is the signature device; lean into or refine it.
- Mobile layout verified structurally (responsive classes) but **not** eyeballed
  on a device.

**Verification not yet done**
- No real browser/visual QA or Lighthouse run in this environment — only clean
  `tsc` build + HTTP smoke tests. Run `npm run dev`, click through, and run
  mobile Lighthouse (CLAUDE.md §10 target: green perf on mobile).
- `lite-youtube`, R3F canvas, Cal embed, and the contact POST were **not**
  exercised in a live browser — worth a manual pass.

**Misc**
- Footer surfaces the 4 socials in `site.config` (IG/TikTok/SoundCloud/Linktree).
  CLAUDE.md §6 also lists YouTube/Spotify in the footer — add those URLs to
  `site.config.socials` if direct links are wanted (Linktree currently covers them).
- No tests, no analytics, no error boundary around the lazy canvas.

---

## 8. Design system quick reference

Tokens (edit `src/styles/tokens.css` only):

```
--ink #0F0E0C   --ink-2 #151310   --milk #F7F2E8
--accent #58D7FF (cyan, the one accent)   --accent-2 #FFE24D (yellow, sparing)
--mid #9AA1AD   --line rgba(247,242,232,.14)
--font-display Anton  --font-body Inter  --font-mono "JetBrains Mono"
```

Tailwind utilities map to these: `bg-ink`, `text-milk`, `text-accent`,
`font-display`, `font-mono`, `border-line`, etc.

Signature elements: per-letter **roll** on nav/headings (`RollText`), ambient
**WebGL** hero, **Nutrition Facts** milk-carton panel (the skim→milk pun, used as
the data/telemetry motif).

---

## 9. Accessibility & performance posture

- Skip-to-content link; single `<main>` landmark; visible `:focus-visible`.
- Menu overlay and lightbox trap focus, close on Esc, lock scroll.
- Real `prefers-reduced-motion` path: Lenis disabled, 3D → static wordmark,
  reveals instant, transitions zeroed.
- Bundle: main ~129 KB gz; **three.js isolated in a lazy, Home-only ~236 KB gz
  chunk** mounted only near-viewport; route-level splitting; YouTube/Spotify/Cal
  all lazy.

---

## 10. Git / phases

One commit per phase on `main`:

```
Phase 1  Scaffold
Phase 2+3 Shell, motion base, loader
Phase 4  3D hero
Phase 5  Content sections
Phase 6+7 Gallery, equipment, booking, contact
Phase 8  Performance + a11y pass
Phase 9  Deploy readiness + README
```

Deploy target is Cloudflare Pages (build `npm run build`, output `dist`, SPA
fallback via `public/_redirects`) — **not executed yet**. See README for steps.
