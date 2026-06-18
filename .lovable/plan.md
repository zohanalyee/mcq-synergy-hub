# SEO Indexing Audit — Root Causes & Fix Plan

## What I checked

- GSC connection (both `sc-domain:mcqsai.com` and `https://mcqsai.com/` properties verified).
- Live redirect behavior, `public/robots.txt`, sitemap files, canonical/noindex code, board routing, and the database (topic ↔ approved-MCQ counts).

> Note on method: GSC's per-category URL lists ("Page with redirect", etc.) are **not** exposed by any GSC API — only the UI export provides them, and the URL Inspection API is not routable through our connector gateway. So I root-caused each category from the code + DB + live HTTP behavior, which lines up cleanly with your screenshots. Please export the 4 CSVs from GSC if you want me to confirm exact URL samples per bucket.

## Database reality (the thin-content core)

Of **1,847** board topics:

- **1,321 have 0 approved MCQs**
- **13 have 1–4**
- only **513 have ≥5** (genuinely indexable)

So ~72% of topic pages are empty shells. The sitemap is already correct — it emits only **456** board URLs (topics with ≥5 approved MCQs). The empty ones are NOT in the sitemap but ARE reachable via internal links and old crawls.

## Root cause per GSC category

**1. Duplicate without user-selected canonical (114)** — Two URL formats render the same page:

- Internal links emit numeric class: `/boards/<board>/9/<subject>/<topic>` (Boards.tsx, BoardLandingPage.tsx, BoardSubjectPage.tsx, BoardClassPage.tsx, RelatedTopics.tsx all use numeric `classNum`).
- The sitemap emits slug class: `/boards/<board>/class-9/<subject>/<topic>`.
- `GlobalCanonical` builds the canonical from the **raw pathname**, so each variant self-canonicalizes. Google sees two identical pages, neither defers → "duplicate without canonical." This is the single biggest fixable bug.

**2. Page with redirect (486)** — Host/variant URLs Google still has indexed that now redirect to apex: `www.mcqsai.com` (302→apex) and the old `mcq-synergy-hub.lovable.app` (confirmed live `302 → https://mcqsai.com/`). Consolidates once canonicals are consistent and Google re-crawls.

**3. Alternative page with proper canonical tag (350)** — Largely **expected/healthy**: query-param permutations (`?topic=`, `?count=`, `?difficulty=`) and the class-variant pages whose canonical Google *did* fold. robots.txt already disallows these param patterns and canonicals point to the clean URL. Mostly "validate & wait," shrinks further after fix #1.

**4. Excluded by noindex tag (19)** — `BoardTopicPage` sets `noindex={!isLoading && isThin}`, but **prerender is synchronous and never resolves react-query data** (`prerender.tsx` does one `renderToString` with no data await). At SSR `isLoading` is always true, so the static HTML Google fetches contains **no noindex and no MCQ content**. Pages flip to noindex only after client hydration → Google reports "excluded by noindex" on re-crawl. The noindex is firing on the wrong (sometimes right) pages non-deterministically.

**5. Not found 404 (8)** — Small; almost certainly deleted/renamed topics or stale slugs. Needs the CSV to list exact URLs.

**6. Access forbidden 403 (325)** — Ignored per your instruction (Cloudflare, already fixed).

## Proposed fix

### Fix A — Standardize the board class segment on `class-N` (fixes #1, helps #2/#3)

- Update all internal links to emit `class-${classNum}` instead of numeric: `Boards.tsx`, `BoardLandingPage.tsx`, `BoardSubjectPage.tsx`, `BoardClassPage.tsx`, `RelatedTopics.tsx`.
- Normalize the canonical in `GlobalCanonical.tsx`: for `/boards/:board/:class/...` paths, rewrite a bare-numeric class segment to `class-N` so **both** variants emit the identical `class-N` canonical. (Keeps sitemap, canonical, and internal links on one format.)
- Add a client redirect (React Router `<Navigate replace>`) from numeric `/<n>/` board paths to the `class-N` form so previously-indexed numeric URLs consolidate instead of 200-ing as duplicates.

### Fix B — Make thin/empty noindex deterministic in static HTML (fixes #4 + thin content/AdSense)

- Extend the existing sitemap generator (which already computes `approvedByTopic`) to also write a build-time manifest `public/indexable-topics.json` (or `src/generated/…`) containing the set of topic paths with ≥5 approved MCQs.
- In `BoardTopicPage`, derive `noindex` from membership in that manifest (synchronous, available at SSR) instead of from async `isLoading`/`isThin`. Result: empty/thin pages ship `<meta name="robots" content="noindex">` in the prerendered HTML; only ≥5-MCQ pages are indexable — and this exactly matches what's in the sitemap.
- Apply the same manifest-based noindex to `BoardSubjectPage`/`BoardClassPage` if they can render with zero downstream content.

### Fix C — Host consolidation (fixes #2)

- Canonicals are already apex-only. After A/B ship, resubmit the sitemap and use GSC "Validate fix." Recommend (platform/Cloudflare side, outside the repo) switching `www` and `lovable.app` redirects from **302 → 301** so Google transfers signals faster. I'll flag this; it can't be changed from app code.

### Fix D — 404s (#5)

- After you export the GSC 404 CSV, I'll either restore/redirect the 8 paths or confirm they're correctly gone.

### Optional enhancement (larger, separate)

- Make `prerender.tsx` await react-query data (prefetch + dehydrate) so static HTML contains real MCQ content and accurate schema for every indexable page — strengthens content depth beyond just fixing noindex. Proposed as a follow-up, not part of this pass.

## Out of scope / no change needed

- robots.txt param blocking and apex canonical strategy are already correct.
- The 350 "alternative page with proper canonical" bucket is mostly healthy crawler behavior and should shrink on its own after Fix A.

## Validation after implementing

- Re-run the sitemap generator; confirm manifest count ≈ 513 and sitemap ≈ unchanged.
- Spot-check built HTML for a numeric vs `class-N` URL (same canonical) and for a 0-MCQ topic (noindex present in static HTML).
- Resubmit sitemap + click "Validate fix" on each category in GSC.

I want your sign-off on **Fix A's canonical format (`class-N`)** and **Fix B's build-time manifest approach** before I implement. If you'd rather standardize on the numeric `/9/` format instead, say so and I'll flip the direction.

&nbsp;

&nbsp;

# **Approved — proceed with both fixes:**

Fix A: Standardize on "class-N" format (text-based, matching the 

sitemap) across all internal links. Update GlobalCanonical to 

normalize numeric variants to class-N. Add redirect from old 

numeric URLs to class-N URLs.

Fix B: Implement the build-time indexable-topics manifest 

(≥5 approved MCQs) and use it for deterministic noindex in 

BoardTopicPage (and BoardSubjectPage/BoardClassPage if applicable). 

Replace the async isLoading-based noindex logic.

After implementing both, run your validation checklist (manifest 

count check, spot-check static HTML for both a numeric→class-N 

redirect and a 0-MCQ noindex page). Report back with confirmation 

before I resubmit the sitemap in GSC.

Hold off on Fix C (Cloudflare 301 redirect) and Fix D (404s) — 

I'll handle those separately.