# Mock Tests: System Integration + SEO Keywords

## Investigation findings (what's true today)

**Two tables, two roles:**

- `job_tests` (Legacy) — the ONLY source for the public `/mock-tests` list (`MockTests.tsx` → `getJobTests`) and the detail page (`MockTestDetail.tsx` → `resolveJobTestBySlug`). Holds title, organization, duration, questions, syllabus, plus SEO fields (`seo_title`, `meta_description`, `keywords`).
- `job_test_definitions` (Definitions) — richer admin authoring: per-subject syllabus sections, sample questions, difficulty distribution. Feeds `job_test_questions` (the AI-generated, admin-approved question pool).

**How they connect today:** only by **matching `title**`. When a user starts a test, `JobTestsTab.tsx` calls `findDefinitionByTitle(test.title)`; the questions preview (`getMockTestPreviewQuestions`) does the same. So a Definition's curated questions only reach the public flow if a `job_tests` row with the *same title* exists.

**Answers to your questions:**

1. Can Definitions become the single creation path while still appearing on `/mock-tests`? — Yes, but only if publishing a Definition also creates/updates a matching `job_tests` row. Today it does not.
2. Does a published Definition show on `/mock-tests`? — **No.** The public list reads `job_tests` exclusively. A Definition with no matching `job_tests` row is invisible to users.
3. "Junior Clerk (BPS-11)" in both lists — means there is already a `job_tests` row AND a `job_test_definitions` row sharing the same title; they're linked implicitly by title. No data loss, but the link is fragile (a title edit breaks it).

**SEO keywords status:** AI Magic *does* generate and store keywords in `job_tests.keywords` (`enhanceJobTestSEO`). BUT `MockTestDetail.tsx` (line 121) calls `<SEOHead title=... description=... />` **without** passing `keywords`, so every mock test page falls back to the generic site-wide keyword string. Jobs (`JobDetailPage.tsx:95`) and Scholarships (`OpportunityDetail.tsx:206`) *do* pass keywords. **So keywords are NOT currently in mock test page heads** — this needs a one-line wiring fix, plus the bulk AI run you asked for.

---

## Plan

### Part A — SEO keywords (low-risk, quick win)

1. In `MockTestDetail.tsx`, pass the test's keywords to `SEOHead`:
  - `keywords={test.keywords?.length ? test.keywords.join(', ') : undefined}` so each test emits its own `<meta name="keywords">` (falls back to the site default when not yet enhanced).
2. Add keywords to the crawler-facing prerender: in `scripts/inject-meta.mjs`, include `job_tests.keywords` in the `<meta name="keywords">` for each mock test HTML file so non-JS crawlers see them too.
3. Run "Run AI Magic on All" (the existing `handleEnhanceAll`) on Legacy tests still marked "Needs SEO" — this populates `keywords`/`seo_title`/`meta_description` for any unfinished rows. (I'll trigger it from the admin flow after the wiring lands; bulk run is already built.)

Result: every published mock test (Legacy and, after Part B, Definition-backed) ships unique AI-generated meta keywords in `<head>`, exactly like Jobs/Scholarships.

### Part B — One integrated workflow

Goal: admins use **one process** — author rich Definitions — and publishing makes them appear on `/mock-tests` automatically, while keeping the public read path (`job_tests`) unchanged for stability.

1. **Publish = sync to `job_tests`.** When a Definition's status becomes `published` (in `JobTestDefinitionEditor` / `upsertJobTestDefinition`), upsert a matching `job_tests` row:
  - Derive `title` (= `job_title`), `organization` (= `department`), `questions` (sum of section `question_count`), `duration` (sensible default or a new field), and `syllabus` (map sections → `{topic, percentage}`).
  - Store the Definition id on the `job_tests` row via a new `definition_id` column (a real FK link instead of fragile title-matching), so future title edits don't break the connection.
  - Archiving/unpublishing a Definition removes or hides its `job_tests` row.
2. **Make `definition_id` the primary join key.** Update `findDefinitionByTitle` usage to prefer `definition_id` when present, falling back to title for older rows.
3. **Unify the admin UI.** In `JobTestManager.tsx`, present a single "Mock Tests" list. The legacy "Add Job Test" form becomes a thin shortcut that creates a Definition (draft) instead of a bare `job_tests` row, so all new tests flow through the richer workflow. Existing Legacy-only tests remain editable and clearly labeled until migrated.
4. **Migrate "Junior Clerk (BPS-11)" and any other dual rows.** Backfill `job_tests.definition_id` by matching existing titles to Definitions (one-time data update via migration/insert tool), confirming exactly one Definition per public test. Report any titles that don't match for manual review.

### Technical notes

- New column: `job_tests.definition_id uuid references job_test_definitions(id)` (nullable; GRANTs unchanged). Schema change via migration tool.
- No change to the public read path shape — `/mock-tests` and the detail page still query `job_tests`, so SEO prerendering, sitemaps, and slugs are unaffected.
- AI Magic SEO continues to run against the `job_tests` row (it already persists there), so Definition-backed tests get keywords the same way Legacy ones do.

### Sequencing

- Part A first (independent, low-risk, gives immediate SEO benefit + bulk run).
- Part B second (schema + sync + migration), verified by confirming a freshly published Definition appears on `/mock-tests` and serves its curated questions.

I'll implement Part A immediately on approval, then Part B. Migration data changes ("Junior Clerk" linking) will be surfaced for your confirmation before running.

&nbsp;

Please proceed part A.

#  **here is part B to make into one Mock test+defination**  

GOAL: When creating OR editing a mock test (Legacy job_tests), 

the SAME form should let me also set up/link its Definition — so 

posting a test and its official syllabus/definition happens together 

in one place, instead of two separate disconnected systems.

Requirements:

1. NEW MOCK TEST CREATION: When I create a new mock test, the form 

   should include an optional "Definition" section/dropdown:

   - Option A: "Link to existing Definition" — pick from already-

     created Job Test Definitions

   - Option B: "Create new Definition now" — inline fields to set 

     up syllabus sections right there in the same form, which 

     creates a new Definition behind the scenes and links it 

     automatically

   - Option C: "Skip — no Definition" — posts the test exactly as 

     it works today, no syllabus/samples/questions workflow attached

2. EXISTING MOCK TESTS (retroactive): When I EDIT any of my 31 

   existing Legacy tests, the same Definition section/dropdown 

   should appear there too — so I can:

   - Link it to a Definition I've since created separately, OR

   - Fill in Definition fields (syllabus sections, samples) directly 

     in the edit form to build one for that existing test, without 

     leaving the page

3. LINKING MECHANISM: Use a definition_id column on job_tests as 

   the link (not manual codes) — set automatically when I pick/

   create a Definition in the form.

4. SAFETY: Confirm linking a Definition to an ALREADY PUBLISHED, 

   live test is safe and doesn't disrupt users mid-test or cause 

   downtime — clarify if the question source switches immediately 

   or only for new test attempts going forward.

5. Keep the SEO Magic (Part A, keywords fix) working independently 

   of this — that's already approved and should proceed regardless.

Please propose the exact form/UI changes (which fields go where) 

before implementing, so I can confirm the layout makes sense.