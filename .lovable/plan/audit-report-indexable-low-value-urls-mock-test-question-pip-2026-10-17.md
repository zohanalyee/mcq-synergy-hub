# Audit report: indexable low-value URLs + mock-test question pipeline (17 Oct 2026)

Audit only. No code, data or sitemap changes were made. "Verified" means I checked it with a database query or the code. "Not checked" means I did not.

---

## Part A — URLs by content type


| Type                          | In DB                                       | In sitemap                                  | Indexable (rule in code)                           |
| ----------------------------- | ------------------------------------------- | ------------------------------------------- | -------------------------------------------------- |
| Blog                          | 35 (all published)                          | 35                                          | All with 80+ words (35)                            |
| Jobs (external_opportunities) | 185 (183 approved)                          | 80                                          | See expiry gap below                               |
| Scholarships                  | 21 (19 approved)                            | 12                                          | See expiry gap below                               |
| Announcements                 | 12 (all published, all `is_indexable=true`) | 0 detail pages (only `/announcements` feed) | All 12 detail pages say index                      |
| Board topics                  | —                                           | 1,313 (boards-1 1,000 + boards-2 313)       | Topics with 8+ approved MCQs                       |
| Mock tests                    | 95 job_tests                                | 95 (no filter)                              | All                                                |
| Exam pages                    | 24 rows (23 published + in sitemap)         | 24 (/exams + 23)                            | Gate: published, admission guides need officialUrl |
| Tools                         | 60+                                         | 15                                          | Allow-list of 15                                   |
| Programmatic /p               | registry                                    | 21                                          | intro 60+ words, 3+ FAQs                           |


I did not fetch the raw HTML for every URL. The "indexable" column comes from the rule in the code, not from a check of the live site.

### Jobs / scholarships (approved only)

- Jobs: 183 total. 149 past their deadline, 103 more than 30 days past it, 15 have no deadline.
- Scholarships: 19 total. 7 more than 30 days past their deadline, 4 have no deadline.
- Imported vs original: all 202 have source "AI Content Studio". No row is marked as original. The data cannot show which ones were written by hand.
- 40-word description: 183 of 183 jobs and 19 of 19 scholarships pass. The code's own minimum is 25 words.
- Linked mock test or exam page: no field links them. There is no `job_test_id` or exam slug column, so the count is 0 by structure.
- **Expired but still indexable (likely ~110):** the browser version of the page adds noindex 30 days after the deadline. But the HTML built ahead for search engines (`scripts/inject-meta.mjs:386-405`) only checks for thin text, not the deadline. So the ~103 old jobs and 7 old scholarships still say `index,follow` in that HTML. This is a hypothesis from reading the code; I did not check the live HTML.
- Missing listings: the detail page with no matching listing (`OpportunityDetail.tsx:186-196`) does not add noindex.

### Announcements

- The 12 detail pages are indexable but are not in any sitemap.
- The table has no imported/original flag, so I can't count unique text. Body length is 663–2,139 characters.

### Blog

- Word count: 104–1,180, median 950. 8 posts are under 600 words.
- 10 of 35 contain a link to /mock-tests, /exams or /boards.
- Links into posts: only from the /blog list and "3 related posts in the same category". There is no link from a hub or exam page, except NTHP → its own post. Posts that are alone in their category get no related-post links. I did not count them exactly.

### How expiry works

- Sitemap: a listing drops out when deadline + 30 days is before today (Pakistan time). Listings with no deadline never drop out.
- This happens automatically on every production build (the sitemap script runs before the build), but not in dev builds.
- Risk: if the database read fails, the generator writes empty jobs/scholarships/blog/mock-test sitemaps instead of keeping the old ones.

### Smallest change set (proposal)

1. Make the built HTML follow the same 30-day expiry rule as the browser page (one shared helper). Low risk.
2. Add noindex to the "listing not found" page. Low risk.
3. Make the sitemap generator keep the previous file when a database read fails. Low risk.
4. Treat listings with no deadline as expired 90 days after they were created. Medium risk (your call).
5. Optional: jobs.xml lists only jobs linked to a mock test or exam page. This needs a new link field and admin tagging first, so it is not possible today.
6. Optional: add announcement detail pages to the sitemap, or mark them noindex. Your choice.

---

## Part B — NTHP mock test questions

### 1. How questions are produced (verified)

- The NTHP job_test is linked by `definition_id` to a job_test_definitions row with status **draft**. Explicit links are still served, so the pre-generated path is used.
- The pool has **201 approved questions**, shared by all students:
  - Math 106 (40 easy / 45 medium / 21 hard)
  - English 95 (30 easy / 43 medium / 22 hard)
