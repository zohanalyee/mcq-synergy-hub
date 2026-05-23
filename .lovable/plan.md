# Phase 2A — Crawlability / Prerender + Phase 2B — Semantic Internal Linking

Incremental, low-risk enhancement to the existing React + Vite + Supabase SPA. No architecture migration, no SSR, no routing rewrite.

---

## Phase 2A — Prerendering

### Strategy selection


| Option                      | Verdict                                                                                                                                                                                                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **react-snap**              | Rejected. Unmaintained (last release 2020), uses Puppeteer which inflates Lovable build time & memory, struggles with React 18 hydration warnings, no Vite-native integration.                                                                                                                        |
| **vite-prerender-plugin** ✅ | Selected. Vite-native, runs at build time, uses lightweight `puppeteer-core` only when needed (or `jsdom` fallback), zero runtime cost, integrates cleanly with our existing `vite build` and `prebuild` sitemap script. Outputs static HTML snapshots per route while keeping the SPA for hydration. |
| **Prerender.io**            | Kept as documented fallback only — requires external service + middleware at the hosting layer; not needed since Lovable serves static `index.html` per path once snapshots exist.                                                                                                                    |


### Routes to prerender (public, anonymous-safe)

- `/`
- `/quizzes`
- `/exams` and `/exams/:slug` (enumerated from `src/data/examData.ts`)
- `/seo/*` (all 18 files under `src/pages/seo/`)
- `/blog` (list only; individual posts deferred — DB-driven, will be added in Phase 2C)
- `/about`, `/contact`, `/faq`, `/reviews`, `/tools`
- `/boards` (board landing index only — deep `/boards/:board/:class/:subject/:topic` is too large to prerender; covered by sitemap + linking instead)

### Routes explicitly excluded

