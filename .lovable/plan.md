# Authentication & Gamification System — Phased Plan

The spec is large. To keep each step shippable and testable, I propose splitting it into 4 phases. Phase 1 + 2 deliver the highest-value UX (credit limits + conversion modals). Phase 3 + 4 add the job-test progression loop.

---

## Phase 1 — Daily AI Credit System (foundation)

**Database migration** (new):

- `user_credits` table: `user_id` (UNIQUE FK to auth.users), `credits_remaining INT DEFAULT 100`, `credits_used_today INT`, `last_reset_date DATE`, `total_credits_used INT`. RLS: user can `SELECT` own row; only edge functions (service role) can `UPDATE`.
- Trigger on `auth.users` insert → seed a `user_credits` row.
- RPC `deduct_credits(user_id, amount)` — auto-resets if `last_reset_date < today`, then deducts and returns `{ remaining, used_today }`. SECURITY DEFINER.
- RPC `get_my_credits()` — returns caller's row (with auto-reset side effect).

**Frontend**:

- New `src/hooks/useUserCredits.ts` — reads credits via RPC, exposes `{ remaining, used, loading, refresh }`. Auto-refresh after every test/quiz finish event.
- New `src/components/credits/CreditMeter.tsx` — small chip in Header (visible only to logged-in users): "AI: 75/100".
- New `src/components/credits/CreditExhaustedDialog.tsx` — modal shown when `remaining === 0` AND user attempts an AI-gen action; copy from spec ("Daily AI Limit Reached", "Thousands of curated questions available", "Resets at midnight").
- Toast notifications in `useUserCredits` when crossing 25-used / 75-used thresholds (sonner, throttled by localStorage so only fires once per day).

**Edge function** `generate-test`:

- Before invoking Gemini for "fill-the-gap" AI generation, if `triggered_by_user_id` present, call `deduct_credits(user_id, missingCount)`. If response `remaining < missingCount` (insufficient), skip AI and return DB-only questions plus `meta.credits_exhausted = true`. Frontend reads that flag to show the dialog.
- DB-only fetch path stays untouched (no credit cost).

**Homepage banner** (`src/pages/Index.tsx`):

- Add a dismissible "Exciting Update Coming Soon" banner above hero. Stored dismiss state in `localStorage`.

---

## Phase 2 — Page-by-page auth gating with positive modals

**A. School Attendance landing dialog** (`src/pages/tools/AttendanceDashboard.tsx`)  
The route is already public. Right now it renders a marketing view for guests. Add: when guest clicks any "Setup Institute" / "Manage Students" / "Open Module" CTA, open `AttendanceAuthDialog` (new component) using exact copy from spec ("Login Required" + 4 benefits). Buttons → save intent → `/auth`. Browse stays public for SEO.

**B. Quiz result auth gate** (`src/pages/QuizPlayer.tsx` + new `QuizSignInGate.tsx`)

- Allow guests to actually take the quiz (today the page is wrapped in `InstantAuthGuard` in `App.tsx` — remove that guard for `/quiz-session/:id` so guests can play).
- Persist guest session in `sessionStorage` instead of `custom_test_sessions` (which requires `user_id`). Update `Quizzes.tsx` `startQuiz` to branch: logged-in → DB session as today; guest → sessionStorage session, navigate to `/quiz-session/guest-<uuid>`.
- On submit while `!user`: instead of `QuizResultScreen`, render `QuizSignInGate` modal with the spec's copy ("Great Job!", 6 benefits, "Basic Score Only" reveals `Score: X/N`, "Sign In Free" saves intent and navigates).

**C. Subject pages and Custom Syllabus**  
Apply same gating pattern. Subject browse already public. The "Generate Test" / "Start Test" buttons in `SubjectContent.tsx` and `CustomSyllabus.tsx` get the same `QuizSignInGate` modal when `!user`. Logged-in benefit text on Custom Syllabus mentions "Save up to 10 syllabi" (cosmetic only this phase — actual save-cap enforcement deferred).

**D. Header copy sweep**  
Search & replace user-facing strings that violate the language rules ("Database", exact question counts like "6,439", "credits exhausted") in `src/pages/Index.tsx`, `Subjects.tsx`, marketing components → use approved phrases ("thousands of practice questions", "AI questions", "Daily AI limit reached").

---

## Phase 3 — Job Test Progressive Unlock

**Database migration** (new):

