# Batch "Gate speed-up" (plan only)

## What changes (plain language)
1. **More work per run, more runs.** Each run may make up to 8 AI calls of 10 questions each (80 questions), but stops at about 45 seconds whatever happens. Runs every 15 minutes instead of every 1-2 hours. The 5-minute lock stays, so two runs never overlap. Progress is saved after every AI call, so a killed run loses at most one call.
2. **Stops for the day by itself** when: all free keys are cooling down (existing cooldown memory), or the Gate's own budget (quality_gate.max = 300) is used, or the existing daily Gate cap is reached. Never paid; the learner reserve (150) is untouched.
3. **Priority order:** Sukkur IBA STS / IBA Community Colleges tests, then NTHP, STHP, Sindh Teaching License; after that the other live tests, the ones checked longest ago first.
4. **Exact duplicates share one verdict.** Questions with the same cleaned question text + same 4 options (as a set) + same correct answer text are grouped. One is sent to AI; the verdict is copied to the rest and marked "copied from <question>". Only exact matches. Questions themselves are never edited or deleted.
5. **Model (advice only, no switch):** Gemini Flash-Lite has a higher free daily limit, and is fine for spotting broken format, but weaker at maths and tricky English. Recommendation: keep the current model for the blind-solve check until a 20-question side-by-side comparison agrees on at least 19 of 20 (this test is still waiting on free quota). Owner decides afterwards.
6. **Daily Quality Report** gets a line: "Gate AI calls today: X / 300" and "Questions checked today: Y".
7. Unchanged: mode stays "report", hide switch stays locked, students' tests unchanged, no SEO/sitemap change.

## Expected speed (estimate, not measured)
- Up to 300 AI calls a day × 10 questions = about **3,000 questions a day**, plus copied verdicts. Recent sweeps found about 13,000 questions in exact or near-exact groups, so copies could add roughly 20-40% more (unmeasured until it runs).
- Around 22,000-24,700 questions still pending: about **6-9 days** if keys stay healthy. If Google limits each key to fewer requests, it goes slower; the report will show the real count.
- Today: about 25-50 calls a day (250-500 questions).

## Risks
- **546 / time-out:** the 45-second stop and a check before every AI call keep runs under 60 s; the lock expires after 5 minutes if a run dies.
- **Quota:** free keys may run out early each day. Then the Gate stops until the next Google day (about 1 pm Pakistan time); learners keep their 150 reserve.
- **Wrong copied verdict:** only exact text + options + answer get copied, so a copy is exactly as right as the original. A copied verdict is never stronger than "pass" from report mode, and copies can be undone in one step (they are tagged).
- **Every-15-minute runs** cost a little database work when nothing is left; the run exits at once if there is nothing pending or the day is closed.

## Tests to add
- Run stops before 45 s and before the daily cap / Gate budget.
- Priority order: STS/IBA, NTHP, STHP, Teaching License before others; then oldest-checked first.
- Duplicate key: same text/options/answer groups; different answer or one different option does not group; option order doesn't matter.
- Copied verdict carries the "copied" tag and source id.
- No paid call ever (existing free-only guard test kept).

## Rollback
- Set quality_mode = off (instant stop, no code).
- Copied verdicts: delete review rows tagged "copied" (questions untouched).
- Schedule back to 2-hourly; restore previous version for code.

## Technical details
- `supabase/functions/quality-gate/index.ts`: PER_RUN 10, MAX_AI_CALLS 8, TIME_BUDGET_MS 45_000 checked before each call; persist reviews per call; early-exit when `free_key_health` shows all keys cooling or `checkFreeBudget(admin,'quality_gate')` refuses; ordering by a priority tier (org/label match) then `max(checked_at)` asc instead of label rotation.
- Exact-duplicate key in `_shared/qualityChecks.ts`: `normText(question) | sorted normText(options) | normText(correct option text)`; pure helper `exactDupKey` + test. Copies written to `question_quality_reviews` with `signal_flags: ['copied_verdict']` and `ai_answers.copied_from`. Exact column for the tag confirmed before build (uses existing jsonb fields; no new table).
- Cron: change the existing quality-gate job to `*/15 * * * *` via cron.alter_job (no new job).
- `src/pages/admin/DailyQualityReport.tsx`: read `quality_job_runs.calls_today` (day = today) and the Gate budget max; show "not logged" if missing.
- Tests: `qualityChecks_test.ts` additions plus a small pure test for priority order and stop rules.
