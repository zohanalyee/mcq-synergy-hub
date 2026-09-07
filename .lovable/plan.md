# Phase 6 — Homepage Core Web Vitals (audit + proposed fix)

Field data (7 Sep 2026): mobile LCP 8.7s, INP 868ms, CLS 0.28; desktop LCP 7.3s, INP 870ms. Lab run on desktop still shows TBT 320ms, main-thread work 2.8s, unused JS ~907 KiB.

## 1. What is driving the unused JavaScript

The dominant cause is not the homepage's own code — it is the shared entry bundle every visitor downloads before the homepage can paint.

- `src/App.tsx` statically imports **64 page components** (lines 29–254: every prerendered SEO page, 14 calculator tools, all board/exam/programmatic landing pages, legal pages, `/p` hub…). All of them land in the single entry chunk that the homepage must download, parse and execute. `scripts/verify-eager-routes.mjs` currently permits this (budget 70) because those routes are prerendered — the guard was written for prerender correctness, not for client payload.
- Homepage-specific weight loaded before first paint but not needed for it:
  - `TestimonialsSection` (Supabase query + `date-fns` `formatDistanceToNow`) — below the fold.
  - `PlatformStatsSection` (Supabase query + skeletons) — below the fold.
  - `UserSatisfactionPopup` (framer-motion `AnimatePresence`, Supabase, sonner, react-query mutation) — only shows later, never at paint.
  - `AnimatedCounter` (`framer-motion` `useInView`) and `HeroStatsSection` — counters/stat logic.
  - `framer-motion` itself is imported by `Index.tsx`, `Header.tsx` and every homepage section, so the `framer` chunk is on the critical path even though the first paint only needs static markup.

## 2. The animated elements causing shift / non-composited work

Layout shift (CLS 0.28) is *insertion*, not the counters:

1. `UpcomingFreeBanner` renders `null` on the prerendered HTML and only appears after `useEffect` reads `localStorage` — it then pushes the whole hero down. Highest-value single CLS fix.
2. The page wrapper starts at `opacity-0` and flips to `animate-fade-in` after mount (`isLoaded` state), so the prerendered content is invisible until hydration — this also delays LCP.
3. Skeleton → content height mismatch in `HeroStatsSection`, `PlatformStatsSection` and `TestimonialsSection` (skeleton rows are not the same height as the loaded cards).

Non-composited animations flagged (3 elements) — all animate non-compositable properties:

1. `animate-shimmer` on the hero badge text — animates `background-position` (tailwind.config.ts `shimmer` keyframes).
2. `.btn-shine::after` — animates `left` (a layout property), `src/index.css`.
3. The two hero orbs: framer-motion `scale`/`opacity` on `blur-3xl` 48×48/40×40 elements — transform is composited but the large blur forces expensive repaints each frame.

## 3. Long main-thread tasks / TBT

- Parsing + executing the 64-page entry chunk is the single biggest task, before React even mounts.
- Provider stack in `App.tsx` (`Auth`, `UserRole`, `Learning`, `Appearance`, `DeviceCapability`, `Language`, `FloatingTools`, `Loading`) plus `hydrateQueryCache()` doing a synchronous `JSON.parse` of the persisted shell cache on mount.
- `prefetchTopRoutes()` firing during startup.
- The homepage renders ~25 `motion` wrappers (hero, 4 subject cards, 6 feature cards, section reveals) — each one adds hydration + animation-frame work on a mid-range Android.
- No heavy synchronous computation in `Index.tsx` itself (all arrays are literals); the cost is bundle execution and framer hydration.

## 4. Proposed Phase 6

### 6A — Homepage-only, zero risk to other routes (do first)
1. Lazy-load below-the-fold homepage sections with `lazy()` + `Suspense`, each wrapped in a fixed-height placeholder so nothing shifts: `PlatformStatsSection`, `TestimonialsSection`, the features grid, and the internal-links section. Skip lazy-loading during prerender (`__PRERENDER__`) so crawler HTML stays identical.
2. Lazy-load `UserSatisfactionPopup` and mount it only after idle (`requestIdleCallback`) — it never needs to exist at paint.
3. Reserve space for `UpcomingFreeBanner`: render the container with its final height from the first paint (or read `localStorage` synchronously in `useState` initialiser) so it can never push the hero down.
4. Drop the `opacity-0 → animate-fade-in` gate on the page wrapper so prerendered content is the LCP element immediately.
5. Fix the non-composited animations: replace `animate-shimmer` on the hero badge with a `transform: translateX` sweep, change `.btn-shine::after` from `left` to `transform`, and set static (non-animated) opacity on the two blurred orbs (or `will-change: transform` + smaller blur radius). No colour, gradient or spacing change — same visual result.
6. Give the stat skeletons the exact height of their loaded state.

### 6B — Entry-chunk split (the 840 KiB; touches `src/App.tsx` routing only, no page visuals)
Split the route table in two so prerender keeps its synchronous imports while browsers get chunks:
- `src/routes/eagerRoutes.tsx` — static imports, used **only** by `src/prerender.tsx` (separate rollup entry, never loaded by the browser).
- Client `App.tsx` uses `lazy()` + `Suspense` for those same pages.
- Update `scripts/verify-eager-routes.mjs` to enforce the new rule (eager imports allowed only in the prerender route module) and lower the budget.
- Verify with `scripts/verify-prerender.mjs` that every prerendered route still ships full HTML and identical head tags.

Expected: entry chunk shrinks by most of the ~840 KiB, cutting TBT/INP on mobile far more than any homepage-local change.

### 6C — Verification
Re-run Lighthouse on `/` (mobile) before/after each sub-phase, confirm prerendered HTML for `/` and a sample of the 60+ prerendered routes is byte-comparable in head/body content, and confirm CLS ≈ 0 in the lab trace.

## Isolation
6A touches only homepage components and three animation definitions. 6B touches routing/build plumbing — no page markup, no design tokens, no brand change. If you want strict homepage-only for now, approve 6A alone; 6B is where the 840 KiB actually lives.
