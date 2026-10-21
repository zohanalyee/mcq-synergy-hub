# Batch 8.1 — PDF Builder fixes, content safety, Quality Gate stall

Plain summary: the builder will stop guessing the hub, fill everything from the test itself, and throw out broken questions on its own. The Quality Gate gets the same rules and a panel that tells the truth.

## C first — why the Quality Gate stopped (checked in the database today)

What the data shows right now:
- Settings are fine: mode = report, wave = 1, daily cap 300, budget on (quality_gate 100).
- Only NTHP has reviews (30 of 201). The other 10 Wave 1 tests have 0.
- Last run 05:10 UTC today: status "paused", reason "FREE_ONLY_EXHAUSTED: no usable free Gemini key". 3 calls today.

Cause (confirmed from code + data):
1. Every run starts with NTHP again and takes the same 30 waiting questions. It asks the AI first and only saves when the AI finishes. When all free keys are cooling, the first call fails, the run stops, and **nothing is saved** — not even the no-AI checks. So the same 30 are retried forever: "Req 0, Saved 0".
2. The 546 errors (11:00, 13:00 yesterday): one run did 30 questions with up to 6 AI calls in a row plus a large answer-history read. That is too long for one run, so the worker was killed before it could clear its lock or status. That is why the panel kept saying "running".
3. The panel shows only the last status word. It never shows when a review was last saved.

Fix:
- Save the no-AI check result straight away for every question (verdict "pending AI"). AI fills in later. Progress never resets.
- Small runs: 10 questions, at most 2 AI calls, stop after ~60 seconds. Read only the answer history of those 10 questions.
- Rotate across tests (oldest-checked test first) so one stuck test cannot block the rest.
- If no free key is usable: do the no-AI checks only and end cleanly ("waiting for free quota"). No paid fallback, same quality_gate budget of 100.
- Lock expires after 5 minutes, so a killed run cannot leave "running" behind.
- Panel shows: last successful review time, reviews today, last error in plain words, and a red "Stalled" when no review for 6 hours while mode is on.

## A. PDF Builder screen

1. Hub default: no more first-in-list fallback. Default only for a confident match (NTHP, STHP, STS, or the test name containing a hub name). Otherwise empty, and Generate is blocked until the admin picks a hub or "No hub page — use mock test link".
2. Auto-fill on test select (all editable):
   - Clean name: strips "Official", "Mock Test 20xx – …", "Syllabus & … Entry Test Pattern", extra spaces. Title = "<clean name> Free Practice Set – <N> Questions"; updates when count changes, unless the admin typed their own.
   - File name, footer and "Please read first" use the clean name, never the hub.
   - Set number = highest saved set for this test + 1.
   - Mock test link: built from the same rule the public mock-test pages use (`mock_test_slug` in the database). QR and link 1 open that exact page with the same utm tags; the hub becomes a second text link when chosen.
3. Test list: search box; each line "Name · published/draft · 500 Q"; published group first, drafts in a separate group with "Draft — no live page, links will not work yet" warning; names trimmed; duplicate names get the department or created date added.
4. Gate-passed only ON with 0 reviewed: message "The Quality Gate has not checked any question of this test yet."

## B. Content safety (no AI, each rule tested)

The screen shows "Excluded: 12 — same options 3, doubtful explanation 5, duplicate 3, wrong maths answer 1". Questions are never edited or deleted.

5. Options: exclude if not 4 different options (ignoring case/spaces) or an option repeats the whole question.
6. Doubtful/copied explanation: exclude if it contains any phrase on your list (wait, let me, re-evaluate, re-reading, recheck, recalculate, contradicts, question is flawed, assuming the intent, options are not/incorrect, none of the options, not among the options, closest option, the document states, according to the document/passage/text, it states that). "According to the passage" is allowed only when the question itself contains a passage.
7. "Unknown" topic: hidden in the explanations header.
8. Duplicates in one set: same normalised question, or same correct answer + very similar question (word overlap ≥ 80%). Pick and Swap both skip these.
9. Maths check (conservative): only for maths-type questions whose explanation ends with a plain number (like "= 4.25" or "answer is 50"). If that number is not in any option, exclude. Fractions, units and text answers are not judged. This catches Q42 and Q39. It cannot catch Q24 (spreadsheet formula), Q16 (logic puzzle) or Q47 (false fact) — those need the AI Gate or a human.
10. Option letters in explanations ("option C", "(C)"): **remap** to the shuffled letter in the PDF only. If the letter is unclear (for example two letters mentioned), exclude.
11. Rules 5, 6, 8, 9 and 10's "unclear" case also go into the Quality Gate no-AI checks as "needs_review" (checker version 2). Mock tests are not filtered by this yet (mode stays "report").

## D. Unchanged

PDF design/branding, browser-only, lazy loading (public bundle unchanged), no AI in the builder, questions read-only, no title/meta/sitemap changes, NTHP/STHP/STS naming rules.

## Expected result if you regenerate the same JOA set

- Hub empty until you pick one; title "Junior Office Associate (BPS-13) Free Practice Set – 50 Questions"; QR opens the JOA mock test page; no AIR-UNIVERSITY anywhere. The JOA test is draft, so you will see the draft warning.
- Removed automatically: Q10, Q16, Q45, Q46 (explanation phrases), Q39, Q42 (maths), duplicates Q28, Q29, Q31, and Q24 for its identical options A/D. Replaced from the pool.
- Still possible: false facts like Q47 — rule-based checks cannot know facts. The Gate's AI review is the only automatic guard; until it has run, check fact questions by eye.

## Tests to add

- Hub: no confident match = empty; NTHP/STHP/STS defaults.
- Clean name: 3 real test names, incl. " FIA Assistant".
- Next set number; mock-test link + utm.
- Each safety rule 5, 6, 8, 9, 10 (pass case and fail case), using your JOA examples.
- Gate: same rules give needs_review; a run with no free key still saves no-AI results; stalled after 6 hours.

## Technical details

- Files: `src/lib/pdfBuilder/rules.js` (+ .d.ts, tests), `src/lib/pdfBuilder/render.ts` (letter remap, hide Unknown, primary/secondary link), `src/pages/admin/PdfBuilder.tsx`, `supabase/functions/_shared/qualityChecks.ts` (+ tests, CHECKER_VERSION 2), `supabase/functions/quality-gate/index.ts`, `src/components/admin/job-test/QualityGatePanel.tsx`.
- Shared rule text lives in one plain JS module copied into the edge helper (tests guard both copies stay equal).
- Migration: add `last_success_at`, `last_error`, `last_error_at` to `quality_job_runs`; allow `ai_verdict = 'pending'` rows to be stored. No change to questions or student tables.
- Mock-test link uses the existing `mock_test_slug` database function; verify it during build against 3 live URLs.
- Risk: rule 6 may drop some fine questions (~154 of 24,669); counts are visible on screen.
- Rollback: Gate stays in report mode; builder rules are local to the admin page.
