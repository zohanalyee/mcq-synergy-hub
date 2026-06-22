## Findings from the code

### Broken flow 1: Mock Test guest start

- `src/components/mock-tests/JobTestsTab.tsx` has two paths:
  - Published `job_test_definitions` path already uses `getApprovedQuestionsForDefinition()`, which calls `get_job_practice_questions` for guests and strips `correct_answer`/`explanation`.
  - Legacy/no-definition path explicitly blocks guests before fetching questions: lines 185-197 show a guest sign-in/“questions are being prepared” stop instead of using the bank.
- Fix: for guests in the legacy path, fetch DB-bank questions through `getQuestionBank()` / `generateCustomTest()` which now uses `get_practice_questions` for anonymous users, then create a guest `sessionStorage` session with answer-free questions.

### Broken flow 2: Custom Syllabus Builder guest start

- `src/components/syllabus-builder/SyllabusBuilder.tsx` guest path calls `getQuestionsWithFallbackInfo()`.
- `src/services/syllabusRAGFallback.ts` still directly selects `content_items` and includes `correct_option`/`explanation` in rows at lines 140-225 and 342-363.
- Fix: add a guest/anonymous branch in `getQuestionsWithFallbackInfo()` that uses the secure `get_practice_questions` RPC with topic IDs, topic names, difficulty fallback, and subject fallback. It will return no correct answer or explanation until server-side scoring.

## Current guest limitations found in code

### Quiz (`/quizzes`)

- **Questions per session:** guests can choose **10 or 20** only. Logged-in users can use 5-50 sliders.
- **Daily cap:** no code-enforced guest daily cap found.
- **Subjects/topics:** guests can select available LMS subjects and topics; no subject whitelist found beyond what the selectors expose.
- **AI fill:** not available to guests. Guest path uses `loadGuestQuestions()` only; no `generate-test` edge function call.
- **Progress/analytics:** not saved for guests. `processTestCompletion()` returns early when no user.
- **Results:** `QuizPlayer` reveals correctness per question via `scorePracticeAnswers()` after selection, then shows `GuestResultGate` at the end.

### Subject practice (`/subject...` / `SubjectContent.tsx`)

- **Questions per session:** guests are capped at **20**: `Math.min(parseInt(questionCount) || 10, 20)`.
- **Subjects/topics:** first topic only is free through `GuestTopicsGate`; other topics open sign-in gate.
- **Difficulty:** guest controls hide difficulty; `loadGuestQuestions()` does not pass difficulty.
- **AI fill:** not available to guests. “Generate New” opens the sign-in gate.
- **Progress/analytics:** not saved for guests; `handleCardAnswered()` returns immediately when no user.
- **Correctness/explanation:** guest cards use secure server scoring and batch-prefetched answers after question load.

### Mock Test (`/mock-tests`)

- **Questions per session:** default guest start uses up to 20; detail modal exposes **10, 20, 50, 100**. Existing progressive unlock cap is fetched from `job-test-progress`, defaulting to **100 unlocked**.
- **Progressive unlock:** guest job-test progress is tracked by IP in the `job-test-progress` edge function. Scores >=80% unlock +25, capped at 500.
- **Subjects/topics:** governed by the selected mock test syllabus/definition.
- **AI fill:** not available to guests in current code; legacy path currently blocks guests instead of AI-generating.
- **Progress/analytics:** regular analytics/gamification require login, but job-test unlock progress is recorded for guests by IP.
- **Results:** `TestSession` uses server-side scoring on submit for answer-free questions; guests then see `GuestResultGate`, not the full authenticated answer-review screen.

### Custom Syllabus Builder (`/custom-syllabus`)

- **Questions per session:** UI slider allows **5-100** questions.
- **Subjects/topics:** guests can select up to **10 subjects** (`MAX_SUBJECTS = 10`) and any exposed topics from the builder.
- **Difficulty/time:** guests can currently set difficulty and **5-120 min** time limit in the floating action bar.
- **AI fill:** not available to guests. Guest path only uses bank questions and does not call `generate-test`.
- **Templates/bookmarks:** saving templates is disabled for guests with “Sign in to save your syllabus”.
- **Progress/analytics:** session is stored only in `sessionStorage`; completion saving/gamification skips guests.
- **Results:** `TestSession` server-scores answer-free questions on submit, then shows `GuestResultGate` for guests.

## Implementation plan

1. **Restore Mock Test guest legacy fallback**
  - In `JobTestsTab.tsx`, keep the published-definition path unchanged.
  - Replace the legacy guest hard-stop with a DB-bank fallback using the existing `generateCustomTest()` / `getQuestionBank()` path, which calls `get_practice_questions` for guests.
  - Preserve the existing requested question count and `job-test-progress` unlocked cap.
  - Store only answer-free questions in the guest session.
2. **Secure Custom Syllabus guest fetching**
  - In `syllabusRAGFallback.ts`, add an anonymous branch in `getQuestionsWithFallbackInfo()`.
  - Fetch by selected `topic_id` through `get_practice_questions(p_topic_ids)`.
  - Preserve current fallback behavior: retry without difficulty, then by topic name, then subject-wide fallback.
  - Return `correctOption: null` and `explanation: null` for guest-loaded questions.
3. **Ensure server-side scoring works for both flows**
  - Keep using `scorePracticeAnswers()` in `TestSession`; it already tries `score_practice_answers` first, then `score_job_practice_answers` for job-test question IDs.
  - Ensure generated guest sessions contain UUID question IDs and no baked-in answer fields, so `TestSession` triggers server-side scoring at submit.
4. **Validate as anonymous/incognito**
  - Run browser checks without restored auth session:
    - Mock Test: open a test, start as guest, confirm questions load, answer, submit, and see result gate.
    - Custom Syllabus: select topics, generate as guest, confirm questions load, answer, submit, and see result gate.
  - Inspect network/API payload shape where practical to confirm no `correct_option`, `correct_answer`, or `explanation` is returned during fetch.
5. **Publish after validation**
  - After the fix is verified, publish the app as requested.

&nbsp;

# **Approved — proceed with the implementation plan exactly as outlined:**

1. Mock Test legacy guest fallback via getQuestionBank()/

   generateCustomTest() — preserve existing question count and 

   job-test-progress unlock cap

2. Custom Syllabus anonymous branch in getQuestionsWithFallbackInfo() 

   using get_practice_questions with the existing fallback chain 

   (difficulty → topic name → subject-wide)

3. Confirm server-side scoring works for both via scorePracticeAnswers()

4. Validate as incognito — test both flows end-to-end, inspect 

   network payloads to confirm no correct_option/explanation leaks

5. Publish after validation

This preserves all existing guest limitations (question caps, 

subject restrictions, no AI-fill, no progress saving) exactly as 

documented — just fixing the data-fetching mechanism to use the 

secure RPCs.

Please confirm once validated and published.