

# Fix Data Wiring for Admin Panel Features

## Problem Summary
All three UI components (RAG badges, source labels, generate button) are already built and present in the code. However, they don't work because the **data isn't being passed** to them correctly. This requires two small but critical wiring fixes.

---

## Root Cause Analysis

### Issue 1: TopicManager doesn't fetch RAG data
- `TopicManager.tsx` uses `useTopicManagement` hook
- That hook uses `useSupabaseTopics` which calls `getTopics()` from `supabaseTopicService.ts`
- `getTopics()` returns plain `Topic` objects (name, description, subject_id) -- no document counts
- The function `getTopicsWithRAGStatus(subjectId)` already exists in `lmsStructureService.ts` and returns `documentCount` and `chunkCount`, but it's **never called**
- Result: `TopicList.tsx` receives topics with `documentCount = undefined`, so every topic shows "No Documents"

### Issue 2: QuestionBankManager doesn't map source_type
- `QuestionBankManager.tsx` has a `mapDbRowToContentItem()` function (line 55-90)
- It maps every DB column **except** `source_type`
- `QuestionBankTable.tsx` already has `getSourceInfo()` that reads `source_type` or `sourceType`
- But since `sourceType` is never set on the mapped object, every question defaults to "Manual"

### Issue 3: Generate button (already working)
- `GenerateFromRAGDialog.tsx` is already rendered in `TopicList.tsx`
- It calls `generateForTopic()` from `autoFillService.ts` which is functional
- BUT: Since `hasDocuments` is always `false` (Issue 1), the button is permanently disabled

---

## Fix Plan

### Fix 1: Wire RAG status into TopicManager

**File: `src/hooks/useTopicManagement.tsx`**
- Import `getTopicsWithRAGStatus` from `lmsStructureService.ts`
- When `selectedSubject` changes, call `getTopicsWithRAGStatus(subjectId)` instead of using plain `allTopics[subjectName]`
- Store topics with RAG data in state so `TopicList` receives `documentCount` and `chunkCount`
- Add a `refreshTopics()` function passed to `TopicList` for re-fetching after MCQ generation

**File: `src/components/admin/TopicManager.tsx`**
- Pass `onRefresh` callback to `TopicList` so the Generate dialog can trigger a refresh

### Fix 2: Map source_type in QuestionBankManager

**File: `src/components/admin/QuestionBankManager.tsx`**
- Add one line to `mapDbRowToContentItem()`:
  ```
  sourceType: row.source_type
  ```
- This single line fix will make all existing source badges work immediately

---

## What Each Fix Enables

| Fix | Feature Unlocked |
|-----|-----------------|
| Fix 1 (RAG wiring) | Green/Gray RAG status badges appear correctly |
| Fix 1 (RAG wiring) | Generate MCQs button becomes enabled for topics with PDFs |
| Fix 1 (RAG wiring) | Tooltip shows "X PDFs, Y chunks indexed" |
| Fix 2 (source_type mapping) | "From Book" / "AI Generated" / "Manual" labels appear in Question Bank |

## Files Modified
- `src/hooks/useTopicManagement.tsx` -- fetch RAG-enriched topics
- `src/components/admin/TopicManager.tsx` -- pass refresh callback
- `src/components/admin/QuestionBankManager.tsx` -- add `sourceType: row.source_type` mapping

## No Changes Needed
- `TopicList.tsx` -- already has RAG badge UI
- `GenerateFromRAGDialog.tsx` -- already functional
- `QuestionBankTable.tsx` -- already has source label UI
- Database schema -- `source_type` column exists
- Edge Functions -- already deployed and working

