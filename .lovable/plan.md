

# Fix: Default Count Override, Subject Force-Tagging & AI Yield Drops

## Changes

### 1. `src/components/mock-tests/JobTestsTab.tsx` — Two fixes

**Fix 1: Cap default at 20 questions (line 37)**
```
questionCount: test.questions  →  questionCount: Math.min(test.questions || 20, 20)
```

**Fix 2: Force-tag both `subject` and `topic` to the syllabus subject (lines 121-125)**
Replace the current labeling block with strict overrides that never fall back to AI values:
```typescript
const labeledQuestions = questions.map((q: any) => ({
  ...q,
  subject: item.subject,   // Force exact syllabus subject
  topic: item.subject,      // Force topic too — no AI fallback
}));
```
This is a one-line change: remove `q.topic ||` from line 124.

### 2. `supabase/functions/generate-test/index.ts` — Debug logging & relaxed validation

**In `parseAIResponse` (line 370):**
- Add `console.log` of the raw text (first 500 chars) before parsing
- After the `rawQuestions.filter(validateMCQ)` call, log how many passed vs failed

**In `validateMCQ` (line 295):**
- Relax the `question.trim().length < 10` check to `< 5` (some valid short questions exist)
- Add a patching step: if `correctOption` uses lowercase (`a,b,c,d`), uppercase it before validation
- Accept `correct_option` as an alias for `correctOption`

**In `sanitizeMCQ` (line 331):**
- Also check `mcq.correct_option` as a fallback for `mcq.correctOption`

These are surgical changes — no structural rewrites to the edge function.

### 3. Deploy edge function

After editing, deploy `generate-test` and verify via logs.

## Files Modified
| File | Changes |
|------|---------|
| `src/components/mock-tests/JobTestsTab.tsx` | Cap questionCount at 20; force-tag topic without AI fallback |
| `supabase/functions/generate-test/index.ts` | Debug logging in parseAIResponse; relax validateMCQ; accept correct_option alias |

