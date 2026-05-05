# Fix Guest Experience: Quiz Fetch + Unified Result Gate + Minimal UI

## Goal
Guests should: (1) be able to start any quiz/test from cached DB content without errors, (2) see a single, friendly bilingual sign-in gate after completion (never the full premium result screen), (3) see a minimal options UI with no AI/credit/save controls.

## Files to change

### 1. `src/pages/Quizzes.tsx` — fix guest fetch + minimal UI
- **Bug fix in `fetchGuestQuestionsFromDB`**: the current implementation chains `.not('correct_option', 'is', null)` on `content_items`. In the actual schema correct answers may live in `correct_option` OR inside the `options` JSON (`isCorrect` / `correctIndex`) — so valid rows get filtered out and the function returns `[]`, producing the false "No cached questions" toast.
  - Remove the strict `.not('correct_option', 'is', null)` filter. Keep only `status='approved'`, `question is not null`, and (for topic quiz) `topic_id`.
  - For subject quiz keep the 4-tier fallback (topic_id → canonical_topic_name → subject ilike → topic name) but with the same relaxed filter.
  - After fetch, run rows through `normalizeQuestion` from `@/lib/testEvaluation` and drop any whose `resolveCorrectAnswer` returns empty. This filters in code where the resolver actually understands every storage shape.
- **Toast wording**: when truly empty, show bilingual message with Sign-In action (preserve `saveIntentRaw`).
- **Hide for guests** (wrap in `{user && ...}`):
  - "Generate with AI" / `fetchOnly` toggle and credits text.
  - Time limit slider (default to 15 min silently).
  - Question-count slider — replace with a simple `Select` of `[10, 20]` for guests; keep slider 10–50 for users.
- Add a small bilingual hint under guest forms: "📚 موجودہ سوالات سے مشق کریں / Practice with available questions".

### 2. `src/components/quiz/GuestResultGate.tsx` — NEW unified gate
Replace the existing `QuizSignInGate` with a richer component used everywhere:
- Props: `open, onClose, score, total, correctCount, returnPath`.
- Bilingual (Urdu + English) headline, big percentage, 5 benefits list (explanations, progress tracking, weak-area AI analysis, 100 AI Q/day, AI Coach dashboard).
- Two buttons: "دوبارہ کوشش / Try Again" (calls `onClose` → navigates to `returnPath`) and "مفت سائن ان / Sign In Free" (calls `saveIntentRaw({ action, path, data:{score,total,correctCount} })` then `navigate('/auth')`).
- Trust badge line: "🔒 آپ کا ڈیٹا محفوظ ہے / Your data is safe & secure".
- Pure Tailwind/shadcn Dialog — no inline styles.

### 3. `src/pages/QuizPlayer.tsx` — use GuestResultGate
- Replace `QuizSignInGate` import with `GuestResultGate` and pass `correctCount`, `total`, `score`, `returnPath`. Remove the old basic-score branch.

### 4. `src/pages/TestSession.tsx` — gate guest results
- After test submission/finish, if `!user` render `GuestResultGate` (with computed `correctCount`/`total`) instead of the full `TestResults`/analytics view. Keep guest progress recording (already wired via `recordJobTestProgress` with `is_guest:true`).
- Keep existing guest sessionStorage loader (`mcqsai_guest_*`) — already implemented; verify it runs before any DB fetch and shows a clean "Session expired" toast with redirect when the key is missing.

### 5. `src/components/mock-tests/JobTestsTab.tsx` — minimal guest dialog
- In the test-settings dialog, when `!user`: show only a native `<select>` of `[10, 20]` and a single Start button (bilingual). Hide difficulty, time limit, unlocked-progress info, reward dialogs preview, and any AI-cost text.
- Logged-in branch unchanged.

### 6. `src/components/mock-tests/SubjectTestsTab.tsx` — minimal guest dialog
- Same minimal pattern as JobTestsTab for guests: only question-count `[10,20]`, single Start button, bilingual hint.
- Confirm guest path stays sessionStorage-only (no `generate-test` invoke) — already implemented; do not regress.

### 7. `src/pages/CustomSyllabus.tsx` / `src/components/syllabus-builder/SyllabusBuilder.tsx`
- Hide for guests: "Save Syllabus" button, AI/fetch-only toggle, difficulty advanced controls, per-subject sliders above 20.
- Cap question count selector at `[10, 20]` for guests.
- After completion (TestSession handles render), gate is automatically applied via fix #4.

### 8. Remove dead code
- Delete `src/components/quiz/QuizSignInGate.tsx` (superseded by `GuestResultGate`). Update any other imports if grep finds them.

## Out of scope
- No DB migrations. No edge function changes. No new RLS. No changes to logged-in flows beyond removing the duplicate sign-in modal.
- No changes to credit accounting — guests never call edge functions in any of these paths.

## Acceptance (test as guest in incognito)
1. `/quizzes`: pick subject → Start → questions load (no false "No cached" toast). Finish → `GuestResultGate` appears (bilingual). Sign In Free preserves intent.
2. `/quizzes` UI: no AI toggle, no credits text, no time slider, only 10/20 count.
3. `/mock-tests` Job Tests: minimal start dialog → Start → finish → `GuestResultGate`.
4. `/mock-tests` Subject Tests: same minimal flow, no edge function call (verify Network tab — no `generate-test` request).
5. `/custom-syllabus`: no Save button, no AI toggle, only 10/20 count, finish → `GuestResultGate`.
6. Logged-in users: zero regressions — full controls, full result screens, AI generation, analytics intact.
