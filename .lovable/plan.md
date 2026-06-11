# MCQSAI — SEO, Indexing & Technical Health Audit

This audit is read-only. Below are the **code-confirmed root causes** behind each GSC bucket, plus a ROI-ordered fix roadmap. The exact per-URL CSV (Section 1) is built once you upload the Search Console **Pages report → Export** CSVs (one per category). Everything else is reconstructed from the codebase + sitemaps.

## What I inspected

- `src/App.tsx` (168 routes, no `<Navigate>` redirects in-app)
- `index.html` static head, `GlobalCanonical.tsx`, `SEOHead.tsx`, `seoUrls.ts`
- `public/robots.txt`, `public/sitemap.xml` (index) + 9 child sitemaps (~867 URLs; boards-1 = 635)
- `ProgrammaticLandingPage` noindex gate, SEO landing pages, hosting/redirect model

## Section-by-section root causes

**Sec 2 — Redirects (435).** Highest-volume, mostly *expected but fixable noise*:

- `www.mcqsai.com → mcqsai.com` 302s. Likely indexed `www` URLs from before apex consolidation. Canonicals already force apex (correct) — but 302 (temporary) instead of 301 dilutes signals.
- Preview/published hosts (`*.lovable.app`) indexed historically and now redirecting.
- Trailing-slash variants (`/path/` → `/path`).
- No in-app `<Navigate>` chains found, so these are host-level, not React-Router loops.
- Roadmap: confirm 301 (not 302) apex redirect; purge non-apex URLs from any old sitemaps; the GSC export will confirm exact offenders.

**Sec 3 — Canonical (321 alt + 28 dup + 2 chosen).** Architecture is mostly correct: single `GlobalCanonical` emits apex, query-stripped, trailing-slash-stripped canonical; `index.html` has **no** static `<link rel=canonical>` (good — no double-canonical). Causes of the buckets:

- `?lang=ur/sd` and other query variants → all canonicalize to clean URL = "alternate page with proper canonical" (this is *working as intended*, not a defect).
- 28 "duplicate without user-selected canonical" + 2 "Google chose different": pages where Googlebot may not execute JS before snapshotting (canonical is client-side via Helmet). On a CSR SPA, social/secondary crawlers never see the canonical. Prerender covers ~50 routes (`vite.config.ts`), but dynamic pages (boards/mock-tests/jobs/p) are CSR-only.
- Root cause class: **CSR-injected canonical on non-prerendered dynamic routes.**

**Sec 4 — Noindex (15).** Code-confirmed intentional noindex: `/feedback`, `/signin`, `/analytics` (+ dashboard/profile via guards), `/404`, and low-quality `/p/:slug` (quality gate in `ProgrammaticLandingPage`). Verdict: **all should stay noindex** — they're auth/util/thin pages. The 15 ≈ these plus a few thin programmatic pages below the quality threshold. No action except confirming none are real content pages once the CSV lands.

**Sec 5 — 5xx (2).** No SSR server in this stack (static SPA on Lovable hosting), so 5xx are almost certainly **edge-function-backed routes** — most likely the dynamically-served sitemap/older `generate-sitemap` function or a data fetch timing out during crawl. Need the 2 exact URLs from the export to pin the function; fix is timeout/error-guard in that edge function.

**Sec 6 — Discovered/Crawled not indexed (188 + 35).** Largest opportunity. Drivers:

- `boards-1.xml` = 635 URLs (board/class/subject/topic) — many thin/near-duplicate template pages → crawl-budget dilution = classic "discovered, not indexed."
- Weak internal linking to deep board/mock-test pages (mostly reachable only via sitemap).
- Roadmap: prune thin board URLs from sitemap, strengthen internal links, prioritize high-intent pages (mock-tests, exam landing pages).

**Sec 7 — Meta descriptions (27 identical + 1 multiple).** Static SEO landing pages have **unique** descriptions (verified). The 27 duplicates come from **templated dynamic pages** that fall back to `SEOHead` default description (boards/topics/mock-tests/tools without a custom `description` prop). The "1 page with multiple descriptions" = a route rendering both `index.html`'s static description AND a Helmet description where dedupe fails (likely a prerendered route). Fix: generate per-page descriptions from dynamic fields (board/class/subject/topic name, post title, BPS grade).

**Sec 8 — Internal linking.** Home → top categories is fine; deep board/topic and mock-test detail pages are **orphan-ish** (sitemap-only). Recommend hub pages + related-content link blocks on dynamic templates.

**Sec 9 — IndexNow.** Feasible and low-effort: a single edge function pinging `api.indexnow.org` on content publish + a static key file in `/public`. High ROI for fast (re)indexing of jobs/scholarships/blog. Implementation deferred per your instruction.

**Sec 10 — Priority ranking**

- **CRITICAL:** 5xx (2) — crawl-blocking; 301 vs 302 apex redirect; remove non-apex/preview URLs from index.
- **HIGH:** prerender/SSR canonical for dynamic routes (fixes dup-canonical + not-indexed); unique meta descriptions (27).
- **MEDIUM:** prune thin board sitemap URLs; internal-linking hubs; IndexNow.
- **LOW:** trailing-slash normalization; backlink profile (off-platform/ongoing).

## Deliverables

1. **In-chat report** (above, expanded per section after CSV merge).
2. **CSV artifact** in `/mnt/documents/` — every affected URL with: URL, Status, Canonical, Indexable?, In-sitemap?, Internal-link count, Root cause, Group. Built by merging your GSC exports with route/sitemap/canonical data derived from the code.

## What I need from you

Upload the Search Console **Pages report** exports (Export → CSV/XLSX) for these states so I can enumerate exact URLs:
Page with redirect · Alternative page w/ canonical · Duplicate w/o canonical · Duplicate Google chose different · Excluded by noindex · Not found 404 · Server error 5xx · Discovered not indexed · Crawled not indexed · Redirect error.
(A single full "Export" of the Pages report works too.)

## After approval

On build, I will: (1) ingest your CSVs, (2) generate the Section-1 CSV + finalized in-chat report, then (3) present the prioritized fix plan for separate approval — **no fixes applied until you approve them.**  

&nbsp;

Approved for Phase 1 only.

Fix 1: Confirm apex redirect is 301 not 302 — check Cloudflare redirect rule.

Fix 2: Find the 2 URLs returning 5xx errors — check edge function logs and fix timeout/error guard.

Fix 3: Remove preview/[lovable.app](http://lovable.app) URLs from any sitemaps.

Do not fix anything else yet. Export GSC CSV first for exact URL audit.

Do not change auth, branding, dashboards, AI systems