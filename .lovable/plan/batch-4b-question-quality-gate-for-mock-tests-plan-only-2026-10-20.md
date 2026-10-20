# Batch 4B – Question Quality Gate for Mock Tests (plan only)

## (a) Audit findings (read from code and database on 20 Oct 2026)

**1. How mock tests pick questions**
- Each mock test (`job_tests`) links to a definition (`job_test_definitions`) via `definition_id`. Questions live in `job_test_questions` (keyed by `job_test_id` = definition id).
- The session is built in the browser from `src/services/jobTestService.ts` (RPC `get_job_practice_questions`, direct reads of `job_test_questions`, `get_preview_questions`) and `src/components/mock-tests/JobTestsTab.tsx`. Fallback when a pool is thin: the main bank `content_items`.
- The pool was made by `generate-job-test` + `process-jobtest-queue` (cron every 5 min): first it reuses approved bank questions, then it calls Gemini.
- All Wave 1 definitions have status `draft` but are served anyway. `pool_multiplier` = 2.0 everywhere.

| Wave 1 test | Session size | Pool | Approved | Distinct topics |
|---|---|---|---|---|
| IBA Karachi NTHP 2027 | 85 | 201 | 201 | 87 |
| Sukkur IBA STHP 2027 | 100 | 200 | 200 | 93 |
| Junior Office Associate BPS-13 | 100 | 500 | 500 | 125 |
| Assistant Accountant BPS-15 | 100 | 300 | 300 | 87 |
| Sindh Teaching License EST | 100 | 300 | 300 | 78 |
| Sindh Teaching License SST | 100 | 300 | 300 | 50 |
| Security Officer BPS-17 (High Court of Sindh) | 100 | 220 | 220 | 78 |
| Stenographer BPS-16 (Jamshoro Court) | 100 | 200 | 200 | 77 |
| Junior Clerk BPS-11 (STS) | 100 | 300 | 300 | 121 |
| Junior Clerk BPS-11 (Jamshoro Court) | 100 | 300 | 300 | 101 |
| NTS GAT General | 100 | 200 | 200 | 61 |

- Two more tests are also called "Junior Clerk BPS-11" (200 and 319 questions). They are **not** in Wave 1 unless you say so.
- Every question is `admin_approved = true` (auto-approved at generation time). None are pending.
- Topics are free text on each question (`topic`, `subject`). There is no link to an official syllabus topic list.

**2. Question fields today**
- `job_test_questions`: question, options (jsonb), correct_answer, explanation (no Wave 1 question is missing one), difficulty, validation_score, admin_approved, times_used, times_correct, reused_from_content_item_id, concept_group_id, exam_tier.
- No status like "needs review", no flag field and no reason field on `job_test_questions`.
- `content_items` (the main bank) has `quality_grade` and `quality_verified_at`. The hourly `verify-questions` job (cron `hourly-quality-gate`, minute 20) only checks `content_items`, never mock-test pools.
- NTHP spot check: answer letters are A 76, B 73, C 43, D 9 (skewed toward A and B). Difficulty: easy 70, medium 88, hard 43.

**3. Student signals**
- `times_used` / `times_correct` on `job_test_questions` are 0 for every Wave 1 question, so they are not being updated.
- Answers are stored per user in `user_attempt_history` (question_id, is_correct; no chosen option) and `user_question_mastery` (111 rows with a job question source). `test_attempts.answers` holds answers as JSON.
- There is no "Report this question" button and no reports table (confirmed in Batch 5).
- Result: the "most picked wrong option" signal cannot be measured today. Only % correct can be measured, and only for signed-in users.

