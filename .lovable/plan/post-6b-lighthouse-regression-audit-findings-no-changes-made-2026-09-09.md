# Post-6B Lighthouse regression — audit findings (no changes made)

## 1. Desktop TBT 160ms → 670ms: not variance, and not "285 chunks"

The chunk *count* is not the cost — resolving 285 module records is microseconds. The cost is **when** page code is parsed and executed.

What changed:

- Before 6B, 64 pages (including `/subjects`, `/mock-tests`, `/tools`, `/leaderboard`, `/boards`, `/jobs`) were static imports inside the entry chunk. Their parse/compile happened **before First Contentful Paint**, so Lighthouse counted it in FCP/LCP, not in Total Blocking Time (TBT only counts long tasks after FCP).
- `src/App.tsx` (line 189) calls `prefetchTopRoutes()` on mount. `src/lib/prefetchRoutes.ts` warms 8 page chunks on `requestIdleCallback(..., {timeout: 4000})`: Subjects, MockTests, Tools, Profile, Analytics, Leaderboard, Boards, Jobs.
- After 6B those same 6 hub pages became lazy chunks, so their download + parse + execute now happens **after FCP, inside the Lighthouse trace window** — the identical work simply moved into the TBT measurement window.
- The PDF/chart unchain compounds this on desktop: `src/pages/Analytics.tsx` pulls `WeeklyTrendChart` → recharts + d3. Previously that chunk was preloaded off the Header chunk before FCP; now the idle prefetch of `/analytics` downloads and executes recharts/d3 after FCP. That is the single largest post-FCP script in the prefetch set.

Measured locally (mobile emulation, homepage): 15 long tasks, with 188ms + 250ms tasks landing at ~1.7s and ~1.9s — exactly the idle-prefetch window — plus three cross-origin long tasks from AdSense/GA at 2.5–3.1s.

So the split did not add work; it relocated pre-FCP work into TBT and added recharts to the post-FCP set. Field metrics (real INP/LCP for users) should still improve, because the entry chunk shrank from ~1MB to ~200KB, but the lab score drops because Lighthouse's TBT window now contains the prefetch.

Also relevant to the score drop: TBT is weighted 30% on desktop, and desktop Lighthouse runs unthrottled, so a single 250ms prefetch task moves the number a lot. Two runs of the same build can differ ±80ms, but a 510ms jump is structural, not variance.

## 2. Mobile "deprecated API" warning

Reproduced the homepage in Chrome with the DevTools issue reporter on. The only issues raised were:

- `CookieIssue` — third-party cookie deprecation, raised by the AdSense script (`pagead2.googlesyndication.com`, `index.html`) / GA4.
- `QuirksModeIssue` — raised inside a third-party ad frame, not our document (`index.html` has a correct `<!DOCTYPE html>`).

No deprecation issue originates from project code, and nothing in 6A/6B/the chart-unchain touches these. The Best Practices drop 92 → 81 is one Google-ad/analytics-driven audit flipping, most likely because an ad frame actually filled on that run and not on the earlier one (ad fill is non-deterministic between runs). Confirmation step: run Lighthouse twice with the AdSense tag blocked vs allowed and compare the Best Practices detail rows.

## 3. Remaining ~515–533 KiB unused JS on the homepage

The homepage's first-paint set no longer contains page code, PDF or chart libs. What remains, in rough order of unused bytes:

1. **The idle prefetch itself** — Lighthouse counts every script the page downloaded, including the 8 prefetched page chunks. Almost 100% of those bytes are "unused" on `/`. This alone plausibly accounts for the majority of the 515 KiB and is the same root cause as the TBT regression.
2. **Third-party** — AdSense (`adsbygoogle.js`) and GA4 (`gtag/js`) are ~150–200 KiB combined and largely unused at paint; Lighthouse always lists them and we cannot tree-shake them.
3. `**framer` chunk** — `Index.tsx`, `Header.tsx` and every homepage section import framer-motion; the homepage uses a small slice of it.
4. **Provider/vendor baseline** — react-core, react-router, react-query + persisted-cache hydration, Supabase client, sonner, the 8-provider stack in `App.tsx`. Needed, but a chunk of each is unused on the homepage.

## Candidate fixes (for a later phase, not part of this audit)

- Gate `prefetchTopRoutes()` so it does not run inside the measurement window: trigger after the LCP/`load` event plus a delay, or on first user interaction / nav hover only, and drop `/analytics` (the recharts page) from the idle list. Expected to recover most of the desktop TBT and most of the "unused JS" bytes without changing what users see.
- Switch prefetch from `import()` (download **and execute**) to `<link rel="prefetch">` (download only, zero main-thread cost) so repeat navigation stays fast while TBT stays clean.
- Optional: delay the AdSense tag until after LCP.

Say the word and I will write the fix phase as its own plan.

Please proceed with the fix as its own phase:

1. Gate prefetchTopRoutes() to run after LCP/load event plus a delay, instead of during idle right after mount

2. Drop /analytics (recharts page) from the idle-prefetch list — recharts is the biggest single unnecessary cost here

3. Switch prefetch from import() (download+execute) to <link rel="prefetch"> (download-only, zero main-thread cost) so repeat navigation stays fast without hurting TBT

4. Optional: delay the AdSense tag until after LCP, if that's a safe, isolated change

Verify: re-run Lighthouse (mobile + desktop) and confirm TBT drops back toward baseline, unused JS drops meaningfully, and repeat-navigation speed to Subjects/Mock Tests/Tools/etc. is not noticeably worse.