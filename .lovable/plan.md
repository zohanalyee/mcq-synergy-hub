# Performance Audit — App Load Slowdown (Report Only)

Measured live in this session: Playwright timings on the local preview, Supabase `pg_stat_statements`, index inspection, network capture per page, and a static crawl of the eagerly loaded module graph.

## What the numbers show

Local preview (dev server, unbundled — absolute values inflated, relative order valid):

| Page | TTFB | DCL | FCP | LCP |
|---|---|---|---|---|
| `/` (home) | 14 ms | 3.48 s | 3.99 s | 6.74 s |
| `/ai-coach` | 15 ms | 2.41 s | 2.68 s | 3.98 s |
| `/announcements` | 11 ms | 2.22 s | 2.49 s | 3.75 s |

Production (earlier measurement, desktop, fast network): home FCP/LCP ~400 ms, `/ai-coach` 292 ms, `/announcements` 280 ms, 2 JS resources ~300 KB decoded, 6 KB images, no CSS blocking.

So the server and the HTML are not the problem. The homepage is consistently the slowest of the three, and it is the only one that is slow because of *work after HTML arrives* — a big single JS chunk plus a data waterfall. On a mid-range Pakistani mobile on 3G/4G, both of those multiply.

## Ranked causes (biggest first)

**1. The initial JS chunk keeps growing — 110 eagerly imported pages.**
`src/App.tsx` imports 110 page components eagerly (only 75 routes are `lazy()`). A static crawl of that eager graph finds **277 app modules / ~1.86 MB of source** pulled into one entry chunk that *every* visitor downloads, parses and executes before first paint — even a visitor who only wants one tool. Heaviest eager subgraphs: `MockTests` (227 KB incl. first-seen deps), `BoardTopicPage` (131 KB), `CustomSyllabus`/`Index`/`Subjects` (80 KB each), `AggregateCalculator` (68 KB).
This is the direct explanation for "slower since a recent update": every recent SEO batch added eager routes because prerendering needs synchronous render — the 15 tools converted to eager imports in the Semrush batch, `ExamsHub` + NUMS/IBA Sukkur/LAT, `Announcements` + `AnnouncementDetail` (~33 KB incl. deps), `AdmissionTestPage`. Each was individually small; cumulatively the entry chunk only ever grows.

**2. `get_platform_stats` on the homepage — mean 263 ms, max 2.68 s, 1,034 + 332 calls.**
Top bottleneck in `pg_stat_statements` (~358 s total DB time across both call shapes). It runs on homepage mount for the animated counters, so the homepage's most prominent above-the-fold numbers wait on the slowest query in the system. Occasional 2.7 s spikes match "sometimes it feels really slow".

**3. Five non-page queries fire on every single route.**
Captured on both `/` and `/announcements`: `global_appearance_settings`, `educational_systems` with `levels(count)`, two `content_items` count-head queries (new-jobs and new-scholarships header badges), `navigation_items`. Home additionally fires `get_platform_stats`, `get_review_stats`, `get_public_reviews`. These are header/footer chrome, they run before/alongside page content, and they are not cached across navigations beyond React Query's in-memory staleTime.

**4. Announcements is NOT a significant contributor.**
`get_announcement_feed` averages 12.2 ms (26 calls); the feed adds only 2 network calls; all six announcement tables have appropriate indexes; none appears in the slow-query list; the table currently holds 0 rows. One future risk only: the realtime channel invalidates the whole feed query on *any* reaction/comment change site-wide — fine now, chatty at scale.

**5. No new render-blocking assets.**
`index.html` is unchanged in the relevant window: AdSense is `async`, GA4 loads after the module script, fonts use `preload`+`onload` swap with a `noscript` fallback, images total 6 KB. Not a cause.

Also noted but *not* user-facing: `content_items` `ilike` scans (7,500+ calls, ~40 ms mean, ~306 s total) come from the content-generation pipeline, not page loads.

## Proposed fix order (nothing implemented yet)

**Phase 1 — Shrink the entry chunk (biggest win).** Keep eager imports only for routes that are genuinely prerendered and must render synchronously; move the rest to `lazy()`. Add a route-manifest check so a page listed in `PRERENDER_ROUTES` stays eager and anything else is lazy by default, so the chunk stops growing with every SEO batch. Verify with `verify-prerender.mjs` plus a static-parity build so no prerendered page regresses to a Suspense shell.

**Phase 2 — Take `get_platform_stats` off the critical path.** Inspect its plan, then either materialise/cache the counters (periodically refreshed snapshot row) or render the stats section with a skeleton that never blocks LCP. Target: no homepage query over ~50 ms.

**Phase 3 — Trim the per-route chrome queries.** Merge the two header count-head queries into one lightweight call (or a single cached snapshot), extend `staleTime` for `navigation_items` / `global_appearance_settings` / `educational_systems`, and persist them so route changes don't re-fetch.

**Phase 4 — Guard Announcements for scale.** Narrow the realtime invalidation to the visible announcement IDs instead of the whole feed.

**Phase 5 — Verify.** Re-measure home / `/ai-coach` / `/announcements` on a throttled mobile profile, record before/after FCP/LCP and entry-chunk size, and confirm no SEO/prerender regression.

## Technical notes

- Eager-graph measurement: crawl of `src/App.tsx` static imports (lazy lines excluded), transitively resolving `@/` and relative specifiers — 277 modules, ~1.86 MB source, node_modules excluded.
- `manualChunks` already splits `framer-motion`, `recharts`/`d3`, `pdf-lib`/`jspdf`/`html2canvas`, `exceljs`, markdown — but eager pages still pull those chunks into startup.
- Brand rules unchanged: this is a load-performance plan only; no visual, token, header/footer, or copy changes.
