

# Fix Plan: Strict Subject Lock, Per-Subject AI Trigger, Subject Badges

## Fix 1: Strict Subject Lock in `fetchSubjectQuota` (testGenerationService.ts)

**Problem**: The fallback logic in `fetchSubjectQuota` (lines 93-120) queries by subject name when topic query falls short, then relaxes difficulty. This causes English (which has the most questions in the DB) to overflow into other subjects' slots because the `topic` and `subject` fields overlap across subjects.

**Changes**:
- Remove ALL fallback logic from `fetchSubjectQuota`. It should do ONE query (by topic, then by subject if 0 results), slice to quota, and return whatever it found -- even if 0.
- No cross-filling. If Math quota is 2 and DB has 0 Math, return 0 Math questions. The deficit is tracked per-subject.

**Also add to `GeneratedTest` interface**:
- `subjectDeficits?: Record<string, number>` — maps subject name to how many questions were missing from the bank.

**In the syllabus weights path** (lines 172-178):
- After fetching each subject, compute `deficit = quota - fetched.length` and store it in a `subjectDeficits` map.
- Pass `subjectDeficits` into the returned `GeneratedTest`.

## Fix 2: Per-Subject AI Trigger (JobTestsTab.tsx)

**Problem**: Lines 101-108 send `topic: test.title` (e.g., "Junior Clerk") to the AI, which generates generic/English questions.

**Changes**:
- After getting `generatedTest`, read `generatedTest.subjectDeficits`.
- For each subject with deficit > 0, invoke `generate-test` edge function with `topic: subjectName` and `question_count: deficit` instead of the overall test title.
- This ensures AI generates specifically "Mathematics" or "MS Office" questions.

## Fix 3: Subject Badge on Question Cards (TestSession.tsx)

**During test-taking** (line ~564, before QuestionCard):
- Add a `Badge` showing `Section: {questions[currentQuestion]?.subject || questions[currentQuestion]?.topic || 'General'}` above the QuestionCard.

**In Review Answers** (line ~704-706):
- Add a `Badge` showing `Section: {question.subject || question.topic || 'General'}` above each question text.

## Files to Modify

| File | Change |
|------|--------|
| `src/services/testGenerationService.ts` | Strip fallbacks from `fetchSubjectQuota`, add `subjectDeficits` to `GeneratedTest` |
| `src/components/mock-tests/JobTestsTab.tsx` | Per-subject AI deficit triggers |
| `src/pages/TestSession.tsx` | Subject badges during test and in review |

