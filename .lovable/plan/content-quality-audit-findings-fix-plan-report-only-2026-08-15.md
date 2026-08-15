# Content Quality Audit — Findings + Fix Plan (report only)

All numbers below come from live database queries run just now (15 Aug 2026, ~05:00 UTC / 10:00 PKT).

## 0. URGENT — "kal ke 600 questions" — CONFIRMED SILENT FAILURE

Yesterday's target was **NOT** achieved. It is a scope-filter failure, not a cron failure.

- Cron **did** run: 8 autofill runs on 14 Aug (00:00, 03:00, 06:00 … 21:00 UTC). No errors, no quota block, `queue_error = null`.
- Every single run stopped with the same reason: **"No queued topics match the sprint scope"** — `topics_processed: 0`, `questions_saved: 0`.
- Actual rows inserted into `content_items` on 14 Aug: **14** (and those came from a manual/other source, not autofill). 13 Aug: 58. 12 Aug: 200. 11 Aug: 373. So the 600/night target has never actually been hit.
- Root cause: Sprint Mode is ON with `scope_keywords: ["mdcat"]`. The gap queue currently returns **400 topics**, but **0** of them contain "mdcat" anywhere in board/class/subject/topic text — MDCAT content lives under names like "Biology / Chemistry / Class 11", never the literal string "mdcat". So the keyword filter throws away 100% of the queue every run and the run exits in under a second.
- Same reason today's runs (00:00 and 03:00 UTC) also produced 0.
- Secondary signal: the quality-gate runs log Gemini `404` and `400` attempts before falling back to the Lovable provider — worth cleaning up but not the blocker.

**Fix (Phase 1, minutes):** stop matching on a literal exam keyword. Either (a) switch sprint scope to the real taxonomy (`class 11, class 12, biology, chemistry, physics, english`) which is what "MDCAT" actually means in the data, or (b) better: make Sprint Mode **preference, not exclusion** — matched topics get processed first, then the run falls through to the rest of the queue instead of exiting. Option (b) guarantees the nightly budget is never wasted again, regardless of how keywords are configured. Recommended: do both, plus a hard rule that a run reporting 0 saved while the raw queue is non-empty writes a visible "WASTED RUN" alert.

## 1. CRITICAL — "essay-style" questions in Junior Office Associate / court tests

Confirmed the complaint, with an important correction: these are **not** broken non-MCQ items and they are **not** caused by the concept-group reuse system.

Facts:

- 5,235 mock-test questions total. Every single one has a valid 4-option array — **0 questions with missing/malformed options**.
- Only **22** questions were ever reused from the board bank (`reused_from_content_item_id`), and **none** of the offending long items are reused. So concept-group / subject-alias reuse is not the source. The AI generator wrote these stems directly.
- The real defect is **stem length / wrong question genre for the exam**: 371 questions (7.1%) have stems over 200 characters, 45 over 300.
- Worst examples in the court family (all `Junior Office Associate (BPS-13)`, `PA to Judge (BPS-17)`, `Security Officer (BPS-17)`):
  - 555 chars — "Read the following passage and identify the most appropriate summary: 'The recent economic survey highlighted persistent fiscal deficits…'" (subject: English) — appears in **two** different court tests.
  - 470 chars — "Read the following passage and answer the question: 'The recent surge in inflation…'" (English)
  - 403 chars — factory-quality case study (Analytical / IQ)
  - 379 / 366 / 345 / 338 chars — multi-condition seating/routing/grouping puzzles (Analytical Reasoning)
- Site-wide pattern (not court-only). Highest long-stem share by subject: Analytical Reasoning 44.7%, Advanced Pedagogy 46.7%, Analytical / IQ 37.5%, Logical Reasoning 35.2%, Computer (MS Office) 23.3%, Basic Computer & MS Office 16.7%. Science subjects are fine (Biology 3.6%, Chemistry 3.3%, English 1.8%).
- 48 questions contain explicit essay/comprehension verbs ("read the following passage", "discuss", "write a…").