Dashboard, `/auth`, `/sign-in`, `/sign-up`, `/profile`, `/admin/*`, `/analytics`, `/notifications`, `/test-session`, `/quiz-player`, `/ask-document`, `/custom-*`, all individual job/scholarship detail pages (DB-driven, paginated through sitemap), all `/tools/:tool` interactive tools (CSR fine — already SEO'd via `ToolRouteSEO`).

### Implementation steps

1. **Add dev dependency:** `vite-prerender-plugin`.
2. **Configure** `vite.config.ts`**:** add the plugin with an explicit `routes` array (~30 entries) and `renderTarget: '#root'`. No changes to existing `manualChunks`, aliases, or build target.
3. **Hydration safety:**
  - Add an `isPrerender` boolean (set via `import.meta.env.SSR` or window flag) and short-circuit auth-dependent UI to a stable skeleton during prerender so React 18 `hydrateRoot` doesn't mismatch.
  - Wrap `AuthProvider` / `UserRoleContext` initial state so SSR returns logged-out defaults (matches `useAuthSafe` pattern already in memory).
  - Guard any `window`/`localStorage`/`navigator` access in eager-loaded components (Index, Header, GlobalCanonical) with `typeof window !== 'undefined'`.
  - Keep `react-helmet-async` — it already supports SSR output.
4. **CSS:** ensure no flash — add `<style>html{visibility:visible}</style>` is unnecessary because snapshot already contains rendered DOM; verify no `opacity:0` until JS runs.
5. **Build pipeline:** prerender runs after `vite build`; no change to `prebuild` sitemap generation. Output: `dist/<route>/index.html` per route.
6. **Verification script:** extend `scripts/verify-sitemap.mjs` (or add `scripts/verify-prerender.mjs`) to grep each generated HTML for `<title>`, `<meta name="description">`, an `<h1>`, and at least one internal `<a href="/">` link. Fails build on regression.

### Performance impact

- Bundle size: unchanged (snapshots are static HTML, not JS).
- Build time: +30–90s for ~30 routes (acceptable).
- Runtime: zero overhead; users still get the same SPA after hydration.

### Rollback

Remove the plugin block from `vite.config.ts` and `bun remove vite-prerender-plugin`. No code in `src/` becomes invalid (hydration guards are harmless under pure CSR).

---

## Phase 2B — Semantic Internal Linking Engine

### Architecture

Single source of truth: `src/data/semanticGraph.ts` — typed map of entity → related entities, hand-curated for educational intent. Example shape:

```ts
type EntityKind = 'exam' | 'subject' | 'tool' | 'scholarship-hub' | 'job-hub' | 'blog-topic' | 'seo-page';
type Relation = { kind: EntityKind; slug: string; label: string; reason: 'syllabus'|'prep-tool'|'related-exam'|'eligibility'|'next-step' };
export const semanticGraph: Record<string, Relation[]> = { 'mdcat': [...], 'fpsc': [...], ... };
```

This keeps relationships explicit, reviewable in PR, and free of runtime AI calls.

### Reusable components (new — under `src/components/seo/related/`)

1. `<RelatedExams entitySlug=... limit=4 />`
2. `<RelatedTools entitySlug=... />` (e.g., MDCAT → Aggregate Calculator, GPA Calculator)
3. `<RelatedScholarships entitySlug=... />`
4. `<RelatedUniversities entitySlug=... />` (links into existing `/seo/*` university pages)
5. `<RelatedBlogPosts topicSlug=... />` (uses `useBlogPosts`)
6. `<RelatedMCQTopics boardSlug=... subjectSlug=... />` (extends the existing `RelatedTopics.tsx` pattern already in `src/components/board-topic/`)

All components: server-renderable (no `useEffect`-only data), Tailwind-only (no new deps), mobile-first grid, semantic `<nav aria-label="Related ...">` wrapper, descriptive anchor text (no "click here").

### Pages enhanced (contextual linking insertion points)


| Page                                  | Components added                                                                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/exams/ExamLandingPage.tsx` | RelatedTools, RelatedScholarships, RelatedBlogPosts (replaces the current "Other Exams" sidebar with richer related grid below the fold) |
| `src/pages/seo/*` (18 pages)          | RelatedExams + RelatedTools block at end of each landing page                                                                            |
| `src/pages/ScholarshipDetailPage.tsx` | RelatedScholarships, RelatedExams (eligibility-linked)                                                                                   |
| `src/pages/JobDetailPage.tsx`         | Related job-prep tests (link to `/seo/forces-jobs-tests`, `/seo/pst-sst-test-preparation`, etc.)                                         |
| `src/pages/BlogPost.tsx`              | RelatedBlogPosts + RelatedTools (CTA loop)                                                                                               |
| `src/pages/BoardTopicPage.tsx`        | Already has RelatedTopics — augment with RelatedExams (matric/FSc → MDCAT/ECAT)                                                          |
| `src/pages/Index.tsx`                 | A "Popular exam hubs" semantic block above footer (links to top 6 `/exams/*` + `/seo/*` pages)                                           |


### Breadcrumbs

Extend the breadcrumb pattern already in `ExamLandingPage.tsx` and `BoardTopicPage.tsx` to `seo/*` pages and `ScholarshipDetailPage`. Emit `BreadcrumbList` JSON-LD via the existing schema helpers. Format:  
`Home → {Category} → {Entity}` — e.g. `Home → Medical Exams → MDCAT → Biology MCQs`.

### Crawl-depth fixes

- Add `<RelatedSEOPages />` block to footer (curated 8–12 high-value `/seo/*` links) so every page is ≤2 clicks from any landing page. Single block, not link spam.
- Wire `/seo/*` pages into the `Header` "Exams" mega-menu (existing nav component) so they aren't orphaned behind sitemap-only discovery.

### Engagement loops (examples implemented)

- MDCAT exam page → Biology MCQs → Aggregate Calculator → MDCAT Past Papers
- Scholarship detail → linked university page → admission/exam page → relevant prep tool
- Blog post → embedded related tool CTA → topic MCQ practice

### Safety constraints honored

- Max 6 related links per block, max 2 related blocks per page.
- Anchor text uses entity name, not exact-match keywords.
- No footer link farm — single curated section.
- No runtime auto-generation; all relationships are hand-authored in `semanticGraph.ts`.
- Components render `null` when no relations exist (no empty boxes).

### Deliverables produced after build

1. `src/data/semanticGraph.ts` — relationship map
2. 6 new components under `src/components/seo/related/`
3. ~25 page files touched to insert components (additive only)
4. Breadcrumb JSON-LD on `/seo/*` and scholarship pages
5. Footer + Header nav updates surfacing `/seo/*` hub pages

---

## Out of scope (deferred to later phases)

- SSR migration, Next.js, route rewrites
- Dynamic per-route OG image generation
- Programmatic SEO page generation (Phase 2C)
- AI-driven internal link suggestion (Phase 2C)
- Prerendering individual blog posts, job/scholarship details, deep board topic pages (covered via sitemap until DB-driven prerender pipeline is built)

## Execution order after approval

1. Install + configure `vite-prerender-plugin`, add hydration guards, add verification script, run build, inspect `view-source:` for 3 sample routes.
2. Create `semanticGraph.ts` + 6 related components.
3. Insert components into the 25 target pages in small batches; verify no layout regressions on mobile viewport (372×622 baseline).
4. Add breadcrumbs + footer SEO block + header mega-menu wiring.
5. Final build, re-run prerender + sitemap verify scripts.

## Rollback

- Phase 2A: remove plugin block, uninstall package.
- Phase 2B: components are purely additive — remove the JSX insertions; `semanticGraph.ts` can stay dormant.
- &nbsp;

Add these 3 improvements to the existing Phase 2A + 2B plan:

&nbsp;

**Suggestion 1 — Verification script expand:**

&nbsp;

In `scripts/verify-prerender.mjs`, add these additional checks for each prerendered HTML file:

```

✅ <link rel="canonical"> present

✅ <meta property="og:title"> present

✅ <meta property="og:description"> present

✅ JSON-LD schema present (application/ld+json)

```

&nbsp;

**Suggestion 2 — semanticGraph priority field:**

&nbsp;

In `src/data/semanticGraph.ts`, add optional priority field to Relation type:

```ts

type Relation = {

  kind: EntityKind;

  slug: string;

  label: string;

  reason: string;

  priority?: 'high' | 'medium' | 'low';

}

```

Mark existing relations with appropriate priority — high for direct prep tools, medium for related exams, low for distant relations.

&nbsp;

**Suggestion 3 — Footer SEO links limit:**

&nbsp;

In footer component, ensure Related SEO Pages block has maximum 8-10 links only. Remove any extras if present.

&nbsp;

Do not change favicon, logo, or any other files.

&nbsp;