- Each attempt picks from that pool with no AI call. Files: `MockTestDetail.tsx` → `JobTestsTab.tsx:95-205` → `jobTestService.ts:286-485`.
- The pool is built by the `generate-job-test` edge function (queued by `process-jobtest-queue`). It reuses bank questions first, then asks AI for the rest, saved with `admin_approved=false`.
- AI model: `gemini-flash-latest` direct, with keys #1→#2→#3. Paid fallback: `google/gemini-3-flash-preview` (`_shared/gemini.ts`).
- Tests without a definition use the other path: `generate-test` is called at runtime for each subject.

### 2. Fields read vs ignored

- `sections.subject`: read (generation and per-attempt split).
- `topics`: prompt text only. Not checked after generation.
- `question_count` (45/40): used only as the pool target. The per-attempt split uses `percentage`.
- `percentage` (53/47): read for the per-attempt split. With 85 questions that gives 45 Math / 40 English.
- `forbidden`: used in the prompt plus a word filter on new AI questions. **Not applied to reused bank questions.**
- `sample_questions`: up to 3 are used as prompt examples.
- `duration`, `questions`: read for the timer and the question count.
- `weighted_syllabus`: an import/export alias only.
- `difficulty_distribution`**: stored but ignored.** The prompt hardcodes 30/50/20.

### 3. Validation today


| Check                                          | Status                                                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Schema (stem, A–D, answer letter, explanation) | Partial — `generate-job-test/index.ts:239-248`                                                        |
| Exact N per section                            | Partial — shortages are filled from any subject (`JobTestsTab.tsx:196-205`)                           |
| Per-topic coverage                             | Missing                                                                                               |
| Forbidden-term filter                          | Partial — new AI questions only (`index.ts:251-274, 617-621`)                                         |
| Duplicates within a test                       | Missing for new AI questions; reuse path checks stems (`index.ts:394-428`)                            |
| Across attempts                                | Partial — seen IDs fetched but not excluded; wrong answers ranked first (`jobTestService.ts:404-485`) |
| 4 distinct options                             | Missing in code. The current NTHP pool has 0 violations (verified).                                   |
| Single valid answer                            | Partial — letter check only                                                                           |
| Math answer verification                       | Missing. `verify-questions` exists but is a separate, optional AI review.                             |
| Figure-dependent                               | Missing in code. The NTHP pool has 0 stems mentioning figure/diagram (verified).                      |
| Language/quality                               | Partial — `_shared/stemStyle.ts` genre/length checks                                                  |


### 4. What happens on failure

- Bad JSON: the dedicated generator returns an empty list (no repair). `generate-test` has repair.
- Wrong counts: up to 5 batches of 10, then a partial save.
- Forbidden question: rejected and recorded in `job_test_generation_logs`. A database insert error is only logged to the console, while the status is computed from accepted questions, not saved ones.
- Students only see approved pool questions. If the pool is empty, the attempt stops; nothing is generated on the fly.

### 5. Caching and cost

- The pool is reused across all students. **0 AI calls per NTHP attempt.**
- AI cost happens only when the pool is generated or topped up by admin or the queue.

### 6. Problems found in the NTHP pool (verified)

- **Topic labels are messy and don't match the official syllabus.** The pool has 80+ free-text labels (e.g. "Percentages" 20, "Prepositions" 8).
- **Most official Math topics appear missing.** No labels for logarithms, matrices, trigonometry, sets, quadratics (beyond 1), functions/graphs or statistics.
- **Many English official topics appear missing too:** Reading Comprehension, Cloze, Sentence Ordering, Punctuation.
- **Off-syllabus questions reused from other tests:** "Pedagogical Approaches to ELT", "Legal and Official Vocabulary", a question set at an "ASF training center".
- Size: about 2.4 full attempts per subject before questions repeat.

### 7. Proposed guards (priority order)

