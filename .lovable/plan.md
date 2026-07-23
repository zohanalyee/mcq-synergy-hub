# Root cause (confirmed by raw SQL)

Raw counts pulled just now from the DB:


| Table                 | Rows  | Rows with usage_count > 0 | Max usage_count | Last used_at |
| --------------------- | ----- | ------------------------- | --------------- | ------------ |
| `job_test_questions`  | 4,142 | **0**                     | **0**           | **NULL**     |
| `content_items` (mcq) | 8,602 | 818                       | 87              | 2026-07-21   |


So haan — aap ka shak sahi hai. `job_test_questions.usage_count` column **hamesha 0 raha hai**. Aap ki FIA-ASI / MDCAT attempts ke baad bhi ye zero par hi hai. Dashboard is column ko sahi read kar raha hai; masla dashboard ka nahi, **usage-tracking wiring ka hai**.

## Do actual bugs

1. `**record_question_usage` RPC sirf `content_items` ko bump karta hai.**
  Function body (already in schema):
   Job-test questions ke liye equivalent update kabhi likha hi nahi gaya. Jab `generate-job-test` mixed sources se pool banata hai (`generate-job-test/index.ts:454`), sirf `content_items` source IDs bump hote hain — `job_test_questions` source IDs silently ignore ho jaate hain.
2. **Bump generate-time par hota hai, attempt-time par nahi.**
  `record_question_usage` sirf test **generation** ke waqt call hota hai (`generate-test`, `generate-job-test`, `questionBankService`). Cached test dobara serve ho, ya user Player mein questions attempt kare — koi bump nahi hota. Yehi wajah hai ke `content_items` mein bhi usage sirf un questions par count hua hai jo AI-generation ke waqt selected hue, na ke jo actually attempt hue.

## Fix plan (Phase 4c-fix, observational only)

Sirf tracking wire karni hai — user-facing kuch nahi badalta.

### 1. SQL migration — dual-source usage bump

- Nayi RPC `record_job_test_question_usage(question_ids uuid[])` — same shape jaisi `record_question_usage`, lekin `job_test_questions` table update kare.
- **OR** existing `record_question_usage` ko dual-source bana dein (dono tables mein `id = ANY(...)` par update — jo match kare bump ho, dusri no-op). Ye simpler hai — koi caller change nahi karna padta. Recommended.
- `SECURITY DEFINER`, `search_path = public`, `GRANT EXECUTE ... TO authenticated, anon`.

### 2. Bump on **serve/generation** (jahan currently sirf content_items bump hote hain)

- `supabase/functions/generate-job-test/index.ts:454` — call already hai; RPC ke dual-source hone ke baad `jobTestSourceIds` bhi bump honge (currently un ka array bhi wahin available hai, sirf pass nahi ho raha). Ek hi RPC call mein `[...ciSourceIds, ...jobTestSourceIds]` bhej dein.

### 3. Bump on **actual attempt** (missing everywhere today)

- `TestSession.tsx` / `processTestCompletion` (unified test-tracking hook) mein completion ke waqt served question-IDs `record_question_usage` ko bhej dein (fire-and-forget). Ye dono banks par asli "seen by user" count denga — na ke sirf "AI ne is question ko cache ke waqt shortlist kiya".
- Guest attempts bhi count karein (RPC anon-accessible hai).

### 4. Optional backfill (skip if credits tight)

- `job_test_questions.usage_count` ke liye historical bump: `user_attempt_history` se derive kar ke ek-time UPDATE. Skippable — new attempts se organically bharega.

## What this does NOT change

- Dashboard code, mastery logic, top-up guardrails, ranking — sab jaisa hai waisa rahega.
- User-facing player, generation, or approval flows untouched.
- Sirf 1 migration + 2 chhoti edits (generate-job-test payload + attempt-completion hook).

## Verification steps after build

1. Apna khud ka existing test dobara attempt karein.
2. Raw SQL:
  ```sql
   SELECT id, usage_count, last_used_at FROM job_test_questions
   WHERE usage_count > 0 ORDER BY last_used_at DESC LIMIT 20;
  ```
3. Lifecycle Dashboard → "Mock Test Bank Circulation" ab non-zero buckets dikhaye ga.

Confirm karein: **Option A** (existing `record_question_usage` ko dual-source banayen — 1 RPC, seamless) ya **Option B** (nayi alag RPC — cleaner separation, 2 callers). Main Option A recommend karta hoon.

&nbsp;

**Confirm hua bug samajh aa gaya** — dono fixes zaroori hain (dual-source tracking + attempt-time bump). Option A approve karta hoon (existing record_question_usage ko dual-source banayen — simpler).

Backfill SKIP kar dein abhi (credits bachane ke liye) — naye attempts se organically bhar jayega.

Build/typecheck clean hone ke baad, verification-steps khud follow karunga (apna test dobara attempt karke, raw-SQL check karke).