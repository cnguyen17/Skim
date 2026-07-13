# Claude Code Prompt — SKIM Collaborations Timeline

Copy everything below the line into Claude Code from the root of the portfolio repo. Before running it, copy the `collaborations-timeline/` folder (this folder) into the repo root so Claude Code can find `events.json` and `assets/`.

---

## Prompt

I'm adding an event history timeline to my existing Collaborations section. This is a Vite + React 19 + TypeScript SPA with React Router, GSAP + ScrollTrigger, Lenis smooth scrolling, and Tailwind CSS v4 (design tokens live in `tokens.css`). Site content is centralized in `src/data/site.config.ts`. Deploys to Cloudflare Pages from `dist/`.

There is a folder at the repo root called `collaborations-timeline/` containing:

- `events.json` — 46 events for DJ SKIM, sorted oldest → newest, each with: `id`, `date` (ISO), optional `dateApprox`/`dateLabel`, `title`, `presenter`, `venue`, `address`, `city`, `billedAs` (he has performed as SKIM, DJ MIKS, and SKIM MIKS), `collaborators[]`, and `image` (filename inside `assets/`).
- `assets/` — one flyer image per event, named `YYYY-MM-DD_slug.ext`.

### What to build

**1. Data + assets integration**

- Move `collaborations-timeline/assets/` into the project's static assets (e.g. `src/assets/timeline/` or `public/timeline/` — follow whatever convention the repo already uses for images).
- Convert `events.json` into a typed module, e.g. `src/data/timeline.ts`, exporting `TimelineEvent[]` with a proper TypeScript interface. Keep `site.config.ts` as the single source of truth pattern — either import timeline data there or re-export it alongside it.
- The flyer images are heavy phone-resolution PNGs/JPGs. Add build-time optimization (e.g. `vite-imagetools` or a one-off script) to serve compressed WebP at sensible sizes, with lazy loading.

**2. Timeline preview INSIDE the existing Collaborations section (do not restructure or remove anything currently in that section)**

- Keep everything currently in the Collaborations section exactly as is. Append a new sub-block underneath it (same section, same background/tokens): a vertical event timeline preview.
- Style reference: DJ portfolio agenda lists (like djjoepverhaar.nl) — each row shows a large date block on the left (big day number, small month + year) and, right-aligned, the event title in bold with venue + city underneath in smaller text. Rows sit on a subtle translucent card over the section background. Use the existing design tokens/typography — do not introduce new colors or fonts.
- Scroll animation ("outside-in"): as the user scrolls through the section, rows animate in alternately from the left and right edges (odd rows slide/fade in from the left, even rows from the right), converging to center — use GSAP ScrollTrigger with `scrub` so it's tied to scroll position and plays nicely with Lenis. Respect `prefers-reduced-motion`: if set, skip the slide and just fade.
- Additionally, give the preview a slow auto-advance: when the section is in view and the user is NOT actively scrolling, gently auto-scroll/advance through the rows (a subtle ticker feel). Pause auto-advance on hover, on manual scroll, and entirely under `prefers-reduced-motion`. Any user scroll input immediately takes priority.
- The preview shows a curated subset — the 8–10 most recent events (dates only, no flyer images here) — so the section stays compact.
- At the bottom of the preview, add an "Explore More" button (match existing button styles).

**3. "Explore More" → full timeline route**

- Clicking "Explore More" navigates (React Router) to a new route, e.g. `/collaborations/timeline`, with a full-page timeline of ALL events, oldest at bottom or top — pick newest-first at top.
- Layout: alternating two-column rows (flyer image on one side, text on the other, sides alternating each row — like a classic zigzag timeline) with a thin center line/date spine on desktop, collapsing to a single column on mobile.
- Each entry shows: the flyer image (rounded, subtle shadow, lazy-loaded, click to open a lightbox/full view), the formatted date (use `dateLabel` when `dateApprox` is true, otherwise format the ISO date like "Oct 26, 2024"), event `title`, `presenter` if present, `venue` + `city`, `billedAs` when it differs from "SKIM" (he started as DJ MIKS — this is part of the story), and `collaborators` rendered as small pill/chip tags.
- Same outside-in scroll animation as the preview: image side slides in from its outer edge, text side from the opposite edge, scrubbed with ScrollTrigger + Lenis. Stagger children slightly. Reduced-motion fallback: fade only.
- Add year markers along the spine (2023, 2024, 2025, 2026) that pin briefly or highlight as you pass them, so the growth story reads clearly.
- Include a back link to the main page's Collaborations section (router navigation that scrolls back to the section anchor).

**4. Quality bar**

- TypeScript strict, no `any`.
- Kill/cleanup all ScrollTriggers on route unmount (SPA — avoid leaked triggers breaking Lenis).
- Test at 375px, 768px, 1440px widths. The date blocks and long venue addresses must not overflow on mobile.
- Run the existing build (`npm run build`) and fix any errors before finishing.

### Notes on the data

- Two entries have `dateApprox: true` (`dtla-day-party`, `think-less-live-more`) — display their `dateLabel` instead of an exact date.
- Events span Dec 2023 → Jul 2026, showing progression from DJ MIKS at SIP Little Tokyo to residencies (Elevate Lounge / No Requests, Heat Ultra Lounge, Exclusive Ktown) to headline billings — the timeline should make that arc visible via the year markers.
- Duplicate flyers were already removed; exactly one image per event.