1. **Apply forbidden terms and topic membership to reused questions too.** Files: `generate-job-test/index.ts`. AI cost: none. Risk: low (the pool may shrink).
2. **Deterministic checks on accept:** 4 distinct options, stem dedupe inside the test (normalised text), figure/calculator word block. Files: `generate-job-test/index.ts`, `_shared/stemStyle.ts` (shared — needs your OK). AI cost: none. Risk: low.
3. **Map each question to the nearest official syllabus topic, plus a coverage report** in the Section Coverage admin page. Files: `SectionCoverageDashboard.tsx`, one migration (`syllabus_topic` column). AI cost: none. Risk: low.
4. **Exact section counts:** don't fill a shortage from the other subject; show "X of N" instead. Files: `JobTestsTab.tsx`. AI cost: none. Risk: low.
5. **Respect** `difficulty_distribution` in both the prompt and the selection. AI cost: none. Risk: low.
6. **Cheap math answer check:** one extra low-cost model call per Math batch re-solves the questions; mismatches go to admin review. Files: `generate-job-test/index.ts`. AI cost: low (about +1 call per 10 Math questions, generation time only). Risk: medium (false flags).
7. **Exclude questions seen in the last N attempts** (use the IDs already fetched). Files: `jobTestService.ts`. AI cost: none. Risk: low.

### 8. Dry run (read-only)

- I did not generate 3 AI sets. Doing so would call paid AI and goes beyond "no changes". Running the selection code read-only would need a build-mode script.
- Instead, here is one random 10-question sample from the approved pool. Answers I worked out myself:


| #   | Topic (pool label → official)                       | Answer                        | Verify?                                 |
| --- | --------------------------------------------------- | ----------------------------- | --------------------------------------- |
| 1   | Antonym of Benevolent → Vocabulary                  | C Malicious, correct          | No                                      |
| 2   | Preposition "investigation into" → Prepositions     | A, correct                    | No                                      |
| 3   | Tea mixture 600/800 with 20% profit → Ratio/Mixture | A 1:2                         | **Yes (stem truncated, can't confirm)** |
| 4   | "stifle the dissenting voices" → Vocabulary         | C, correct                    | No                                      |
| 5   | Rug 1500→1800 profit % → Percentages                | B 20%, correct                | No                                      |
| 6   | Cylinder r=7, h=10, 60% → Solid Geometry            | A 924 m³, correct with π=22/7 | Low (π assumption)                      |
| 7   | Triangle 2:3:4 largest angle → Plane Geometry       | C 80°, correct                | No                                      |
| 8   | "living in Karachi ___ 2010" → Prepositions         | B since, correct              | No                                      |
| 9   | 1,4,9,16,25,? → Sequences                           | B 36, correct                 | No                                      |
| 10  | 3x+7=22 → Equations                                 | B 5, correct                  | No                                      |


Also note: Q6 uses an "ASF training center" setting (borrowed context). Several questions are basic-level, while NTHP targets HSSC-I.

---

## Open questions

1. Should jobs/scholarships with no deadline expire after a fixed period? If yes, how many days?
2. Announcement detail pages: add them to the sitemap, or mark them noindex?
3. Do you want a link field (job → mock test / exam page) so jobs.xml can be limited later?
4. For NTHP: remove reused off-syllabus questions from the pool (hidden, not deleted) and top up the missing official topics?
5. Approve editing the shared `stemStyle.ts` helper for guard 2, or keep the new checks inside `generate-job-test` only?
6. Run a real 3-set dry run in build mode (selection only, no AI, nothing saved)?
7. The NTHP definition is still "draft" but served — should it be published or stay as is?

&nbsp;

&nbsp;

BUILD MODE. Batch 4A: indexing hygiene. Isolation: only files needed for items 1-5. No new pages. Do not touch exam pages, board topics, mock tests or STS/STHP/NTHP content.

&nbsp;

1) EXPIRY, one shared helper used by BOTH the browser page and the prerender (scripts/inject-meta.mjs:386-405) and the sitemap generator: a job/scholarship is expired when deadline + 30 days < today (Pakistan time). If there is NO deadline, treat it as expired 90 days after created_at. Expired listings: noindex,follow in the prerendered HTML and removed from jobs.xml/scholarships.xml. The page itself stays reachable.

2) OpportunityDetail "listing not found" state: add noindex (and make sure the prerender does the same).

3) Sitemap generator fail-safe: if a database read fails, keep the previous file for that sitemap instead of writing an empty one, and print a clear warning in the build log.

4) Announcement detail pages: noindex,follow in both browser and prerender (keep /announcements feed as is). They are not in any sitemap, so no sitemap change.

5) REPORT-ONLY (no change): list blog posts with fewer than 300 words (slug, word count, links to /mock-tests, /exams or /boards: yes/no).

&nbsp;

REPORT: before/after counts of indexable job and scholarship pages in the prerendered HTML; expected sitemap diffs for jobs.xml and scholarships.xml (how many drop, which rule); raw HTML of 2 expired and 2 active listings (robots tag); confirmation that no other sitemap addresses changed except routine data; blog list from item 5; full build pass count.