Interpretation: for a BPS-13 clerical post, a 555-character comprehension passage is the wrong genre — real papers use one-line grammar/vocab/GK items. Reasoning subjects legitimately need slightly longer stems, so the fix must be per-subject, not a blanket length cap.

**Fix plan (Phase 1, same sprint as item 0):**

1. Add an explicit **stem-length + genre rule to the** `generate-job-test` **prompt**: max ~180 chars for English/GK/Islamiat/Pak Studies/Computer, max ~320 for Analytical/Logical Reasoning; ban "read the following passage", "discuss", "write a", "explain in detail", multi-line numbered condition lists for non-reasoning subjects; require a single-sentence stem.
2. Add a **server-side validator** in the same function that rejects a generated item before insert when it breaks its subject's length cap or matches the banned-genre regex, and asks for a replacement — same shape as the existing duplicate guard.
3. Extend `verify-questions` (quality gate) with the same check so the **existing 371 long stems get flagged and downgraded** during the hourly audit instead of needing a manual hunt. Flagged items become review-queue items, not deletions.
4. One-off admin action: list the 48 essay-verb items + the 45 stems over 300 chars in the review panel so you can regenerate the court tests before the banner goes up.

## 2. Question-count inconsistency across admin panels

There is no single source of truth today, which is exactly why the numbers disagree:

- `content_items` = **9,423** total, 9,293 approved, 130 not approved.
- `job_test_questions` = **5,235** total, 5,082 approved, 153 drafts.
- Mock Test Analytics counts `job_test_questions` per definition; Content Health counts `content_items` approved-per-topic; the Auto-Fill panel counts *gaps* against `min_threshold`. Three different denominators, three different filters (approved vs. all, topic-linked vs. all), so three different totals — none of them wrong, all of them incomparable.

**Proposal:** one `get_unified_content_counts()` RPC returning both banks side by side (total / approved / draft / never-used, per bank, plus per-subject and per-test breakdowns) and a single "Content Totals" strip rendered at the top of the Auto-Fill dashboard. Every other panel reads its numbers from that RPC so a mismatch becomes impossible.

## 3. Daily generation history

Today there is no daily view — the data exists in `ai_usage_logs` (`auto_fill_run_summary`, `admin_bulk_generator`) but only readable by SQL. Actuals for the last 5 days (questions inserted into `content_items`):


| Date   | Inserted | vs. 600 target |
| ------ | -------- | -------------- |
| 14 Aug | 14       | 2%             |
| 13 Aug | 58       | 10%            |
| 12 Aug | 200      | 33%            |
| 11 Aug | 373      | 62%            |
| 10 Aug | 0        | 0%             |


**Proposal:** a "Daily Generation" card — today vs. target with a progress bar, 7-day sparkline, per-run rows (time, source, topics, saved, stop reason) and a red badge on any run that saved 0 while the queue was non-empty. This is the alarm that would have caught yesterday on the first run instead of after 8 wasted runs.

## 4. Waste / duplicates

- **Duplicates in the mock-test bank: 800 duplicate groups, 1,088 redundant copies** = ~20.8% of the 5,235 questions are repeats of another question's text. This is the single biggest waste item.
- Quality grades on the board bank: A 4,512 · C 2,048 · D 275 · F 53 · ungraded 2,535. So **328 (3.5%)** are graded D/F (kept, excluded from reuse per existing policy) and 27% have never been graded at all.
- Never used: 7,581 of 9,423 board questions (80%) and **all 5,235** mock-test questions have `times_used = 0` — usage recording is clearly not firing on the mock-test path even though the board path records it.
- Effective waste estimate: ~21% duplicate + ~3.5% D/F ≈ **one in four generated questions is not adding value**, plus a measurement gap that makes rotation/freshness decisions blind on mock tests.

