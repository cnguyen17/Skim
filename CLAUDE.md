# CLAUDE.md — skim DJ Portfolio

> This file is the source of truth for the build. Read it fully before any task.
> Goal: a fast, **3D-animated, mouse-reactive** portfolio for the DJ/producer **skim**,
> capturing the *feel* of landonorris.com (bold display type, fluid motion, a 3D hero,
> a signature reveal on scroll, ambient WebGL background) — but as **our own brand**,
> in **code** (not Webflow/Framer), deployed **free**.

---

## 0. Hard rules (do not violate)

- **No database, no auth, no backend.** Everything is static or an external embed. Nobody signs in.
- **We are inspired by Lando Norris's site, we do not copy it.** Do not lift its proprietary fonts, assets, color, or copy. Recreate the *techniques and feel* with our own brand. Use only free/open-licensed fonts and assets.
- **Performance is a feature.** This must load and feel fast (see §10). The 3D runs client-side on the visitor's GPU — keep the bundle lean and lazy-load heavy things.
- **Mobile + accessibility are non-negotiable.** Responsive to 360px, keyboard-focusable, and a real `prefers-reduced-motion` fallback (see §11).
- **Single source of truth for content** is `src/data/site.config.ts` (§13). Never hardcode links/titles in components.
- **Single source of truth for design tokens** is CSS variables in `src/styles/tokens.css` (§3). Never hardcode colors/fonts in components.
- Work in **phases** (§14). Do not attempt the whole site in one shot. Finish, verify, and commit each phase.
- Use the **frontend-design skill** for every visual/design pass (§12).

---

## 1. The client

- **Artist:** skim — handle `mynameizskim`. Tagline: **"prod. skim | dj skim."**
- **What he does:** DJ (live sets) **and** music producer.
- **Brand assets (two, different jobs):**
  - **Wordmark logo** — the cyan graffiti-bubble "SKIM" with a yellow halo + sparkle. File **provided**: `public/skim-logo.png`. This is the **top-of-page logo** (nav) and the **loader** graphic (it pops on load, like the brief described).
  - **Mascot** — a **bear holding a carton of milk** (a pun on *skim milk*). This is the **3D hero** centerpiece (v1, see §7). Owner provides the bear art.
- **Vibe:** hip-hop / R&B / amapiano / basshouse party energy. Confident, playful, clean.
- **What the site must do:** show his sets (YouTube), his production credits (Spotify/YouTube), link all socials, and let people **get in contact / book** him. That's it.

---

## 2. Services to surface

Three contact paths, all free, all no-backend (see §9):

1. **Book a DJ set** — Cal.com event type.
2. **General meeting / get in contact** — Cal.com event type (or the contact form).
3. **Equipment rental + setup** — a static list of his gear with a "request this" button that opens the contact form / a Cal.com event type. He owns gear he wants to rent out and can set up.

---

## 3. Design system

