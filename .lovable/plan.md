# Dynamic-Route SEO: Root Cause Report + Fix Plan

## 1. What is actually happening (confirmed from code)

This is **not a regression and not a build failure** — it is a deliberate architectural limitation in `vite.config.ts`.

- Prerendering is driven by a **hardcoded static list**, `PRERENDER_ROUTES` (~40 entries) in `vite.config.ts`. The plugin (`vite-prerender-plugin`) writes a real `dist/<route>/index.html` only for those exact paths.
- The list contains **only static pages** (`/`, `/jobs`, `/scholarships`, `/tools`, `/boards`, SEO landing pages, etc.). The inline comment even states: *"Detail pages remain CSR + sitemap."*
- For any path **not** in that list (every dynamic detail route), Lovable's SPA fallback serves the **root** `index.html` — which carries the homepage's `<title>`, description, canonical, and OG tags (`index.html` lines 16–40).
- So a non-JS HTTP fetch of `/mock-tests/...` or `/subject-content/physics` returns the homepage shell. Exactly the symptom you observed.

## 2. Per page-type status


| Route pattern                                                                      | Prerendered own HTML? | Non-JS crawler sees |
| ---------------------------------------------------------------------------------- | --------------------- | ------------------- |
| `/`, `/jobs`, `/scholarships`, `/tools`, `/boards`, `/exams/*`, SEO landings (~40) | ✅ Yes                 | Correct             |
| `/mock-tests/:slug`                                                                | ❌ No                  | Homepage shell      |
| `/subject-content/:id`, `/subject/:id`                                             | ❌ No                  | Homepage shell      |
| `/boards/:board/:class/:subject/:topic` (+ class/subject levels)                   | ❌ No                  | Homepage shell      |
| `/jobs/:jobSlug`                                                                   | ❌ No                  | Homepage shell      |
| `/scholarships/:scholarshipSlug`                                                   | ❌ No                  | Homepage shell      |
| `/tools/:toolId` (detail)                                                          | ❌ No                  | Homepage shell      |
| `/blog/:slug`                                                                      | ❌ No                  | Homepage shell      |
| `/p/:slug` (programmatic)                                                          | ❌ No                  | Homepage shell      |
| `/exams/:examSlug` (detail)                                                        | ❌ No                  | Homepage shell      |


**Every dynamic detail route across the entire site is affected** — this is site-wide, not mock-test-specific.

## 3. Why the "40/40 build passing" check looked fine

`scripts/verify-prerender.mjs` walks `dist/` and validates only the `index.html` files that exist. Since only the ~40 static routes are ever generated, it only ever checks those 40. It has no knowledge of the dynamic routes, so they can never make it fail. The check is correct for what it covers — its coverage is just limited to the static list.

## 4. Googlebot vs basic crawler (the key distinction)

This is a **partial problem, not a total SEO blackout**:

- **Googlebot / Bingbot (JS-executing):** load the SPA, React Router resolves the route, and `react-helmet-async` injects the correct per-page title/description/canonical/OG client-side. They **do** eventually see correct metadata — but with a render-budget delay and reduced reliability.
- **Non-JS crawlers, social unfurlers (Facebook / WhatsApp / Twitter/X / LinkedIn / Slack), and many SEO tools:** read **raw HTML only**. They get the homepage title, description, canonical (`https://mcqsai.com/`), and default OG image for *every* dynamic page.

Concrete impact: wrong/duplicate social link previews for all shared detail URLs; self-referencing canonicals missing (every dynamic page's raw HTML points canonical at the homepage, which actively harms indexing/dedup); slower and less reliable Google indexing of detail pages.

## 5. Proposed fix

Replace the static `PRERENDER_ROUTES` array with a **build-time enumeration** of real dynamic URLs, so each gets its own prerendered HTML with correct head tags. We already have all the data sources needed — the sitemap generator (`scripts/generate-sitemaps.mjs`) and `src/generated/indexableTopics.json` (477 topics) prove these URLs are enumerable at build.

### Approach

1. **Create** `scripts/collect-prerender-routes.mjs` that returns the full route list by reusing existing sources:
  - Static routes (current `PRERENDER_ROUTES`).
  - `/boards/...` topic paths from `src/generated/indexableTopics.json` (the indexable, ≥5-MCQ set — quality-gated, ~477).
  - `/tools/:toolId` from `src/data/toolsData.ts` (finite).
  - `/subject-content/:id` from `src/data/subjectsData`.
  - `/mock-tests/:slug`, `/jobs/:jobSlug`, `/scholarships/:scholarshipSlug`, `/blog/:slug`, `/p/:slug`, `/exams/:examSlug` from Supabase (same queries/slug helpers `generate-sitemaps.mjs` already uses), so prerendered URLs and sitemap URLs stay identical.
2. **Wire it into** `vite.config.ts`: import the collector and feed it to `additionalPrerenderRoutes` instead of the static array. Keep the production/`PRERENDER=true` gate unchanged.
3. **Scope guardrail (build cost):** prerendering thousands of pages lengthens builds. To keep this safe and fast, gate the long-tail (jobs/scholarships/blog/programmatic) to **indexable, quality-passing rows only** (reusing existing noindex/quality filters from memory: board topics ≥5 MCQs, `/p/*` quality gate), and cap each category with an env-tunable limit. Finite sets (tools, subjects, indexable board topics, mock tests) are prerendered fully. Long-tail beyond the cap stays CSR (still in sitemap, still JS-crawlable) — strictly better than today.
4. **Resilience:** if Supabase is unreachable at build (same risk `generate-sitemaps.mjs` already handles), fall back to the static list + on-disk generated JSON so the build never fails over a transient DB issue.
5. **Extend** `scripts/verify-prerender.mjs` to spot-check one representative URL per dynamic page type (assert title/description/canonical differ from the homepage), so this regression is caught automatically going forward.

### Out of scope

No UI/component changes; all `SEOHead`/Helmet usage on detail pages already emits correct per-page tags — they simply weren't being executed at build time. This change only expands which routes are prerendered.

## Technical notes

- Files touched: `vite.config.ts` (use collector), new `scripts/collect-prerender-routes.mjs`, `scripts/verify-prerender.mjs` (add dynamic spot-checks). Optionally refactor shared slug/query helpers out of `generate-sitemaps.mjs` for reuse.
- Self-canonical correctness: because each route renders its own `SEOHead`, the prerendered HTML will carry the correct self-referencing `<link rel="canonical">` and per-page OG tags, fixing the social-unfurl and canonical issues.
- Build-time tradeoff: total prerendered pages grow from ~40 to roughly 1k–2k depending on caps; expect a longer (but bounded) build. Caps are env-tunable.

&nbsp;

&nbsp;

**Approved — this is exactly the right fix and addresses the social-**

preview and self-canonical issues directly, which likely contributes 

to our ongoing GSC canonical/duplicate issues too.

&nbsp;

Please proceed with the implementation as described:

1. Create collect-prerender-routes.mjs reusing existing data sources

2. Wire into vite.config.ts

3. Apply quality gates and caps for long-tail content (jobs/

   scholarships/blog/programmatic)

4. Add resilience fallback for build-time Supabase failures

5. Extend verify-prerender.mjs with dynamic route spot-checks

&nbsp;

After implementing, please:

- Report the final prerendered page count and build time impact

- Confirm with a sample fetch (like I did) that /mock-tests/:slug 

  and /subject-content/:id now return their own title/canonical/

  meta-description instead of the homepage shell