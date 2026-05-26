# Phase 2F — Core Web Vitals + SEO Growth

Scope-locked: no changes to auth, Supabase, RLS, dashboards, AI systems, branding, routing, or EEAT schema architecture. UI/UX visually identical.

---

## A. Core Web Vitals (priority 1)

**Audit targets:** `/`, `/mdcat-syllabus`, `/p/mdcat-karachi`, `/jobs`

1. **LCP image optimization**
  - Identify hero/LCP image on each target page (likely `src/pages/Index.tsx` hero, programmatic page hero, jobs banner).
  - Convert hero JPG/PNG sources to AVIF + WebP via `vite-imagetools` (add plugin to `vite.config.ts`).
  - Add explicit `width`/`height`, `fetchpriority="high"`, `decoding="async"` on hero `<img>`.
  - Add `<link rel="preload" as="image">` for the single sitewide hero in `index.html` (only if same hero across landing).
2. **Below-fold lazy loading**
  - Sweep `src/pages/Index.tsx`, `Quizzes.tsx`, `Jobs.tsx`, `Scholarships.tsx`, `seo/*`, `programmatic/ProgrammaticLandingPage.tsx`, `MDCATSyllabus.tsx` for `<img>` without `loading` attribute → add `loading="lazy" decoding="async"`.
  - Wrap heavy below-fold sections (testimonials, FAQ accordions, RelatedContent, large grids) in `React.lazy` + `Suspense` with a fixed-height skeleton placeholder (prevents CLS).
3. **Defer framer-motion until visible**
  - Create `src/components/perf/LazyMotion.tsx` wrapper: uses `IntersectionObserver` to mount motion components only when within viewport. Apply to hero/below-fold animated blocks on the 4 audit pages.
  - For sitewide motion, switch to framer-motion's `LazyMotion` + `domAnimation` features bundle (smaller runtime).
4. **CLS fixes (mobile)**
  - Reserve space on hero image containers (`aspect-ratio` class).
  - Reserve min-height on dynamically loaded card grids (Jobs, Scholarships, Blog lists).
  - Audit topbars/banners for layout shift on hydration.
5. **Font display**
  - Verify Poppins/Orbitron `@font-face` in `index.css` includes `font-display: swap`. Patch if missing.
6. **Hydration cost**
  - Audit `src/App.tsx` route tree — ensure all SEO/public route components are already `React.lazy`. Add `lazy()` for any eagerly-imported public route.

**Acceptance:** mobile LCP < 2.5s, CLS < 0.1, INP < 200ms via Lighthouse on the 4 pages.

---

## B. Internal linking expansion

Extend `src/data/semanticGraph.ts` only — no new components needed (RelatedContent already consumes it).

1. Add entries for: blog post hub, individual exam pages cross-referencing jobs/scholarships, `/p/*` programmatic hubs, quizzes.
2. Add new relation labels for blocks: **Related Exams**, **Popular in Pakistan**, **Continue Preparing**, **Related Opportunities** (use existing `reason` field; extend enum if needed).
3. Mount `RelatedContent` (with appropriate `entitySlug` + section title) on:
  - `src/pages/Jobs.tsx` (Related Exams + Continue Preparing)
  - `src/pages/Scholarships.tsx` (Related Opportunities)
  - `src/pages/Quizzes.tsx` (Popular in Pakistan)
  - `src/pages/Blog.tsx` (Continue Preparing)
  - `src/pages/exams/ExamLandingPage.tsx` (Related Opportunities — jobs/scholarships)
  - `src/pages/programmatic/ProgrammaticLandingPage.tsx` (Related Exams)
4. Hard cap: max 6 links per block (already enforced in `getRelated`); ensure no duplicate anchor text across blocks on same page.

---

## C. Programmatic SEO enhancement

1. Extend `src/data/programmaticSeo.ts` with the 10 requested slugs:
  - `mdcat-lahore`, `mdcat-punjab`, `nts-islamabad`, `ecat-lahore`, `css-karachi`, `ppsc-punjab`, `fpsc-karachi`, `chemistry-mcqs-class-12`, `physics-mcqs-class-12`, `biology-mcqs-class-11`.
