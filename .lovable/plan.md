# Fix: Syllabus Builder Difficulty Mismatch Causing False "No Questions" Error

## Root Cause

The bug is a **difficulty filter mismatch** between the topic count badge and the question fetch query:

1. **Topic count badge** (`getTopicQuestionCounts`) shows "~20 Qs" -- it counts ALL approved MCQs regardless of difficulty
2. **Question fetch** (`fetchQuestionsForTopic`) filters by the selected difficulty (default: `'medium'`)
3. If a topic has 20 questions but none are "Medium" difficulty, the fetch returns 0 questions
4. With 0 questions, the code falls through to the RAG check (line 424), which shows the "No Questions or Course Materials" error

**Database evidence:** Topic "Introduction to Biology" has 20 questions (10 Easy + 10 Hard, 0 Medium). The UI badge shows "20 Qs" but generating with default difficulty "medium" finds zero.

## Fix (2 changes)

### Change 1: Auto-retry without difficulty filter when filtered query returns 0

**File:** `src/services/syllabusRAGFallback.ts` -- `fetchQuestionsForTopic` function

After the filtered query returns 0 results, automatically retry without the difficulty filter so questions are never missed:

```text
// Current: returns empty if no questions match difficulty
// Fixed: retry without difficulty filter as fallback

const topicQuestions = await fetchQuestionsForTopic(topicId, topicName, perTopicCount, difficulty);

if (topicQuestions.length === 0 && difficulty && difficulty !== 'mixed') {
  // Retry without difficulty filter
  const fallbackQuestions = await fetchQuestionsForTopic(topicId, topicName, perTopicCount, undefined);
  // use fallbackQuestions instead
}
```

### Change 2: Show difficulty-aware counts in topic badges

**File:** `src/services/syllabusRAGFallback.ts` -- `getTopicQuestionCounts` function

This is optional but prevents the misleading badge. The count badge currently ignores difficulty. Since the difficulty setting is in the quiz panel and the badges load at mount time, the simplest approach is the retry in Change 1 above.

## Files Modified

- `src/services/syllabusRAGFallback.ts` -- Add difficulty fallback retry in the question distribution loop

## Why This Fully Fixes It

- If questions exist for a topic at ANY difficulty, they will be found
- The difficulty filter is treated as a preference, not a hard filter
- No RAG-related code is touched -- the question bank path at line 365 will now consistently find questions
- The error at line 424 becomes unreachable when questions exist in any difficulty 

"No Medium difficulty questions available for this topic. 

Generated test with Easy and Hard questions instead."

&nbsp;

This explains the behavior without blocking the user.

&nbsp;

Please deploy immediately!

This is the REAL root cause of the "No Questions" error.