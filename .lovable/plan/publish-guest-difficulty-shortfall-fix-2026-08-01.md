# Publish + Guest Difficulty Shortfall Fix

## 1. Publish (Phase 3C)

Run a security scan check, then publish the current build to the live URL.

## 2. Guest difficulty bug — investigate, then fix

Reported: as a guest, asking for Easy × 10 returns 3 questions, Medium × 20 returns 5.

### What is already confirmed (read-only checks)

- The guest read path is the `get_practice_questions` RPC (guests never touch `content_items` directly). The RPC does apply the difficulty filter correctly (`ci.difficulty = ANY(p_difficulties)`), so the filter itself is not broken.
- The approved MCQ bank is heavily skewed: Medium 4,664 / Easy 1,673 / Hard 1,057 and **1,118 rows with `difficulty = NULL**`. NULL-difficulty rows are silently excluded from every Easy/Medium/Hard request.
- Per subject the Easy pools are thin or empty (e.g. Land and Climate of Pakistan: 200 total, 0 Easy; Physics: 563 total, 86 Easy, 144 NULL).
- `generateCustomTest` has a difficulty-relaxation fallback, but it only widens on the *same* subject/topic filters, and it is not applied in the per-subject-quota paths (`fetchSubjectQuota` keeps the strict difficulty filter with no relaxation).

### Not yet confirmed

Which exact launcher the user hit (Quick Test dialog vs Mock Test card) and whether the shortfall is pure pool scarcity or the fallback failing to run on the guest path. So step 1 is measurement, not a guess.

### Step 1 — Reproduce with instrumentation (no code changes shipped yet)

Drive the guest flow headlessly against the local preview (Easy × 10 and Medium × 20), capture the existing `📊 Strict filter` / `🔄 Fallback` console lines, and record exactly where the count stops growing. This pins the cause to one of: (a) pool scarcity, (b) fallback not reached, (c) subject-name mismatch.

### Step 2 — Fix (scoped to what step 1 shows)

Expected shape of the fix, all inside the existing generation service:

- Treat `difficulty IS NULL` rows as eligible filler when the requested difficulty pool is short, instead of dropping them.
- Apply the same relaxation ladder in `fetchSubjectQuota` that the flat path already has (strict difficulty → any difficulty → subject-only).
- Guarantee the ladder keeps widening until the requested count is met or the subject pool is genuinely exhausted.

### Step 3 — Honest UI signal

When the bank truly cannot fill the request, tell the guest instead of silently shrinking: "Starting with 7 of 10 — only 7 Easy questions available for this subject." Existing sonner toast, no new component.

### Out of scope

No AI generation for guests (guests stay DB-only, zero credits). No schema change, no backfill of NULL difficulties in this pass.

## 3. Paused

Phase 3D and Batch 4 stay paused until next month's credits.

## Technical notes

- Files touched: `src/services/testGenerationService.ts` (relaxation ladder), plus the calling launcher (`src/components/quick-test/useStartQuickTest.ts` and/or `src/components/mock-tests/SubjectTestsTab.tsx`) for the shortfall toast.
- No edge function, no migration, no RPC change — keeps credit cost minimal.

Plan approved:

&nbsp;

1. Publish (Phase 3C) — abhi kar dein

2. Guest-difficulty-fix — Step 1 (measurement/confirm) se shuru karein, phir Step 2 (fix) aur Step 3 (honest-UI-toast)

&nbsp;

Scope confirm — koi AI-generation guest ke liye nahi, koi schema-change nahi, credit-cost-minimal. Proceed karein.

&nbsp;

Phase 3D aur Batch 4 pause rahenge naye-mahine-tak, jaisa decide kiya tha.