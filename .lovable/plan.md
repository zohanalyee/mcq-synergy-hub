## The bug

Job Test results show **0% / every answer wrong / "Correct:" blank** (visible in your screenshots) even when the user picked the right option.

## Root cause (one line)

`src/lib/testEvaluation.ts → resolveCorrectAnswer()` reads the answer key from these fields only:

```
question.answer  ||  question.correct_option  ||  question.correctOption
```

But the `job_test_questions` table — and the payload `JobTestsTab` writes into `custom_test_sessions.questions` — uses **`correct_answer`** (snake_case). That field is never checked, so:

- `resolveCorrectAnswer(q)` returns `''`
- Grading: `userAnswer === ''` → always **false** → score 0%
- Review UI: `<span>Correct:</span> {correctText}` renders blank

This same helper is used by `TestSession.tsx` for both grading (line 293) and the review display (line 702), so fixing it fixes both symptoms at once. Subject Tests / Syllabus Builder / Question Bank already use `correctOption` and are unaffected.

## The fix

**One file change** — `src/lib/testEvaluation.ts`:

```ts
const raw = (
  question.answer ||
  question.correct_option ||
  question.correctOption ||
  question.correct_answer ||   // ← ADD: job_test_questions / DB snake_case
  question.correctAnswer ||    // ← ADD: defensive camelCase variant
  ''
).toString().trim();
```

That's it. No type changes, no new normalizer file, no edits to `JobTestsTab`, `TestSession`, or any UI component needed — they all flow through `resolveCorrectAnswer` / `checkUserAnswer` already.

## Why I'm not doing the bigger refactor from your prompt

Your prompt suggested creating `src/utils/questionNormalizer.ts` and editing `JobTestsTab`, `TestSession`, `TestResults`, `TestReview`, and the `Question` type. That's unnecessary in this codebase because:

1. There is no `TestResults.tsx` / `TestReview.tsx` — review rendering lives inside `TestSession.tsx` and already calls `resolveAnswer(question)`.
2. A single shared evaluator (`testEvaluation.ts`) already exists exactly to centralize this. Adding a second normalizer would create two sources of truth.
3. `JobTestsTab` already passes `correct_answer` through into the session payload (line 105) — it just needs the evaluator to recognize it.

## Verification after deploy

1. Start any Job Test, answer some correct + some wrong, submit.
2. Score % matches actual correct answers.
3. Review cards show `Correct: <option text>` (not blank), green border for right, red for wrong.
4. Subject Tests, Syllabus Builder, Custom Quizzes still grade correctly (regression check).