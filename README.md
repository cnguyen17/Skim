# skim — DJ / producer portfolio

A fast, 3D-animated, mouse-reactive portfolio for the DJ/producer **skim**.
Vite + React + TypeScript, no backend — everything is static or an external
embed. See [CLAUDE.md](./CLAUDE.md) for the full brief (source of truth).

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-checks (tsc -b) + production build → dist/
npm run preview  # serve the production build locally
```

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · GSAP + ScrollTrigger · Lenis
(smooth scroll) · React Three Fiber + drei (3D hero) · react-router-dom ·
lite-youtube-embed · Spotify iframe · Cal.com embed · Web3Forms.

## Where to edit

Two single sources of truth (never hardcode in components):

- **Content & links** → [`src/data/site.config.ts`](./src/data/site.config.ts)
- **Colors & fonts** → [`src/styles/tokens.css`](./src/styles/tokens.css)
  (rebrand = edit this file; swap the display face via `--font-display`)

### Owner TODOs (fill in `site.config.ts`)

- `booking.calcomUser` — your [Cal.com](https://cal.com) username (free).
  Until set, the booking page shows a setup notice instead of the embed.
- `booking.web3formsKey` — your [Web3Forms](https://web3forms.com) access key
  (free). Until set, the contact form shows a "not configured" notice.
- `sets[].title` / `producing[].title` — replace the `TODO` titles.
- `gallery` — add set photos to `public/images/sets/` (WebP/AVIF) and list
  them here; the gallery filters by the `set` field.
- Brand art: drop `public/bear.svg` (3D hero centerpiece — currently the
  wordmark stands in) and `public/signature.svg` (the scroll signature uses a
  placeholder vector until then). The hero centerpiece is a swappable layer, so
  these drop in without touching scene logic.

## Deploy — Cloudflare Pages (free)

**Git (recommended):** push to GitHub → Cloudflare dashboard → Workers & Pages →
Create → Pages → Connect to Git → pick the repo. Framework preset **Vite**,
build command `npm run build`, output dir `dist`. Every push auto-deploys; PRs
get preview URLs. `public/_redirects` provides the SPA fallback for client
routing. Add a custom domain in the project settings (free SSL).

**CLI (alt):** `npm i -D wrangler && npm run build && npx wrangler pages deploy dist`

## Accessibility & performance

Responsive to 360px, keyboard-focusable with visible focus, focus-trapped menu
and lightbox, real `prefers-reduced-motion` fallbacks (Lenis off, 3D frozen to a
static wordmark, reveals instant). three.js is code-split into a lazy, Home-only
chunk; route-level splitting; all video/audio/scheduler embeds load lazily.
# Skim
