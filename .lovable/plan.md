## Mock Test "AI Magic" SEO Refinement

Adds the same AI SEO-refinement capability that Jobs/Scholarships have (the `enhance-content` edge function) to the Mock Test admin section, reusing the existing Gemini → Lovable Gateway fallback infrastructure. No new AI function is created.

### Confirmed field mapping (your answers)

For each mock test, AI Magic generates & stores: **SEO title**, **Meta description** (150–160 chars), **Keywords** (5–8), and a **refined display description**.

- Trigger for NEW tests: **Both** (auto on create + manual re-run button)
- Retroactive: **Both** (per-row button + bulk "Run on All")

### Good news from investigation

- User-facing mock tests live in the `job_tests` table (powers `/mock-tests` and `MockTestDetail`).
- That table **already has** the columns `seo_title`, `meta_description`, `keywords[]`, `seo_enhanced_at` — **no DB migration needed**.

### Changes

**1.** `supabase/functions/enhance-content/index.ts`

- Add a `mock_test` category to `categoryPrompts` instructing the model to return `seo_title` (<60 chars), `meta_description` (150–160 chars), `keywords[]`, and a markdown `description` built from the test's title, organization, syllabus subjects/topics, question count, and duration. Strictly fact-based (no invention).

**2.** `src/services/jobTestService.ts`

- Extend the `JobTest` interface with optional `seo_title`, `meta_description`, `keywords`, `seo_enhanced_at`.
- Update `getJobTests`/`addJobTest`/`updateJobTest` mappings to carry these fields.
- Add `enhanceJobTestSEO(test)`: builds a `rawText` summary from the test data, calls `supabase.functions.invoke("enhance-content", { rawText, category: "mock_test", organization })`, then updates the `job_tests` row with the returned `seo_title`, `meta_description`, `keywords`, `description`, and `seo_enhanced_at = now()`.

**3.** `src/hooks/useJobTestManagement.tsx`

- Add `enhancingId` state, `handleEnhanceJobTest(test)` (per-row, with toast + query invalidation), and `handleEnhanceAll()` (sequential loop over all tests with progress toast, respecting rate limits).
- In `handleAddJobTest`, fire `enhanceJobTestSEO` after a successful insert (auto-on-create, non-blocking) so new tests get SEO treatment by default.

**4.** `src/components/admin/job-test/JobTestTable.tsx`

- Add an "✨ AI Magic" button per row (brand styling, `Sparkles` icon, spinner while running) and a small "SEO ✓"/"Needs SEO" badge based on `seo_enhanced_at`. New props: `onEnhance`, `enhancingId`.

**5.** `src/components/admin/JobTestManager.tsx`

- In the "Legacy Job Tests" header, add a **"Run AI Magic on All"** button wired to `handleEnhanceAll`, and pass `onEnhance`/`enhancingId` down to `JobTestTable`.

**6.** `src/pages/MockTestDetail.tsx`

- Prefer stored `test.seo_title` / `test.meta_description` for `<SEOHead>` and schema when present; fall back to the current dynamic strings otherwise. (Keeps unique meta descriptions either way.)

### Notes

- All styling uses existing brand tokens/button variants (Sparkles icon, gradient/primary) for consistency with the Jobs/Scholarships flow.
- The retroactive bulk run is sequential to avoid 429 rate-limit bursts.
- The existing **Sample Paper / Doc→MCQ** feature is unrelated to this and is left untouched (explained separately).
  &nbsp;

Add reusable AI Magic SEO refinement (title, meta description, keywords, description) to Mock Test admin with per-row + bulk + auto-on-create, reusing the enhance-content edge function. No DB migration needed.

# **Approved — this plan looks correct and** complete, matches all my 

answers. Please proceed with implementation.

&nbsp;

After implementing, please also answer my earlier separate question 

about the EXISTING Sample Paper → AI question generation feature 

(how it currently works, what format it accepts, and whether 

existing mock tests without a sample paper can have one added 

retroactively) — you mentioned that's unrelated and explained 

separately, so please cover that next.