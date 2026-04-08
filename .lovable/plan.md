

# Fix: MCQ Generation Quality + Pakistani Exam Standards

## Problem
AI-generated questions show as descriptive statements ("Benevolent means...") instead of proper MCQs, options are missing/malformed, and questions don't follow Pakistani competitive exam patterns (NTS/FPSC/PPSC style).

## Root Causes
1. The AI prompt (line 329-355 in `generate-test/index.ts`) is generic — no Pakistani exam context, no strict MCQ format enforcement
2. `parseAIResponse` (line 220-286) has no validation for option count, question format, or answer validity
3. No corrupted-data guard in QuestionCard UI

## Changes

### 1. Rewrite AI Prompt — Pakistani Exam Standards
**File**: `supabase/functions/generate-test/index.ts` (lines 324-359)

Replace the generic system prompt in `generateQuestionsInBatches` with a strict Pakistani exam prompt that:
- Specifies FPSC/PPSC/NTS/STS exam patterns
- Requires questions to start with interrogative words and end with `?`
- Enforces exactly 4 options (A, B, C, D) as an object, not array
- Includes subject-specific guidance (English grammar/vocab, Math arithmetic, Pakistan Studies, GK, Computer Science)
- Provides example MCQs in the exact JSON format expected
- Requests the AI return `correctOption` as a letter (A/B/C/D) plus `explanation`

Update the JSON output schema to use `{ "questions": [...] }` with options as `{ "A": "...", "B": "...", "C": "...", "D": "..." }` and `correctOption` as a letter.

### 2. Add Strict MCQ Validation + Sanitization
**File**: `supabase/functions/generate-test/index.ts`

Add two new functions after `parseAIResponse`:
- **`validateMCQ(mcq)`**: Checks question is a string ending with `?`, options object has all 4 keys (A/B/C/D) as non-empty strings, correctOption is a valid letter, explanation exists. Returns boolean.
- **`sanitizeMCQ(mcq)`**: Trims all fields, normalizes difficulty. If question doesn't end with `?`, appends it.

Update `parseAIResponse` to:
- Also try parsing the new format (`correctOption` letter + options object)
- Convert validated MCQs back to the existing `Question` interface (options as array, answer as full text of correct option) so existing DB save logic works unchanged

### 3. Add Corrupted Data Guard to QuestionCard
**File**: `src/components/exam/QuestionCard.tsx`

Before rendering, check if `question.options` is a non-empty array (or non-empty object). If not, show a styled "Corrupted question" alert with skip guidance instead of rendering blank space.

### 4. Add Admin Corrupted Data Cleaner
**File**: `src/components/admin/CorruptedDataCleaner.tsx` (new)

A simple component that:
- Queries `content_items` where category=mcq and filters client-side for items missing valid options/question
- Shows count + list with delete buttons
- Bulk cleanup option

**File**: `src/components/admin/AgentDashboard.tsx` — add CorruptedDataCleaner to the Content/Review tab

### 5. Deploy Edge Function
Deploy `generate-test` after changes.

## Files Summary

| Action | File |
|--------|------|
| Modify | `supabase/functions/generate-test/index.ts` — Pakistani exam prompt, MCQ validation, sanitization |
| Modify | `src/components/exam/QuestionCard.tsx` — corrupted data guard |
| Create | `src/components/admin/CorruptedDataCleaner.tsx` — admin cleanup tool |
| Modify | `src/components/admin/AgentDashboard.tsx` — add cleaner to dashboard |
| Deploy | `generate-test` edge function |

## Technical Notes
- The existing `Question` interface uses `options: string[]` and `answer: string` (full text). The new prompt will generate with letter-based answers, and the validation layer will convert back to this format for compatibility.
- The existing `callAIWithAutoSwitch` in `_shared/gemini.ts` handles Gemini free tier + Lovable gateway fallback — no changes needed there.
- No database migration needed — questions still save to `content_items` with existing columns.