2. Each entry must include: local universities, merit/cutoff info, test centres, domicile guidance, prep strategy, ≥5 FAQs, ≥4 internal links. Pages below quality threshold get `noindex` automatically.
3. Add a content-quality gate in `ProgrammaticLandingPage.tsx`: if word count < 600 OR FAQs < 3 → render `<meta name="robots" content="noindex">` via Helmet.
4. Add the new slugs to `vite.config.ts` `PRERENDER_ROUTES` and to the sitemap generator (`scripts/generate-sitemaps.mjs`).
5. Add semantic graph entries for each new slug.

---

## D. CTR optimization

Audit + rewrite titles & meta descriptions for Pakistan exam intent on:

- All `src/pages/seo/*.tsx`
- All `src/pages/exams/*` via `ExamLandingPage` data
- Programmatic pages
- `Jobs.tsx`, `Scholarships.tsx`, `Quizzes.tsx`

Rules:

- Title ≤ 60 chars, primary keyword first, year (2026) where relevant, "Pakistan" or city where relevant.
- Description ≤ 160 chars, includes intent + benefit + soft CTA ("Free", "AI-powered", "with past papers").
- Internal anchor text revisited in `semanticGraph.ts` — replace generic anchors ("Practice →") with specific intent ("MDCAT Biology MCQs 2026").
- FAQ snippets: ensure top FAQ on each SEO page is a high-volume question (verify against existing data — no new SEMrush calls needed unless ambiguous).

---

## E. Verification (no code changes)

1. `PRERENDER=true npx vite build`
2. `node scripts/verify-prerender.mjs` — expect 47 routes (37 existing + 10 new programmatic) all passing canonical, JSON-LD, h1, body, links.
3. `node scripts/verify-sitemap.mjs` — confirms new entries.
4. Browser Lighthouse mobile run on the 4 audit pages — capture LCP/CLS/INP.
5. Hydration mismatch check via dev console on each audit page.
6. Confirm no duplicate `FAQPage` schema regression.

---

## Technical Details

**New files:**

- `src/components/perf/LazyMotion.tsx` — IntersectionObserver-gated motion wrapper.
- `src/components/perf/LazyImage.tsx` (optional helper) — standard `<img>` with `loading="lazy" decoding="async"` defaults and explicit dims.

**Modified files (presentation only):**

- `vite.config.ts` (imagetools plugin, +10 prerender routes)
- `index.html` (preload hero, font-display verify)
- `src/index.css` (font-display: swap if missing)
- `src/data/semanticGraph.ts` (graph expansion)
- `src/data/programmaticSeo.ts` (10 new entries)
- `src/pages/programmatic/ProgrammaticLandingPage.tsx` (noindex gate, lazy sections)
- `src/pages/Index.tsx`, `Jobs.tsx`, `Scholarships.tsx`, `Quizzes.tsx`, `Blog.tsx`, `MDCATSyllabus.tsx`, `seo/*.tsx`, `exams/ExamLandingPage.tsx` (titles/desc, RelatedContent mounts, lazy below-fold, image attrs)
- `scripts/generate-sitemaps.mjs` (new slugs)

**Untouched:** AuthContext, services/*, Supabase migrations, edge functions, RLS, dashboard pages, AdminPanel, AI generation paths, routing structure.

---

## Out of scope

- New routes beyond the 10 programmatic slugs
- Schema architecture changes
- Refactoring auth/dashboard/AI/business logic
- Color/branding/typography redesign

&nbsp;

&nbsp;

Important constraint:

Do NOT redesign or visually alter the existing UI/UX, color palette, branding, typography style, spacing system, motion identity, gradients, shadows, or component aesthetics.

&nbsp;

Performance optimizations must preserve the current visual experience exactly as-is. Animations may be deferred/lazy-mounted for performance, but their visual behavior and styling must remain unchanged once triggered.

&nbsp;

No simplification/downgrade of premium visual feel.