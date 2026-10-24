# Plan: 3 phases (each phase built only after your separate approval)

Rules for every phase: no edits or deletes to questions or reviews; never use "official" or "past paper" in new UI or PDFs; no STS mention on NTHP; no paid AI; hide switch stays locked; all tests run after each build, with an exact change report.

Credit estimates are rough (S = small, M = medium, L = large).

## Phase 1 (urgent)

**1. Quality Gate fix: deploy and watch**
- Files: supabase/functions/quality-gate/index.ts, _shared/gemini.ts, _shared/qualityChecks.ts, _shared/gateSpeed_test.ts (already written).
- Steps: code check, run the Gate tests, deploy, then after 13:00 PKT read 2-3 cron runs. Per run I report: time taken, status code, questions AI-checked, copies made, real 429s, 546/504.
- Model: the code uses "gemini-flash-latest" (with backup names gemini-2.0-flash, gemini-2.5-flash). I'll confirm which model actually answers from the logs. Google's free daily limit per key isn't stored in the project, so I'll quote Google's published limit for that model and mark it unverified.
- Risk: medium. Runs may still be slow if Google answers slowly. Rollback: restore the previous version.
- Credits: S-M (the watching takes several checks).
- Test: the Gate tests plus the real run logs.

**2. GA4 mock-test tracking**
- Files: src/lib/growthRules.js (+ .d.ts), src/lib/growthRules.test.mjs, src/hooks/useTestGrowth.ts, the result screen that calls the hook, and the admin stats ("Tests Completed": src/lib/aiCoach.ts / home stats, confirmed before the build).
- a) test_abandon fires at most once per attempt, only on pagehide or an in-app page change. Locking the phone or switching apps no longer counts. resume() is removed.
- b) A new test_complete event fires once when the result screen shows, with: test_slug, exam_category, questions, score_band (0-39 / 40-59 / 60-79 / 80-100), is_guest.
- c) Admin "Tests Completed" adds guest attempts (job_test_progress rows that have best_score), shown as "Guests / Signed-in". Read-only query; how guest rows are identified is checked first.
- Risk: low. No public change other than analytics events.
- Credits: S.
- Test: new tests for one-abandon-only, no abandon on hide, complete fires once, and score-band edges (39/40/59/60/79/80/100).

## Phase 2 (PDF system)

**3. Storage and publishing**
- New public bucket "practice-pdfs" (made with the storage tool). Upload and delete are admin-only via is_admin(); anyone can read.
- Migration: add file_url, set_label, short_description, is_published (default false) to pdf_practice_sets.
- src/pages/admin/PdfBuilder.tsx: a "Publish PDF" button uploads to {hub_slug}/{file_name}, and "Upload existing PDF" lets you pick a file, a test and a set label (A/B/C...).
- Risk: medium. Your workspace may block public buckets; if so I stop and tell you.
- Credits: M.

**4. "Free Practice PDFs" section**
- Files: src/pages/MockTestDetail.tsx, the exam hub page, a new small read-only list component, scripts/inject-meta.mjs (prerendered text), plus a build snapshot script like the featured-cards one.
- Shows the published sets for that test: title, one-line section split, and a Download button with utm_source=site_pdf, tracked as pdf_download.
- The PDF files stay noindex and out of the sitemap. The _headers rule for /practice-pdfs is not possible on Supabase, so the bucket files are kept out of every sitemap and not linked as a page to index.
- Risk: medium (build-time read). Sitemaps unchanged.
- Credits: M.

**5. PDF Builder fixes** (src/lib/pdfBuilder/rules.js, PdfBuilder.tsx, rules.test.mjs)
- a) Topic cap = max(2, ceil(section wanted / distinct topics in pool) + 1).
- b) The title, file name and campaign use the final picked count.
- c) A toggle, on by default: "Exclude questions used in earlier sets of this test" (uses saved question_ids).
- d) The preview shows "Requested X · Final Y", plus eligible / picked / skipped per section (topic cap, duplicate, used before).
- e) announcementSite('sts') becomes iba-suk.edu.pk/sts.
- The sameAnswerAndTerm check is unchanged.
- Risk: low. Credits: S-M. Tests: new cases for a-e.

## Phase 3 (smaller items)

**6. NTHP and STHP cross-links.** "Also preparing for…" boxes link NTHP to STHP and STHP to NTHP, with no STS wording on NTHP. Files: the mock-test related box and the hub pages (confirmed at build). Risk: low. Credits: S.

**7. Report only:** correct-answer letter counts (A/B/C/D) per test from the database, and whether the mock-test player shuffles options on screen (read from the code). I'll propose a fix but not apply it. Credits: S.

**8. Report only:** security warnings grouped by type, with count and risk level. Credits: S.

**9. IBACC&S hub page (Batch 12)**
- Shows "Applications closed", the syllabus per position from src/generated/stsSyllabus.json, and links to each IBACC&S mock test.
- Test date line, exactly: "Test date will be announced by SIBA Testing Services — check iba-suk.edu.pk/sts". No date or countdown.
- Wording, exactly: "IBACC&S is managed by Sukkur IBA; tests are conducted by SIBA Testing Services."
- Prerendered, added to exams.xml (+1, sitemap diff shown first), and linked from the STS and Sukkur IBA pages.
- Files: a new hub page and route, the prerender route list, generate-sitemaps, and the STS/Sukkur IBA link boxes.
- Risk: medium (new indexable page). Credits: M.

**10. Syllabus fix for the 3 HOLD tests (two steps)**
- Step 1: show you before/after of the syllabus sections in job_tests and job_test_definitions. No write.
- Step 2, after your approval:
  - Admission & Examination Officer: Academic 20 / Office 10 / Assessment 30
  - Administrative Officer: Office 10 / General Admin 30 / HR 20
  - Administrative & Accounts Officer: Office 10 / HR 20 / Accounting 30
- Then release the 3 Batch 10 HOLD descriptions. Their current values are already in the Batch 10 backup.
- The totals are 60%, not 100%. I'll confirm with you whether that's intended (for example, other sections stay as they are) before writing anything.
- Risk: low; questions untouched. Credits: S.

## Can't do, or not fully
- True HTTP 404s and header rules for PDF files in the Supabase bucket aren't possible on the current hosting.
- Google's exact per-key free limit can't be read from the project; it will be marked unverified.
- Gate run results depend on the free quota resetting; if keys stay limited, I'll report that instead of numbers.