**4. AI plumbing**
- `supabase/functions/_shared/gemini.ts` `callAIWithAutoSwitch` rotates free key #1 → #2 → #3. It goes to the paid Gateway **unless** the caller passes `allowPaidFallback: false`, which then throws `FREE_ONLY_EXHAUSTED`.
- Every attempt is logged to `ai_usage_logs` (provider, key, outcome). `quotaManager.ts` has the 1,400/day overall check. Paid calls are capped by `system_settings.paid_ai_daily_ceiling`.
- Note: `verify-questions` today does not pass `allowPaidFallback: false`, so it can spend paid credits. This batch will not change it, because it is a shared path outside scope. It is listed under open questions.
- Existing `system_settings` keys include `ai_daily_limit`, `free_key_health`, `paid_ai_daily_ceiling` and `indexnow_cron_token` (already used to authorise cron calls).

**5. Admin UI**
- The Mock Tests admin area is `src/components/admin/JobTestManager.tsx`, which contains `job-test/*` (`SectionCoverageDashboard`, `GeneratedQuestionsTable`). A new "Quality Gate" panel fits there, next to the coverage dashboard.

## (b) Database changes (one migration, all new, nothing dropped)

- `system_settings` new keys: `quality_mode` (`off` default | `report` | `strict`), `quality_wave` (0–3, default 0), `quality_auto_approve` (false), `quality_daily_ai_cap` (300).
- New table `quality_syllabus_topics`: test definition id, section (English/Maths/ICT…), topic, source_tier (A/B/C), source_url, weight, is_banned flag. Rows come from DB syllabus data and owner input only. The STHP ICT slot stays empty until you supply it.
- New table `question_quality_reviews` (one row per question per check version): question id, test id, deterministic_result + reasons[], ai_verdict (`pass` | `fail` | `needs_review` | `pending`), ai_answers (the AI's own answers), ai_topic, ai_topic_tier, ai_difficulty, relevant (bool), signal_flags, checked_at, checker_version. It has a unique key on (question id, checker_version), so the job can resume where it stopped.
- New table `quality_job_runs`: lease row (single-flight lock with expiry), status (`running` | `paused` | `idle`), pause_reason, calls_today, day.
- New table `question_reports` (for the future report button; not wired to students in this batch): question id, reason, created_at. Insert only from the server.
- RLS: admin-only through `is_admin()` on every new table; `service_role` gets full access. No anon access.
- Live questions are never edited. Strict mode only *excludes* failed questions through one new filter. See rollout step 4. That step is gated and needs your separate approval.

## (c) Edge function and scheduling

- New `quality-gate` edge function (admin button + cron). Auth works like `verify-questions`: an admin user or `x-cron-token`.
- Each run: read `quality_mode` (exit if off) → take the lease → work on up to 30 questions in the active wave → write a review row for each question → release the lease.
- AI calls always use `allowPaidFallback: false`. On `FREE_ONLY_EXHAUSTED`, a 429, or the daily cap, the job pauses with a reason and resumes the next day.
- Deterministic checks run first and cost no AI calls: 4 distinct non-empty options, correct answer present in the options, explanation present, image or figure words ("see figure", "diagram") absent, length limits, near-duplicate text within the same test (reuses `_shared/dedupe.ts` read-only), banned topics, and answer-letter skew per test.
- AI checks, batched 10 questions per call:
  - Maths/numeric: one blind solve without the answer key. If the AI disagrees, the question is `fail`. If the AI is unsure, it is `needs_review`.
  - English/GK: two blind calls. Both must match the key for `pass`. If either disagrees, the question is `needs_review`, never a silent fail.
  - The same call also tags the topic (from that test's topic list only), the difficulty and relevance.
- Student signals (nightly SQL, no AI): % correct from `user_attempt_history` once there are at least 20 attempts. Below 15% correct, the question is flagged. Report count of 3 or more is flagged once reports exist.
- Cron: one job every 2 hours (12 runs/day, each bounded). This finishes the work without a fast polling loop. It does nothing when `quality_mode = off`.

## (d) Admin screen

- New "Quality Gate" card inside the Mock Tests admin, with a mobile-first layout:
  - Mode switch (off/report/strict), wave selector, "Run now" button, AI calls used today.
  - Per test: pass / fail / needs_review / pending counts, topic coverage against the syllabus (too many / too few), difficulty mix, answer-letter balance, pool floor status.
  - Failing and needs-review list with reasons. Here you can "Mark OK" or "Exclude". This writes only to the review row.
  - Export CSV, plus a "Calibration 40" export: a balanced sample of 40 questions with verdicts.

## (e) AI volume and timeline

- Wave 1 has about 3,020 questions. Deterministic checks need 0 AI calls.
- Maths questions need about 1 call per 10 questions. Other questions need about 2 calls per 10. That is roughly 500–550 calls, plus about 15% retries, so about 620 calls.
- At 300/day this is **about 3 days**, or 4–5 days if the free keys are busy with other jobs (the free keys are shared with auto-fill and the hourly gate).

## (f) Rollout and rollback

1. Build with `quality_mode = off`. Nothing changes for students.
2. You set `report` + wave 1. The job checks the questions and the reports fill in. Students still see everything.
3. Calibration: export 40 questions and judge them with Claude. Tune the rules and raise `checker_version` if needed.
4. Strict mode (later, needs separate approval): session queries skip questions whose latest verdict is `fail`. They never drop below 1.5× session size; if they would, the best questions are kept and the shortfall is reported. This step touches `jobTestService.ts` and `get_job_practice_questions`.
5. Rollback: set `quality_mode = off`. That makes the job a no-op and the strict filter is ignored. No question data is ever changed.

## (g) Tests

- Unit tests for the deterministic checker:
  - 3 options → fail
  - duplicate options → fail
  - key not in options → fail
  - missing explanation → fail
  - "refer to the figure" → fail
  - letter-skew detector (NTHP-like A76/B73/C43/D9 → flagged)
- Pool-floor test: a 100-question session with a 140-question pass pool keeps 150 questions (it backfills the best non-pass ones) and reports a 10-question shortfall.
- Verdict-rule tests:
  - maths solve disagrees → fail
  - one of two factual answers disagrees → needs_review
  - AI unsure → needs_review
- Edge function test: mode off → returns skipped with 0 AI calls; cap reached → paused.

## (h) Risks and what not to do

- AI can be wrong. That is why disagreement on factual questions goes to needs_review, and nothing is auto-removed before calibration.
- The free keys are shared, so this job can slow auto-fill. The 300 cap and the 2-hour runs keep it bounded.
- **Do not** turn on auto-approve, auto-delete or auto-rewrite of questions.
- **Do not** turn on strict mode before calibration.
- **Do not** claim "official syllabus" on any page for tier B/C topics.
- **Do not** invent STHP ICT topics.
- No page, title, meta or sitemap changes in this batch.

## (i) Owner checklist (phone-friendly)

1. Approve the plan → Build.
2. Admin → Mock Tests → Quality Gate → set **Report**, Wave **1**.
3. Wait about 3 days. Check the "AI calls today" counter stays at or below 300.
4. Tap **Calibration 40** → share it with Claude → agree on any fixes.
5. Send the official STHP ICT topics.
6. Only then decide on strict mode (a separate approval).
7. Any problem → set **Off**.

## (j) Open questions

1. Two extra "Junior Clerk BPS-11" tests (200 and 319 questions): include them in Wave 1?
2. Should `verify-questions` (the main bank) also become free-only? This is out of scope here, but it can spend paid credits today.
3. Should a student "Report this question" button come in a later batch? Student signals are weak without it.
4. Should `times_used` / `times_correct` start being updated? That would be a later batch, because it changes session save code.
5. Are the banned topics per test just "politics/religion" for all, or does each test have its own list?

## Technical details

- Files to add: `supabase/functions/quality-gate/index.ts`, `supabase/functions/_shared/qualityChecks.ts` (pure, testable), `src/components/admin/job-test/QualityGatePanel.tsx`, `src/lib/qualityRules.js` + test.
- Files to touch: `JobTestManager.tsx` (mount the panel), `supabase/config.toml` (`verify_jwt = false` for quality-gate), `AGENTS.md` (one rule).
- Not touched: `_shared/gemini.ts`, `sanitize`, the session code (until step 4), SEO and sitemap.