- `job_test_progress` table per spec: `user_id` nullable, `ip_address INET` nullable, `job_test_id`, `questions_unlocked INT DEFAULT 100`, `total_attempts`, `best_score`, `weak_topics JSONB`. Two partial UNIQUE indexes: `(user_id, job_test_id)` where user_id IS NOT NULL; `(ip_address, job_test_id)` where user_id IS NULL.
- RPC `update_job_test_progress(...)` per spec, returning `{ unlocked, unlocked_delta, qualified }`.
- RLS: anon can `SELECT/INSERT` rows where `user_id IS NULL` (matched on ip — actually IP comes from edge function header, so all writes go through RPC/edge function with service role). Authenticated users can read own rows.

**Frontend** `src/pages/MockTests.tsx` **(and JobTest player)**:

- Before starting: fetch progress via new edge function `job-test-progress` (returns IP-bound or user-bound row). Show "Preview Mode" alert for guests, or "Today's Practice — Available: N" card for logged-in users.
- After completion: call edge function which executes RPC. Show `JobTestRewardDialog` (≥80%) or `JobTestKeepGoingDialog` (<80%) per spec, including weak-area list.

**Edge function** `job-test-progress` (new):

- GET → returns the calling user's/IP's progress row, creating with defaults if missing.
- POST → validates payload, calls `update_job_test_progress` with `req.headers.get('x-forwarded-for')` for guests.

---

## Phase 4 — Weak-area targeting (deferred / lighter)

- Extend `generate-test` to accept `weak_topics: string[]` and `mix_ratio: 0.5`. When provided, fetch 50% of questions filtered by these topic strings (canonical_topic_name match), 50% from rest of subject. Falls back gracefully if not enough weak-area questions exist.
- `MockTests` next-day fetch passes `weak_topics` from `job_test_progress.weak_topics`.

This phase is small but depends on Phase 3 data, so it ships last.

---

## Technical notes

- **Credits coverage**: only Mock Tests, Custom Syllabus AI fill-the-gap, and Job Test AI generation deduct credits. Pure DB-cached fetches remain free.
- **IP detection in edge functions**: use `req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()`. Stored as `INET`.
- **Intent preservation**: continue using existing `useAuthIntent` (`saveIntentRaw`) so post-login users land back on the quiz/tool they were using.
- **No backend stores secrets in DB**. All RPCs are SECURITY DEFINER with `SET search_path = public`.
- **No new types.ts edits** — Supabase regenerates after migration.

---

## Files touched (summary)

New:

- `supabase/migrations/*_user_credits.sql`, `*_job_test_progress.sql`
- `supabase/functions/job-test-progress/index.ts`
- `src/hooks/useUserCredits.ts`
- `src/components/credits/CreditMeter.tsx`, `CreditExhaustedDialog.tsx`
- `src/components/quiz/QuizSignInGate.tsx`
- `src/components/tools/AttendanceAuthDialog.tsx`
- `src/components/jobs/JobTestRewardDialog.tsx`, `JobTestKeepGoingDialog.tsx`
- `src/components/home/UpcomingFreeBanner.tsx`

Edited:

- `src/App.tsx` (remove `InstantAuthGuard` from `/quiz-session/:id`; keep `/test-session/:id` as is or apply same — to confirm)
- `src/pages/Quizzes.tsx`, `QuizPlayer.tsx`, `MockTests.tsx`, `CustomSyllabus.tsx`, `SubjectContent.tsx`, `Index.tsx`, `tools/AttendanceDashboard.tsx`
- `supabase/functions/generate-test/index.ts` (credit deduction + `credits_exhausted` flag)
- `src/components/Header.tsx` (mount `CreditMeter`)

---

## Confirm before I implement

1. Ship all 4 phases in this single approval, or only Phase 1+2 first and review before Phase 3+4?
2. For `/test-session/:id` (Mock Test player) — should guests also be allowed to play and hit the sign-in wall on submit (parity with quizzes), or keep it logged-in-only as today?
3. Daily limit confirmed at **100** AI questions/user/day (spec says 100; existing system uses a global 1400/day server cap — these stack: per-user soft cap + global hard cap). 

APPROVE PHASE 1+2 FIRST

&nbsp;

Answer to Lovable's questions:

&nbsp;

Q1: Ship all 4 phases or Phase 1+2 first?

A: Phase 1+2 first. Test in production, then Phase 3+4.

&nbsp;

Q2: Allow guests on /test-session like /quiz-session?

A: Yes, make it consistent. Same auth gate pattern everywhere.

&nbsp;

Q3: 100 per-user + 1400 global cap?

A: Yes, both limits stack. Per-user soft, server hard cap.

&nbsp;

Additional notes:

- SEO fix already working, monitoring Google indexing

- Phase 1+2 covers highest-value UX (conversion modals)

- Phase 3+4 can wait 1-2 weeks for user feedback

- All user-facing language must follow positive terminology rules

- No "DB", no exact counts, no technical jargon

&nbsp;

Proceed with Phase 1+2 implementation.