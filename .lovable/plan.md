# Competitive Exam Practice — SEO Pages + Per-Test Syllabus

## Audit Summary (read-only findings)

**Data:** 17 mock tests in `job_tests` (DB) + 5 hardcoded fallbacks. 2 isolated `job_test_definitions`.

| Requirement | Current state |
|---|---|
| 1. SEO URL + detail page per test | ❌ None. Only `/mock-tests` list + 6 `/exams/:slug` category pages. No per-test route/component/slug. |
| 2. Sitemap coverage of detail pages | ❌ Only `/mock-tests` + 6 exam slugs in `exams.xml`. Zero individual tests. |
| 3. Internal linking between related tests | ❌ None. |
| 4. Official vs Custom syllabus | ⚠️ Official syllabus stored per test. `user_custom_syllabus` exists but is topic-based for the Builder, not per-test/weightage. No guest temp, save/edit/delete, or restore. |
| AI generation | ✅ Already simple Pakistani English, syllabus-locked, no drift, weightage via Largest Remainder. Always uses official syllabus — no custom branch. |

No new exams will be created; we only add pages/structure around the existing 17.

---

## What we will build

### A. Slug system (clean URLs, UUID internal)
- New `src/lib/jobTestSlug.ts`: `toJobTestSlug(test)` builds a clean slug from the title (reuse `toSlug`). On collision within the loaded list, append a meaningful suffix derived from organization (e.g. `-fia`, `-sindh-high-court`), never a UUID.
- `resolveJobTestBySlug(slug, tests)` maps a slug back to the DB row (exact slug match, then org-suffix match). UUID stays internal only.
- Cards and list link to `/mock-tests/<slug>`; the test session still uses internal UUIDs.

### B. Detail page (full SEO landing) — `/mock-tests/:slug`
New route in `App.tsx` and `src/pages/MockTestDetail.tsx` (wrapped in `<Header>`), containing:
- `<SEOHead>` title/description/canonical (`https://mcqsai.com/mock-tests/<slug>`).
- H1 = official job title; intro paragraph (organization + exam purpose, simple Pakistani English).
- "Official Syllabus" badge + table (subjects, weightage %, computed question distribution) from the test's official syllabus.
- Test pattern block (duration, total questions). Eligibility only when present (no invented data).
- "Last Updated" from the row's `updated_at`.
- **Custom Syllabus editor** (section C).
- Start Mock Test CTA → reuses existing `handleStartJobTest` flow.
- Related Mock Tests (section D).
- FAQ section (generated from the test's own syllabus/org — factual, no invented claims).
- JSON-LD: `WebPage` + `BreadcrumbList` + `FAQPage` via the existing structured-data pattern.

### C. Per-test Custom Syllabus
New table `job_test_custom_syllabus` (independent from `user_custom_syllabus`):
- Columns: `user_id`, `job_test_id` (uuid, references the `job_tests` row internally), `sections` jsonb (`[{subject, percentage, enabled}]`), `notes` text, `created_at`, `updated_at`. Unique on `(user_id, job_test_id)`.
- RLS: each user manages only their own rows; service_role full access. No anon access.

Editor behavior (`src/components/mock-tests/CustomSyllabusEditor.tsx`):
- Default = official syllabus (read-only badge "Official").
- Edit subject weightage, toggle sections on/off, optional notes. Adding subjects outside the official list requires explicit enable.
- **Guest:** can interact, but Save triggers the existing login/guest-choice flow; nothing persists.
- **Logged-in:** Save / Edit / Delete their per-test custom syllabus.
- **Reset to Official Syllabus:** deletes the custom row, restoring the official syllabus. Official is never mutated for anyone.
- "Official syllabus changed" notice: when the test's `updated_at` is newer than the saved custom row, show a banner offering "Keep mine" or "Update from latest official".

### D. Internal linking
- Detail page "Related Mock Tests" = up to 6 other tests, prioritizing same organization, then others — each linking to its `/mock-tests/<slug>` page.
- List page (`JobTestCard`) title/CTA links to the detail page.

### E. Sitemap coverage
- `scripts/generate-sitemaps.mjs`: fetch all `job_tests` rows, emit one `/mock-tests/<slug>` URL per test into `exams.xml` (or a new `mock-tests.xml` added to the index). Keep existing entries.
- Regenerate `public/sitemaps/*` and `sitemap.xml` index.

### F. AI generation honors custom syllabus
- In `JobTestsTab.handleStartJobTest` (and detail-page start): before computing per-subject quotas, look up the logged-in user's `job_test_custom_syllabus` for that test. If a saved custom syllabus exists, use its enabled sections + weightage for the Largest Remainder quotas; otherwise use the official syllabus.
- Pass the effective subject list to the existing generator. No prompt changes needed — it already enforces simple Pakistani English, syllabus-only scope, and no unrelated subjects. Disabled/extra-subject rules are enforced by the section list we pass.

---

## Technical notes
- SPA + react-router: detail route is client-rendered; SEO relies on `<SEOHead>` (Helmet) + sitemap inclusion, consistent with existing `/exams/:slug` and opportunity pages.
- Slugs are derived deterministically from title; UUID never appears in public URLs (per your spec).
- One migration (new table + GRANTs + RLS). All other work is frontend + the sitemap script.

## Out of scope
- No new exams/tests. No change to official syllabus data. No backend prompt rewrite (already compliant).

## Files
- New: `src/pages/MockTestDetail.tsx`, `src/lib/jobTestSlug.ts`, `src/components/mock-tests/CustomSyllabusEditor.tsx`, `src/components/mock-tests/RelatedMockTests.tsx`
- Edit: `src/App.tsx`, `src/components/mock-tests/JobTestCard.tsx`, `src/components/mock-tests/JobTestsTab.tsx`, `src/services/jobTestService.ts`, `scripts/generate-sitemaps.mjs`, `public/sitemaps/*`
- DB: migration for `job_test_custom_syllabus`
