# Performance Optimization & Brand-Matched Top Progress Loader

## Findings from current code

- **Routes are already lazy** in `src/App.tsx` — good. But every route uses the heavy `BrandingLoader` (full-screen, framer-motion, gradient bar, multiple animated layers) as the Suspense fallback, which itself adds main-thread work on every navigation.
- **`SplashScreen.tsx`** holds the app for a hardcoded **2200ms** before mounting `App` (in `src/main.tsx`). This is the biggest single cause of slow FCP/LCP on mobile.
- **`index.html`** loads Google Fonts as a **render-blocking stylesheet** with three families (Inter, Orbitron, Noto Nastaliq Urdu) including 9+ weights. GA4 is loaded eagerly in `<head>`.
- **`vite.config.ts`** has no `manualChunks` — everything (React, framer-motion, recharts, radix, lucide, pdf-lib, jspdf, html2canvas, exceljs) ships in one or two big chunks.
- Brand loading gradient consistently used across the app: **`from-violet-500 via-cyan-500 to-violet-500`** (see `BrandingLoader.tsx`, `SplashScreen.tsx`). The new top progress bar will reuse this exact gradient.
- `lucide-react` is already imported per-icon (tree-shakable) — no change needed there.

---

## Changes

### 1. New `TopProgressBar` Suspense fallback (brand-matched)

Create `src/components/TopProgressBar.tsx`:
- Centered MCQSAI logo + wordmark on `bg-background` (reuses Brain icon, Orbitron, the violet→cyan gradient).
- **No** circular spinner.
- Top bar: `fixed top-0 left-0 w-full h-[3px] z-[9999] overflow-hidden bg-gray-100 dark:bg-gray-800`.
- Inner bar uses **`bg-gradient-to-r from-violet-500 via-cyan-500 to-violet-500`** with an indeterminate CSS keyframe animation (slides + scales infinitely). Pure CSS — no framer-motion — so the fallback itself is cheap.
- Add the `@keyframes indeterminate-progress` rule to `src/index.css` (or use a Tailwind arbitrary keyframe in the component) so the bar slides left→right continuously.

Replace **every** `<BrandingLoader fullScreen ... />` Suspense fallback in `src/App.tsx` with `<TopProgressBar />`. `BrandingLoader` itself stays for the full-screen `PageLoader` overlay.

### 2. Remove the 2.2s splash delay

Edit `src/main.tsx`:
- Remove the `SplashScreen` gate entirely. Render `<App />` immediately.
- Keep `SplashScreen.tsx` file in place (unused) so other refs don't break — or delete if no other importer (will verify and delete if safe).

This alone should reclaim ~2 seconds of FCP/LCP on mobile.

### 3. Vite manual vendor chunking

Update `vite.config.ts` `build.rollupOptions.output.manualChunks`:
- `react-vendor`: `react`, `react-dom`, `react-router-dom`
- `framer`: `framer-motion`
- `charts`: `recharts`
- `radix`: any `@radix-ui/*`
- `pdf`: `pdf-lib`, `jspdf`, `html2canvas`, `exceljs`
- `supabase`: `@supabase/supabase-js`, `@tanstack/react-query`
- `icons`: `lucide-react`

This lets browsers cache big libs separately and parallelizes parsing.

### 4. `index.html` render-blocking fixes

- Keep `preconnect` to fonts.googleapis.com / fonts.gstatic.com (already present).
- Make the Google Fonts stylesheet **non-blocking** using the standard pattern:
  ```html
  <link rel="preload" as="style" href="...fonts..." onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="...fonts..."></noscript>
  ```
- Trim font weights to what's actually used (Inter 400/500/600/700, Orbitron 600/700, Noto Nastaliq Urdu 400/600) — saves ~60% of font payload.
- Move the GA4 `<script>` block to just before `</body>` and keep `async`. Defer the inline `gtag('config', ...)` so it runs after load.
- Add `rel="preconnect"` for `https://www.googletagmanager.com` and `https://pzhvipkcssxrsxxljbbz.supabase.co`.

### 5. Lucide icons

Spot-check the heaviest pages (`Index.tsx`, `Tools.tsx`, `Analytics.tsx`) for any `import * as Icons from 'lucide-react'` usage. Current usage looks per-icon, so no changes expected unless a barrel import is found during implementation.

---

## Expected impact

- FCP/LCP: −2s (splash removal) + −300–800ms (non-blocking fonts) + faster parse from chunk parallelism.
- Suspense navigations feel instant (top bar appears immediately, no full-screen takeover).
- Repeat visits cache vendor chunks separately → much better Speed Index.

## Files touched

- `src/main.tsx` (remove SplashScreen gate)
- `src/App.tsx` (swap fallbacks)
- `src/components/TopProgressBar.tsx` (new)
- `src/index.css` (add keyframe)
- `vite.config.ts` (manualChunks)
- `index.html` (non-blocking fonts, GA4 placement, preconnects)
- `src/components/SplashScreen.tsx` (delete if unreferenced)
