

# Hotfix — CorruptedDataCleaner Subject Matching

## Problem
Targeted scan misses real DB subjects like "Fundamentals of Computer", "Computer Programming", "Main Parts of a Computer". Filter is too narrow ("ms office", "general knowledge") and validator requires `\bcomputer\b` word boundary plus "ms office", so 0 rows are flagged.

Additionally, the current keyword set treats hardware (CPU/RAM/motherboard) as VALID for any "Computer" subject as long as it lacks MS-Office keywords — but the user's intent is to also flag generic hardware drift in pure "Computer" subjects. We'll widen the rule for non-MS-Office computer subjects: hardware questions are allowed only when the subject explicitly mentions hardware/parts; otherwise they're flagged together with science.

## Changes

**File:** `src/components/admin/CorruptedDataCleaner.tsx`

1. **Targeted query (`queryFn`)** — broaden filter:
   ```ts
   .or(
     "subject.ilike.%computer%,topic.ilike.%computer%," +
     "subject.ilike.%general knowledge%,topic.ilike.%general knowledge%," +
     "subject.ilike.%gk%,topic.ilike.%gk%"
   )
   ```
   Keeps GK coverage; adds every Computer-* subject.

2. **`getTopicMismatchReasons()`** — relax subject detection + tighten content rules:
   - Trigger Computer-branch when `subject.includes("computer")` (drop `\bcomputer\b` and "ms office" gate).
   - Within the Computer branch:
     - Always reject SCIENCE keywords → reason "Science content in Computer".
     - If subject mentions "hardware" / "parts" / "components" / "architecture" → allow hardware terms.
     - Else reject HARDWARE keywords when no MS-Office keyword present → reason "Hardware content in Computer".
   - GK branch unchanged (already broad enough).

3. **Reason labels** stay short so existing badge UI fits.

## Out of scope
- Edge function prompt changes (already shipped previous turn).
- New routes or UI surfaces.
- Schema changes.

## Verification path
After deploy: open Admin → Corrupted MCQ Cleanup → "Scan Again". Expect non-zero count covering Fundamentals of Computer / Computer Programming rows that contain Science or generic hardware content. "Clean All" purges them; next test generation hits cache miss and uses the validated edge-function path.

