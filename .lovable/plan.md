# Phase 1 SEO Audit — Findings & Proposed Fixes

## Audit findings (verified in code)

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | **Favicon lock** | ✅ Done | `index.html` references only `/favicon.png`, `/favicon-32x32.png`, `/favicon-16x16.png`, apple-touch + msapplication tile. Old `favicon.ico` deleted. **No service worker** registered anywhere (`rg serviceWorker` → 0 hits). **No `site.webmanifest`** exists → minor gap. |
| 2 | **Meta description cleanup** | ✅ Done | `index.html`, `Index.tsx`, `Quizzes.tsx`, `ExamLandingPage.tsx` all use the new 10,000+ string or dynamic templates. |
| 3 | **Dynamic exam meta descriptions** | ✅ Done | `ExamLandingPage.tsx` line 42 uses `${exam.name}` + `${exam.subjects?.slice(0,3)}`. |
| 4 | **Canonical URLs** | ✅ Done globally | `GlobalCanonical.tsx` mounted in `App.tsx` (line 236). Single source of truth — strips query, forces `https://www.mcqsai.com`, no trailing slash. `SEOHead.tsx` correctly does NOT emit a second canonical. |
| 5 | **Twitter cards** | ⚠️ Partial | `index.html` has `summary_large_image`, `@mcqsai`, image. `SEOHead.tsx` emits per-route `twitter:title/description/image/card`. ✅ Solid. **Gap:** static `twitter:image` in `index.html` is `https://www.mcqsai.com/og-image.png` — verify file exists in `public/`. |
| 6 | **OG image consistency** | ⚠️ Gap | All routes fall back to `https://www.mcqsai.com/og-image.png`. **`public/og-image.png` does NOT exist** in the repo (only `favicon.png`, `logo.png`, `placeholder.svg`). This means every social share currently 404s the preview image. |
| 7 | **Schema validation** | ⚠️ Need audit | JSON-LD emitted by 11 files (`StructuredData.tsx`, `ToolWrapper.tsx`, `FAQ.tsx`, `OpportunityDetail.tsx`, `JobDetailPage.tsx`, `ScholarshipDetailPage.tsx`, `ExamLandingPage.tsx`, `BoardTopicPage.tsx`, `About.tsx`, `Contact.tsx`, `ToolRouteSEO.tsx`). Not yet validated against schema.org. |
| 8 | **Title consistency** | ✅ Done | 5 page titles rewritten last cycle (Quizzes, BoardLandingPage, SubjectContent, JobDetailPage, ScholarshipDetailPage). `SEOHead` appends ` | MCQsAI` suffix consistently. |
| 9 | **Sitemap validation** | ✅ Mostly | `generate-sitemap` edge function emits index + 7 child sitemaps (static, tools, exams, jobs, scholarships, blog, boards-N). Static fallback in `public/sitemaps/`. **Gap:** new SEO pages (`MDCATSyllabus`, `MDCATPastPapers`, `SindhUniversitiesEntryTest`, `CSSMCQs`, `ECATPreparation`, `NUSTEntryTest`, `COMSATSEntryTest`, `PunjabUniversityEntryTest`, `PAFTest`, `PakArmyTest`, `ASFTest`, `ForcesJobsTests`, `BoardMCQs`, `NinthClassMCQs`, `PSTSSTTestPreparation`, `EngineeringUniversitiesEntryTest`, `FPSCPastPapers`, `PPSCPastPapers`) — none listed in `static.xml` or edge function. |
| 10 | **Cache cleanup** | ✅ N/A | No service worker exists → no SW cache to purge. Browser cache is governed by `public/_headers`. Asset versioning handled by Vite hashed bundles. Favicon files have no version hash → could be cached for ~24h on existing visitors but no action needed unless the user wants busted query strings. |

## Direct answers to your verification questions

1. **Canonical for all routes?** Yes — `GlobalCanonical` is route-level and runs on every path.
2. **Unique meta descriptions per page?** Most major pages: yes. SEO landing pages under `src/pages/seo/*` need a spot-check (likely have static strings).
3. **Twitter cards global?** Yes via `SEOHead` + `index.html` baseline.
4. **OG images consistent?** Tags are emitted, but the referenced **`/og-image.png` file is missing**.
5. **Old favicon cache?** No SW. Browser cache will expire naturally; no code-side residue.
6. **Which schemas validate?** Unverified — needs a Schema.org / Rich Results test pass (research task).
7. **Sitemap dynamic vs static?** Hybrid — edge function is dynamic; `public/sitemaps/*.xml` are pre-rendered fallbacks. New `/seo/*` routes missing from both.
8. **JS-only invisible pages?** All routes — confirmed prior turn. Pure CSR SPA. Mitigation requires prerendering or SSR (out of scope for Phase 1).

---

## Proposed Phase-1 fixes (low-risk, no behavior changes)

### A. Generate & commit `public/og-image.png` (1200×630)
Brand-aligned purple-pink gradient with brain logo + "MCQsAI — AI Exam Prep". Fixes silent OG breakage on every share.

### B. Add new `/seo/*` landing pages to sitemap
Append ~18 entries to `generateStaticSitemap()` in `supabase/functions/generate-sitemap/index.ts` AND to `public/sitemaps/static.xml` for fallback parity.

### C. Audit `src/pages/seo/*` for unique meta descriptions
Read each of the 18 files. Any with static or duplicate descriptions get rewritten using the same exam-specific template pattern used in `ExamLandingPage.tsx`.

### D. Add minimal `public/site.webmanifest`
Closes PWA/manifest gap so Chrome/Android use the locked brain icon for "Add to Home Screen". Reference `/favicon.png` at 192/512.

### E. Schema validation pass (research-only, no edits unless errors found)
Run the 11 JSON-LD emitters through `https://validator.schema.org` via a one-shot script (extract JSON blocks, validate). Report errors; fix only validated breakages.

### Not in scope (deferred)
- SSR / prerendering (Phase 2)
- Dynamic OG image generation per route (Phase 2)
- Service-worker cache busting (no SW exists)
- Asset versioning query strings on favicons (cosmetic)

---

## Execution order after approval

1. **B** — sitemap entries (edge function + static XML) — 2 file edits
2. **C** — `src/pages/seo/*` meta description audit + rewrites — up to 18 edits
3. **A** — generate `og-image.png` via imagegen — 1 asset
4. **D** — add `public/site.webmanifest` + link in `index.html` — 2 edits
5. **E** — schema validation script run, report only

No favicon files, no `GlobalCanonical`, no `SEOHead` changes.
