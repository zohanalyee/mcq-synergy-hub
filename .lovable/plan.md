# Batch 8.2 — PDF Builder fixes, AI check, QR start, crash safety

Plain summary: fix exam detection, the draft warning, the footer, option shuffling for "All of the above", repeated topics, a stricter AI check, a QR that starts the test, a smoother phone picker, and stop one missing file from crashing a page.

## What I found (checked in code)
- The builder decides STS/NTHP/STHP from the test **title only**. The public page decides it from the **organization + title** of the `job_tests` row.
- The draft warning uses the definition's "draft" status. The public site publishes `/mock-tests/{slug}` for **every** `job_tests` row, whatever its status, so the warning is wrong.
- Section names are joined with " & " on the cover and in "Please read first".
- The AI check asks only for "the single best option". It never asks whether more than one option is correct, or whether the key and explanation agree.
- Cookie banner, WhatsApp button, widgets etc. are lazy-loaded with no fallback. If their file is missing, the whole page shows the error screen.
- Old files in `/assets/` are cached for a year. Whether old files stay on the server after a publish depends on Lovable hosting and Cloudflare. I can't see that from code, so I will test it, not assume it.

## Fixes
1. **Exam identity**: find the linked `job_tests` row and use the shared site rule on organization + title (the same check the public page uses). That sets the disclaimer, the default hub (sts/nthp/sthp) and the announcement site (sts.net.pk, iba.edu.pk, iba-suk.edu.pk). The title is the fallback. NTHP never mentions STS.
2. **Draft warning**: show it only when no `job_tests` row exists for the test, so no public page exists.
3. **Footer**: shorten the title with "…" so "· mcqsai.com" and the page number always fit. Join section names with " · " instead of " & ".
4. **All/None of the above**: if any option is "all/none of the above", "both A and B", "A and C" and so on, the options keep their original order. Those fixed questions count first. The other questions are shuffled to balance the A–D letters.
5. **Repeats in one set**: at most 2 questions per known topic in a set. Two questions also count as duplicates if they have the same correct-answer text and share a key word (a word of 5+ letters that isn't a common word). Spare questions fill the gaps. The screen shows "Excluded: topic cap X, duplicates Y". No AI.
6. **AI check (Quality Gate)**: the prompt now asks, for each question:
   - how many options are correct
   - your answer
   - does the key match?
   - does the explanation agree with the key?
   The result is **needs_review** if more than one option is correct, the key differs, or the explanation disagrees. The reason is saved (`multiple_correct`, `key_mismatch`, `explanation_disagrees`). Free keys only, existing budget, mode stays "report".
   **Check on the 40-question calibration set**: compare old and new verdicts. Your examples (Q1, Q3, Q9, Q10, Q13, Q35) should come back needs_review, and questions that passed before should mostly still pass. I report both counts before anything turns on.
7. **QR starts the test**: `/mock-tests/{slug}?start=1&utm_…`. A real visitor goes straight into the test. If sign-in is needed, they sign in and come back to the same test. Bots and prerendered pages never auto-start. The canonical link stays without the extra part, and the page title, text and indexing don't change. PDF link 1 and the QR use it.
8. **Phone picker**: reproduce at 390px first and report what I find. Then: a search box that filters the test list as you type, a short "Loading…" after you pick, and hub/title/link filled in at once with nothing left over from the last test. Changing the hub changes only the hub-based links.
9. **Crash safety (public site)**:
   - (a) Cookie banner, ads, notifications, WhatsApp and floating widgets are skipped silently if their file fails to load.
   - (b) Key page parts reload once (with a guard so it can't loop) before any error screen. The error screen also gets one guarded reload for "Failed to fetch dynamically imported module".
   - (c) Right after the next publish, I request an old file name and the homepage HTML headers, then report whether old files stay available and how long HTML is cached. If HTML can point to removed files, I explain the Cloudflare setting you can change yourself. No changes I can't verify.

## Tests to add
- Exam identity from organization: STS, NTHP, STHP, generic. Admission & Examination Officer → sts.
- Draft warning shows only when there is no public test.
- "All of the above", "both A and B" and so on keep their order. Letters stay balanced.
- Topic cap of 2 per set, and the answer-text + key-word duplicate rule.
- AI verdict: multiple correct, key mismatch or explanation disagrees → needs_review.
- `?start=1`: no auto-start for bots, and the canonical has no extra part.
- A widget whose file fails to load renders nothing and doesn't crash.

## If you regenerate the same 200-question set
STS disclaimer, hub = sts, announcement site sts.net.pk, no draft warning, full footer, " · " joins, Q24-type questions in their original order, at most 2 per topic, and the extra excluded counts shown. The AI problems only drop out after the Gate re-checks those questions.

## Unchanged
PDF design, builder runs in the browser, questions read-only, titles/meta/sitemaps unchanged, NTHP/STHP/STS naming rules, mode "report", hide switch locked, no new libraries, public bundle about the same size.

## Technical details
- Files: `src/lib/pdfBuilder/rules.js` (+d.ts, tests), `src/lib/pdfBuilder/render.ts`, `src/pages/admin/PdfBuilder.tsx`, `src/lib/contentSafety.js` + byte-identical `_shared` copy, `supabase/functions/quality-gate/index.ts`, `_shared/qualityChecks.ts` (+tests), `src/pages/MockTestDetail.tsx` (start param), `src/components/DeferredGlobals.tsx` (a `safeLazy` that falls back to a null component), `src/routes/lazyWithReload.ts`, `src/components/GlobalErrorBoundary.tsx`.
- Bump CHECKER_VERSION so old AI verdicts are re-checked under the new prompt. Carry-over is skipped for that version, which costs free calls from the quality_gate budget only.
- No database migration expected.