**Fix plan (Phase 2):** dedupe pass on `job_test_questions` (keep the oldest of each group, unlink the rest from tests rather than delete), a pre-insert fingerprint guard on the mock-test path mirroring the board path, and wire `times_used`/`usage_count` recording into mock-test completion.

## 5. Difficulty balance — drifted

Target is 20 / 60 / 20 (easy/medium/hard). Actual:


| Bank                                     | Easy  | Medium | Hard  |
| ---------------------------------------- | ----- | ------ | ----- |
| Board (`content_items`, 9,423)           | 22.5% | 62.5%  | 15.0% |
| Mock tests (`job_test_questions`, 5,235) | 32.7% | 48.8%  | 18.5% |


Board bank is close to target (Hard is 5 points light). Mock tests skew Easy-heavy and Medium-light. Root cause: the board path rotates difficulty from `auto_fill_config.difficulty_weights`, while the mock-test path uses each definition's own `difficulty_distribution` and does not enforce a global ratio.

**Fix (Phase 2, low risk):** apply the same weighted rotation to the mock-test generator, and bias new requests toward the deficit label (Hard for the board bank, Medium for mock tests) until the ratio lands inside ±5 points. No Easy-specific sprint needed — Easy is not the shortfall.

## Suggested phasing

- **Phase 1 (before the banner — highest urgency):** sprint-scope fix + wasted-run alert (item 0), stem-length/genre prompt rule + pre-insert validator + quality-gate flagging and a court-test regeneration list (item 1).
- **Phase 2:** unified count RPC + Daily Generation card (items 2 & 3), mock-test dedupe + usage recording (item 4), difficulty rebalance (item 5).

## Technical notes

Files/objects touched in Phase 1: `supabase/functions/scheduled-autofill/index.ts` (sprint scope becomes preference + zero-save alert), `supabase/functions/generate-job-test/index.ts` (prompt rule + validator), `supabase/functions/verify-questions/index.ts` (length/genre check), `system_settings.content_fill_sprint` (keyword correction via data update), and the admin Sprint/Engine panels for the new alert surface. Phase 2 adds one `get_unified_content_counts` RPC, a daily-log RPC over `ai_usage_logs`, and a one-off dedupe data operation. 

&nbsp;

Approved — is-order-mein:

&nbsp;

PHASE-1 (BANNER-SE-PEHLE, SABSE-URGENT):

1. Sprint-scope-fix — keyword-ko-real-taxonomy-se-match-karein (class-11, biology, chemistry, wagera), AUR Sprint-ko-"preference-not-exclusion"-banayen (taake-0-match-hone-par-bhi-BAAQI-QUEUE-process-ho, run-WASTE-na-ho).

2. "WASTED-RUN"-ALERT — agar-koi-run-0-save-kare-jabke-queue-khali-nahi-thi, VISIBLE-WARNING-aaye.

3. Stem-length/genre-rule AI-prompt-mein-add-karein (per-subject-limits), PLUS server-side-validator jo-generate-hote-hi-reject-kare agar-limit-cross-ho.

4. Quality-Gate-mein-yehi-check-add-karein taake-EXISTING-371-lambe-stems-FLAG-ho-jayen review-ke-liye.

5. 48-essay-verb-items + 45-lambe-stems ki-LIST-dikhayen, taake-COURT-TESTS-BANNER-SE-PEHLE-REGENERATE-ho-sakein.

&nbsp;

PHASE-2:

6. Unified-Count-RPC + Daily-Generation-Card (dashboard-mein-hamesha-visible-rahe).

7. Mock-Test-dedupe (800-duplicate-groups-clean-karein) + times_used-tracking-WIRE-karein.

8. Difficulty-rebalance — Mock-Tests-mein-Medium-ki-taraf-bias-karein jab-tak-ratio-theek-na-ho.

&nbsp;

Phase-1-ABHI-SHURU-KAREIN — yeh-Larkana-banner-se-pehle-CRITICAL-hai.