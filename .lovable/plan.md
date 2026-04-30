## Goal

Make repeat page loads feel near-instant on slow networks, without breaking the Lovable preview environment.

## Important: why not a Service Worker / Vite PWA

You asked for `vite-plugin-pwa` with precaching + runtime caching. I strongly recommend **against** it for this project, and Lovable's own guidance explicitly warns against it:

- **Stale content in the editor**: Service workers cache the app shell and serve old builds inside the Lovable preview iframe. Code changes you make will appear not to take effect until users manually clear the SW.
- **Persistent cache pollution**: Once installed on a real visitor's browser, an SW survives long after the code that registered it is removed. Any bug in caching (e.g. caching an authenticated Supabase response and serving it to another user) is essentially permanent for that device.
- **Supabase auth + runtime caching is dangerous**: Caching Supabase REST responses risks serving one user's data to another (auth tokens are in headers, not URLs) and serving deleted/edited rows as "fresh".
- **iOS PWA quirks**: `start_url`, `scope`, `display` are pinned at install time and never update.
- **Your real problem isn't lack of an SW**: hashed `/assets/*` files are already cached for 1 year by `public/_headers`. Repeat visits should already reuse JS/CSS from the HTTP cache. The 2–3s "every page" delay is almost certainly **route-chunk fetching on first navigation**, not a missing SW.

## What I propose instead (same outcome, none of the risk)

### 1. Route prefetching on idle — fixes the "2–3 s every page" feeling

Right now every lazy route (`Subjects`, `MockTests`, `Profile`, etc.) downloads its chunk only when the user clicks the link. On slow 4G that's the 2–3 s delay you're seeing. Fix:

- Add a small `prefetchRoutes.ts` that, after `requestIdleCallback`, fires the same dynamic `import()` calls used in `App.tsx` for the most common next-pages (Dashboard/Subjects/MockTests/Profile/Tools/Analytics).
- Result: by the time the user taps a nav item, the chunk is already in the HTTP cache (which is itself already `max-age=31536000, immutable`). Navigation becomes instant on second visit and near-instant on first visit after a few seconds idle.
- Also add `<link rel="prefetch">` hints from `index.html` for the largest above-the-fold post-login chunks.

### 2. Hover/touchstart prefetch on nav links

Wrap the bottom-nav and header `<Link>` components so that `onMouseEnter` / `onTouchStart` triggers the dynamic `import()` for the destination route. Gives ~100-300 ms head-start on every tap with zero bandwidth waste (only fires on intent).

### 3. In-memory + sessionStorage cache for Supabase reads

Instead of an SW caching API responses (unsafe), extend React Query's existing config:

- Set `staleTime: 5 * 60 * 1000` and `gcTime: 30 * 60 * 1000` on read-heavy queries (subjects, topics, leaderboard, blog list, FAQ, social links).
- Add a tiny `sessionStorage` persister for **public, non-user-scoped** queries only (subjects list, tools list, blog index). On repeat visits within the session these render instantly with no network round-trip.
- Do NOT persist any query whose key includes `user.id` or auth state.

### 4. Image optimization (the part of your request that IS safe)

- Audit `public/` and `src/assets/` for PNG/JPG over ~50 KB. Convert to `.webp` with `cwebp -q 82` (lossy) for photos, `-lossless` for logos/diagrams.
- Replace references in components. Keep PNG fallback only where used in OG meta (`og-image.png`).
- Confirm `_headers` already covers them — add an explicit `*.webp`, `*.png`, `*.jpg`, `*.svg` rule with `max-age=31536000, immutable` for files under `/assets/*` (already covered by the wildcard, but I'll add an explicit image rule for files under `/` too).
- Add `loading="lazy"` and `decoding="async"` to all non-LCP `<img>` tags that don't have it.

### 5. Defer non-critical work on first paint

- Lazy-import `GA4PageTracker` and the analytics utility itself behind `requestIdleCallback`.
- Confirm `AppearanceContext`'s realtime channel is gated behind `idle` for logged-in only (already done — verified in current file).

### 6. Verify cache headers actually apply on Lovable hosting

- Inspect the `Cache-Control` response header on `/assets/*.js` in the network tab after the next deploy. If Lovable's CDN is overriding `_headers`, log it and document that the only further win is the prefetch strategy above.

## Files to add / edit

- `src/lib/prefetchRoutes.ts` — new; idle-prefetch top routes.
- `src/main.tsx` — call `prefetchRoutes()` after mount.
- `src/components/MobileBottomNav.tsx`, `src/components/Header.tsx` — add `onMouseEnter`/`onTouchStart` prefetch on each nav link.
- `src/App.tsx` — tune `QueryClient` defaults (`staleTime`, `gcTime`).
- `src/lib/queryPersister.ts` — new; sessionStorage persister for whitelisted public queries.
- `index.html` — add `<link rel="prefetch">` for 3-4 highest-value chunks; mark GA script `defer` if not already.
- `public/_headers` — explicit image cache rule.
- `public/*.png|jpg`, `src/assets/*.png|jpg` — converted to `.webp` + references updated.

## Out of scope (intentionally)

- `vite-plugin-pwa`, service workers, `manifest.webmanifest` with `display: standalone`. Skipping for the safety reasons above. If you still want full PWA after seeing the speed of the changes above, I'll add it as a separate, opt-in step with the iframe/preview guards Lovable requires — and you'll need to accept that updates may stick on installed devices.

## Expected outcome

- Repeat navigations: effectively 0 ms (chunk already in HTTP cache + React Query data hot in memory).
- First navigation after a few seconds idle: ~50-200 ms (chunk prefetched).
- Cold first visit: unchanged (already optimized in the previous performance pass).
- No risk of stale builds in the Lovable editor or on user devices.

If you want me to proceed exactly as scoped above, approve and I'll implement. If you still want a real Service Worker after this, say so explicitly and I'll add it with all the Lovable-required guards.

&nbsp;

I totally agree with your reasoning. Let's skip the Service Worker/PWA for now and proceed with this **'Safe Speed' Plan**.

Please implement:

1. **Route prefetching** on idle.
2. **Hover/Touch prefetch** on nav links.
3. **React Query & sessionStorage** caching for public data.
4. **Image conversion to .webp** and lazy loading.
5. **Fix the UI/Branding issues** we discussed earlier (Logo sync, Bottom Nav hide on /auth, Typewriter effect on descriptions only, and rounded-xl buttons).

Make it fast and professional!