### Palette (DERIVED FROM THE LOGO — owner may tweak; keep them as tokens)
Warm near-black base (so the bright accent pops the way Lando's lime pops on black) + creamy "milk" light, with the accent taken straight from the logo: the **bubble cyan** as the one bright accent and the **halo yellow** as a sparing secondary.

```css
/* src/styles/tokens.css */
:root{
  --ink:        #0F0E0C;  /* warm near-black base (Lando uses ~#111112) */
  --ink-2:      #151310;
  --milk:       #F7F2E8;  /* cream / milk — primary light text */
  --accent:     #58D7FF;  /* logo bubble cyan — the ONE bright accent */
  --accent-2:   #FFE24D;  /* logo halo yellow — secondary, use rarely */
  --mid:        #9AA1AD;  /* muted secondary text */
  --line:       rgba(247,242,232,.14);
}
```
> All color in the app references these. To rebrand, the owner edits only this file. The accent values are sampled from `skim-logo.png` so the site and logo read as one brand.

### Type (FREE Google Fonts chosen to echo Lando's bold-condensed-poster energy)
We could not verify/legally reuse Lando's exact display face, so we use free analogs:

- **Display / hero / nav** → **Anton** (ultra-bold condensed; this carries the per-letter roll animation).
- **Body / UI** → **Inter**.
- **Labels / data / "telemetry"** → **JetBrains Mono**.

```html
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```
```css
--font-display:"Anton",Impact,sans-serif;
--font-body:"Inter",system-ui,sans-serif;
--font-mono:"JetBrains Mono",monospace;
```
> If skim later licenses a custom display font, swapping `--font-display` is the only change.

### Background / atmosphere (the "Lando feel")
- Dark base with a subtle **ambient WebGL background**: a slow shader gradient or drifting particle field that **reacts to the mouse** (parallax). One signature moment — do not stack effects everywhere.
- **Lenis** smooth scroll across the whole page (this is what makes it feel expensive).
- **GSAP + ScrollTrigger** for scroll-linked camera/scale moves and section reveals.
- Grain/noise overlay at very low opacity is allowed for texture.

### Signature text animation (port from the reference repo)
Recreate the per-letter hover "roll" used on Lando-style nav links. Mechanism: split each word into per-character `<span>`s, give each char two stacked copies (`::before` + `::after`), roll one out as the other rolls in on hover, **staggered per letter**. Use the cross-browser approach (compute the per-letter delay in JS, not the Chrome-only `sibling-index()`), so it works in Safari/Firefox.

```js
// split words into chars for the roll effect
function splitChars(el){
  const seg = new Intl.Segmenter(undefined,{granularity:"grapheme"});
  const chars = Array.from(seg.segment(el.textContent), s => s.segment);
  el.innerHTML = chars.map((c,i)=>
    `<span class="rl" style="--i:${i}" data-char="${c}">${c}</span>`).join("");
}
```
```css
.roll{font-family:var(--font-display);text-transform:uppercase;overflow:hidden;display:inline-flex}
.roll .rl{position:relative;color:transparent}
.roll .rl::before,.roll .rl::after{
  content:attr(data-char);position:absolute;left:0;color:var(--milk);
  transition:transform .3s ease;transition-delay:calc(var(--i) * 18ms);
}
.roll .rl::before{transform:translateY(0)}
.roll .rl::after{transform:translateY(110%)}
.roll:hover .rl::before{transform:translateY(-110%)}
.roll:hover .rl::after{transform:translateY(0)}
```
Apply `.roll` to nav links and key headings.

---

## 4. Tech stack (use exactly this)

- **Vite + React + TypeScript** — static SPA, smallest fast output.
- **React Three Fiber** (`@react-three/fiber`) + **@react-three/drei** — the 3D (Three.js for React).
- **GSAP** + **ScrollTrigger** — scroll-driven animation.
- **Lenis** (`lenis` / `@studio-freight/lenis`) — smooth scroll.
- **Tailwind CSS** — styling (tokens from §3 wired in as CSS vars; reference via `var()` or Tailwind theme).
- **lite-youtube-embed** — fast YouTube (loads a thumbnail; the player only mounts on click).
- **react-router-dom** — client routing for the menu tabs (Home / DJ Sets / Equipment / etc.).
- Lightbox: **yet-another-react-lightbox** (or a small custom one) for the photo gallery.

No Next.js (we chose Vite for the lightest static build + Cloudflare Pages). No state libraries needed.

---

## 5. Suggested structure

```
src/
  main.tsx
  App.tsx                  # router + Lenis provider + page shell
  styles/
    tokens.css             # §3 design tokens (only place colors/fonts live)
    globals.css
  data/
    site.config.ts         # §13 all content/links (only place content lives)
  three/
    Background.tsx         # ambient mouse-reactive WebGL bg (R3F canvas)
    HeroBear.tsx           # the 3D bear-mascot hero (§7)
  components/
    Nav.tsx                # top-left menu + top-right "Get in contact"
    Loader.tsx             # logo intro on load
    RollText.tsx           # §3 per-letter roll animation
    Reveal.tsx             # scroll-reveal wrapper (GSAP/IO)
    VideoCard.tsx          # lite-youtube wrapper
    Gallery.tsx            # filterable set-photo gallery + lightbox
    BookingEmbed.tsx       # Cal.com embed
    ContactForm.tsx        # Web3Forms form
  routes/
    Home.tsx               # hero → bio → sets/producing/collabs → contact
    Sets.tsx               # DJ sets + producing + collaborations (tabbed)
    Equipment.tsx          # rental list + request
    Booking.tsx            # Cal.com + contact
public/
  skim-logo.png            # PROVIDED — SKIM wordmark (nav + loader)
  images/sets/...          # set photos (WebP/AVIF), owner drops these in
  bear.svg                 # bear-with-milk mascot for the 3D hero (owner provides)
  signature.svg            # signature for the scroll reveal (owner provides)
```

---

## 6. Information architecture

**Top-left:** the **SKIM wordmark logo** (`skim-logo.png`, links to Home) + a **menu button** that opens an overlay menu with `.roll` links:
`Home · DJ Info · DJ Sets · Equipment Rentals · Booking`

**Top-right:** **"Get in contact"** → routes to Booking (Cal.com).

**Home (scroll narrative):**
1. **Loader** → the **SKIM wordmark logo** animates in on every page load, then clears.
2. **Hero** → 3D bear mascot, big display name, scroll-out reveal + **signature draw-in** (§7/§8).
3. **Bio / "get to know him"** → short story: DJ + producer; personal side (golf, music, health) — our "off-DJ" beat.
4. **Work toggle** (our equivalent of Lando's On-Track / Off-Track) — three tabs:
   - **DJ Sets** → YouTube set embeds + filterable photo gallery from sets.
   - **Producing** → Spotify + YouTube production credits.
   - **Collaborations** → sets/skits he produced for.
5. **Contact** → Cal.com + form.
6. **Footer** → IG, TikTok, YouTube, SoundCloud, Spotify, Linktree.

---

## 7. The 3D hero (signature element)

**v1 (build now): 3D bear mascot.**
- skim has no 3D model yet, so build the hero as the **bear logo on a plane inside a 3D scene** with: subtle depth/parallax that tracks the mouse, a gentle idle float/rotation, soft lighting, and the ambient particle/shader background behind it.
- On scroll, **GSAP ScrollTrigger dollies the camera out** to reveal a hero composition, and the **signature draws in** (SVG `stroke-dashoffset` animation) — mirroring Lando's zoom-out-to-photo + signature moment.
- Architect `HeroBear.tsx` so the centerpiece is a **swappable layer** (mascot now, photo later — see v2). Don't hardcode "bear" assumptions into the scroll/camera logic.

**v2 (roadmap — leave hooks, don't build yet): "many identities" photo filter.**
- skim has the same portrait shot with **different sunglasses**. The planned effect: rapidly **cycle swappable sunglasses layers** over his aligned portrait (he flickers through identities), then **ease to a final pair** and settle on the real photo.
- Implementation note for later: a stack of transparent PNG overlays (or a shader sampling an array of textures) aligned to the face, cycled on a timeline that decelerates to a chosen frame. Because the hero centerpiece is already a swappable layer, this drops in without reworking the scene.

---

## 8. Animation spec (heavy focus — this is the point of the site)

- **Smooth scroll:** wrap the app in Lenis; feed Lenis's scroll to GSAP ScrollTrigger (`lenis.on('scroll', ScrollTrigger.update)`).
- **Loader:** GSAP timeline — the **SKIM wordmark logo** (`skim-logo.png`) scales/fades in with a soft glow on the halo, holds ~600ms, wipes up to reveal the hero. Only on first load per session.
- **Hero:** idle float on the mascot; mouse parallax on the background and mascot; on scroll, camera dolly-out + signature `stroke-dashoffset` draw.
- **Section reveals:** elements rise + fade in on enter (GSAP from `y:24, opacity:0`), staggered. Use one shared `Reveal` component.
- **Nav + headings:** the `.roll` per-letter effect (§3) on hover.
- **Cards (videos/gear):** subtle 3D tilt toward the cursor on hover (rotateX/rotateY with perspective), spring back on leave.
- **Restraint:** one signature 3D moment (the hero) + ambient background. Don't animate everything — over-animation reads cheap and tanks performance.
- **Reduced motion:** if `prefers-reduced-motion: reduce`, disable Lenis, freeze the 3D to a static frame (or swap a static hero image), and replace reveals with instant opacity. The site must be fully usable and calm in this mode.

---

## 9. Integrations (all free, no backend)

- **YouTube** → `lite-youtube-embed`. Never mount more than one real iframe at a time on load. Thumbnails first, player on click.
- **Spotify** → official iframe embed, lazy (only when scrolled near).
- **SoundCloud** → official iframe embed, lazy.
- **Booking → Cal.com** (free): unlimited event types on the free plan, embeds like Calendly. Use the `@calcom/embed-react` widget. Owner will create the event types (DJ set / meeting / equipment) and put the username in `site.config.ts`.
- **Contact form → Web3Forms** (free, no backend): a plain form that POSTs to `https://api.web3forms.com/submit` with the owner's access key (stored in `site.config.ts` / an env var). It just emails skim. (Formspree is an equivalent fallback.)
- Do **not** build any server, API route, or DB for any of the above.

---

## 10. Performance budget

- Initial JS (gzipped) target: **keep it lean**; code-split routes and **lazy-mount the R3F canvas** after the loader / when in view.
- Compress all imagery to **WebP/AVIF**, responsive sizes, `loading="lazy"`. Set explicit width/height to avoid layout shift.
- Any future `.glb` models: **Draco/meshopt** compressed, **KTX2** textures.
- Defer all video/audio embeds (lite-youtube + intersection-observer mounting).
- Cap device pixel ratio for the canvas at ~2; pause the render loop when the canvas is offscreen.
- Lighthouse goal: green performance on mobile. Ship a lighter/static hero on low-end mobile if needed.

---

## 11. Accessibility

- All interactive elements keyboard-reachable with visible focus styles.
- Respect `prefers-reduced-motion` everywhere (§8).
- Real alt text on images; captions/titles on embeds.
- Color contrast: body text on `--ink` must pass AA (the `--milk` text does; check any accent-on-dark labels).
- The menu overlay traps focus while open and closes on Esc.

---

## 12. Skills to use

- **frontend-design skill** — invoke it on every design/visual pass: palette discipline, type scale, layout, and the "one signature element, everything else quiet" principle. Follow our tokens (§3) as the brief.
- Use your standard front-end engineering judgment for R3F/GSAP/Lenis structure and performance.

---

## 13. Content manifest — create as `src/data/site.config.ts`

> **All links skim provided are already filled in below** (Linktree, Instagram, TikTok, SoundCloud, the 4 YouTube sets, the Spotify track, and the YouTube production track), plus the provided `skim-logo.png`. Owner only needs to: fill the `TODO` titles (or let Claude Code pull them from the pages), add set photos under `public/images/sets/` and list them in `gallery`, add the bear/signature art, and paste the Cal.com username + Web3Forms key.

```ts
export const site = {
  name: "skim",
  handle: "mynameizskim",
  tagline: "prod. skim | dj skim",
  blurb: "DJ and producer. Bear holding skim milk, because — skim.",

  // Brand assets
  assets: {
    logo:      "/skim-logo.png",  // PROVIDED — SKIM wordmark (nav + loader)
    mascot:    "/bear.svg",       // bear-with-milk — 3D hero (owner provides)
    signature: "/signature.svg",  // signature for scroll reveal (owner provides)
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
```

---

## 14. Build phases (do these in order; commit after each)

**Phase 1 — Scaffold.** Vite + React + TS. Add Tailwind, GSAP, Lenis, R3F, drei, react-router, lite-youtube-embed, Cal.com embed. Wire `tokens.css` + fonts. Create `site.config.ts` from §13. App shell + routes that render placeholders. Verify dev server + a production `build` succeed.

**Phase 2 — Shell & motion base.** Nav (top-left menu overlay + top-right "Get in contact"), footer with socials, Lenis smooth scroll hooked to ScrollTrigger, the `RollText` component, the `Reveal` component, and `prefers-reduced-motion` plumbing.

**Phase 3 — Loader.** SKIM wordmark logo (`skim-logo.png`) intro animation on first load.

**Phase 4 — 3D hero (v1 bear).** `Background.tsx` (ambient mouse-reactive WebGL) + `HeroBear.tsx` (bear-on-plane, parallax, idle float) + scroll-driven camera dolly-out + signature draw-in. Centerpiece must be a swappable layer (§7). Lazy-mount the canvas.

**Phase 5 — Content sections.** Bio; Work toggle (DJ Sets / Producing / Collaborations) using `VideoCard` (lite-youtube), Spotify/SoundCloud embeds; all pulled from `site.config.ts`.

**Phase 6 — Gallery.** Filterable set-photo gallery + lightbox, filtered by `set`.

**Phase 7 — Equipment + Booking + Contact.** Equipment list with "request" → contact; `BookingEmbed` (Cal.com); `ContactForm` (Web3Forms).

**Phase 8 — Performance + a11y pass.** Hit §10 and §11. Lighthouse on mobile. Lazy/compress everything. Reduced-motion review.

**Phase 9 — Deploy.** Cloudflare Pages (§15).

> Roadmap (not now): v2 "many identities" sunglasses photo-filter hero (§7), once skim provides the aligned portrait + sunglasses PNGs.

---

## 15. Deployment — Cloudflare Pages (free, unlimited bandwidth)

Vite outputs static files to `dist/`. Two ways:

**Git (recommended):**
1. Push the repo to GitHub.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick the repo.
3. Framework preset: **Vite**. Build command: `npm run build`. Output dir: `dist`.
4. Deploy. Every push auto-deploys; PRs get preview URLs.
5. Add the custom domain in the Pages project settings (free SSL).

**CLI (alt):** `npm i -D wrangler` then `npm run build && npx wrangler pages deploy dist`.

Set the Web3Forms key and Cal.com username via env vars / `site.config.ts`. No other infra.

---

## 16. Definition of done

- Loads fast on mobile (green Lighthouse perf), no layout shift.
- 3D bear hero is mouse-reactive; scroll dollies out and draws the signature.
- Smooth scroll, per-letter roll on nav, section reveals — all disabled cleanly under reduced-motion.
- All sets/producing/socials render from `site.config.ts`; gallery filters by set.
- Cal.com booking + Web3Forms contact both work with zero backend.
- Rebranding = edit `tokens.css` (+ `--font-display`) only. Content = edit `site.config.ts` only.
- Deployed to Cloudflare Pages on a custom domain.
