
# MCQSAI — Email-URL Fix, /p/* Indexability Fix, and SEMrush Audit

Three independent workstreams. Parts 1 & 2 are code fixes; Part 3 is a read-only data report.

---

## Part 1 — Email addresses generating broken internal URLs

### Root cause (confirmed)
`react-markdown` + `remark-gfm` renders content correctly for *bare* emails (`hr@psg.edu.pk` → `mailto:hr@psg.edu.pk`), **but** an explicit markdown link whose URL is an email **without a scheme** — e.g. `[hr@bbsutsd.edu.pk](hr@bbsutsd.edu.pk)` — is kept as a relative href `hr@bbsutsd.edu.pk`. The browser/Googlebot then resolves it against the current path, producing `/opportunity/hr@bbsutsd.edu.pk` and `/blog/hr@psg.edu.pk` → 404. AI-generated job/scholarship descriptions contain exactly this pattern.

### Fixes

**A. New shared sanitizer util** `src/lib/markdownSanitize.ts`
- `mailtoForEmailHref(href)`: if an href has no scheme and matches an email pattern (or is `mailto:`-less email), return `mailto:<email>`; otherwise return href unchanged.
- `sanitizeEmailLinks(markdown)`: rewrite `[text](email)` → `[text](mailto:email)` and any bare-email autolink edge cases, leaving real URLs untouched. Pure function, unit-testable.

**B. Custom `a` renderer for every `ReactMarkdown`** (`src/pages/OpportunityDetail.tsx`, `src/pages/BlogPost.tsx` — both renderers, `src/pages/AskDocument.tsx`):
- Add a `components.a` that runs href through `mailtoForEmailHref`, and for any remaining relative/unsafe href containing `@`, render as plain text or `mailto:`. External links get `rel="nofollow noopener noreferrer" target="_blank"`. This guarantees no email can ever become a site route even if DB content is dirty.

**C. Pre-render sanitization**: pass description/content through `sanitizeEmailLinks(...)` before handing to `ReactMarkdown` in the same files (BlogPost already runs `autoLinkMarkdown`; ensure `autoLinkMarkdown` never matches inside an email — add an email-skip guard in `src/lib/blogContentUtils.ts`).

**D. Edge-function hardening** (future AI/scraped content): add the same email-link normalization in the description/content builders of `supabase/functions/scrape-jobs`, `scrape-scholarships`, `scrape-hybrid`, and `generate-blog` so stored markdown already uses `mailto:`. (Shared TS helper duplicated into `_shared` for Deno.)

**E. Repair existing published content** (one-time): via a migration / data script, rewrite rows in `external_opportunities.description` and `blog_posts.content` that match `](email)` to `](mailto:email)`. Also null/clean any `external_opportunities.apply_url` that is a bare email → convert to `mailto:`. Read-audit first with `read_query`, then a guarded `UPDATE` migration.

---

## Part 2 — /p/* SEO landing pages "Excluded by noindex"

### Root cause (confirmed)
`ProgrammaticLandingPage` sets `noindex={!isProgEntryIndexable(entry)}`. `isProgEntryIndexable` → `passesQualityGate`, which requires **intro ≥ 60 words AND ≥ 3 FAQs**. The 8 reported slugs fail this gate, so SEOHead emits `noindex,nofollow`:

| slug | words | faqs | verdict |
|---|---|---|---|
| ppsc-punjab | 59 | 4 | fail (words) |
| nts-islamabad | 50 | 3 | fail (words) |
| nts-lahore | 53 | 2 | fail |
| nts-karachi | 46 | 2 | fail |
| physics-mcqs-class-12 | 59 | 4 | fail (words) |
| ecat-punjab | 54 | 2 | fail |
| mdcat-islamabad | 53 | 2 | fail |
| fpsc-karachi | 56 | 3 | fail (words) |

`/p` (bare) has **no route** → falls to `NotFound` (which is `noindex`).

### Fixes
- **Enrich the 8 thin entries** in `src/data/programmaticSeo.ts`: expand each `intro` past the word threshold and top up `faqs` to ≥ 4 with genuine, locally-relevant Q&A (test centres, merit, eligibility) — no fabricated stats; reuse the existing factual style. This makes them legitimately pass the quality gate (preferred over weakening the gate, keeps thin-content protection intact).
- **Add a `/p` hub route**: a `ProgrammaticIndex` page listing all indexable guides (internal-linking + indexable), registered in `src/App.tsx`. Removes the `/p` 404/noindex.
- **Sitemap + prerender**: include all indexable `/p/*` slugs in the programmatic sitemap generation (`scripts/generate-sitemaps.mjs` / `public/sitemaps/programmatic.xml`) and re-add the `/p` hub + the (now-passing) slugs to `PRERENDER_ROUTES` in `vite.config.ts` **only if** build time allows; otherwise rely on CSR + sitemap (Googlebot executes JS and will read `index,follow`). Given prior build-timeout history, default to **sitemap + CSR**, prerender just the `/p` hub.
- **Verification**: confirm rendered head emits `index,follow`, canonical, title, meta description, and OG tags for each fixed slug (via `verify-prerender.mjs` for prerendered ones; manual SEOHead check for CSR).

### Report produced
Component that applied noindex (`ProgrammaticLandingPage` via `passesQualityGate`), affected URLs (the 8 + `/p`), and the change (content enrichment to pass the gate + new hub route). No changes to jobs/scholarships/blogs/LMS/MCQs/routing/branding beyond the additive `/p` hub.

---

## Part 3 — SEMrush SEO & keyword intelligence audit (read-only deliverable)

Using the built-in SEMrush tools against `mcqsai.com` (database `us`, noting PK market where relevant), produce a structured report covering as much of the request as the connected plan's quota allows:

1. **Keyword audit** — `domain_analysis` + `top_pages`: ranking keywords with position, volume, KDI, traffic %, ranking URL, grouped into the requested clusters (Jobs, Scholarships, MDCAT, ECAT, NTS, FPSC, PPSC, CSS, Board exams, class-/subject-wise MCQs, calculators, guides).
2. **Competitor & gap analysis** — `competitive_analysis` + `compare_domains`: top competitors, shared keywords, competitor-only keywords, where they outrank us, quick-wins (positions 4–20).
3. **Content gap** — missing topic clusters, exam categories, city-based, scholarship, and university entry-test keywords (from gap data + keyword research on representative seeds).
4. **Technical SEO** — summarized from this codebase audit (indexability incl. the /p fix, canonicals via GlobalCanonical, noindex usage, sitemap coverage, structured data) rather than crawling.
5. **Traffic opportunity** — 30-day / 90-day / 6–12-month buckets tied to quick-win vs higher-KDI keywords.
6. **Authority & backlinks** — `backlink_analysis`: authority score, referring domains, backlink gaps vs competitors, educational link opportunities.
7. **Priority roadmap** — HIGH / MEDIUM / LOW ROI actions with estimated traffic impact.

Delivered as a written report with tables in chat (optionally exported to `/mnt/documents/mcqsai-seo-audit.md`). SEMrush is the data source and will be named as such; numbers presented as estimates. If quota is exhausted, that's surfaced and the report covers what was retrievable.

---

## Technical notes / constraints
- No redesign, no branding, auth, dashboard, routing changes beyond the additive `/p` hub.
- Email fix is defense-in-depth: render-layer guard + content sanitization + edge-function normalization + one-time DB repair.
- Build-time risk: keep `/p/*` on sitemap + CSR by default to avoid re-triggering the prior prerender timeout.
