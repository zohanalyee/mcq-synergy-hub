

# Plan: Document to JSON MCQ Converter

## Overview
Add a new admin tool that accepts document uploads (PDF, Word, TXT), uses AI to extract MCQ questions, classify them, verify answers, and save to the question bank — all in one workflow.

## New Files

### 1. Edge Function: `supabase/functions/convert-document-mcqs/index.ts`
- Accepts file URL or raw text via POST
- Uses Lovable AI Gateway (`google/gemini-2.5-flash`) with the extraction prompt from the user's spec
- 3-step pipeline: Extract → Classify → Verify (single AI call combining all three for efficiency)
- Fetches available subjects/topics from DB for classification matching
- Returns structured JSON with questions, classifications, and verification flags
- Reuses `verifyAdmin` pattern from `generate-from-rag`
- Add to `supabase/config.toml` with `verify_jwt = false`

### 2. Admin Component: `src/components/admin/DocumentMCQConverter.tsx`
- Upload zone accepting PDF, DOCX, TXT files (max 20MB)
- Option to paste raw text directly
- Progress stages: Uploading → Extracting → Classifying → Verifying
- Results view showing:
  - Summary stats (total, by difficulty, flagged count)
  - Question preview table with subject/topic/difficulty columns
  - Flagged questions highlighted in yellow
  - "Save to Question Bank" button to bulk-insert approved questions into `content_items`
- Uses existing `course_books` storage bucket for temporary file uploads

### 3. Modified: `src/components/admin/AdminTabs.tsx`
- Add new tab "Doc → MCQ" with `FileText` icon after "Smart Generation" tab
- Add `TabsContent` rendering `DocumentMCQConverter`

## Edge Function Logic (single optimized AI call)
Rather than 3 separate AI calls (expensive), combine extraction + classification + verification into one prompt that returns the full structured JSON. The prompt will:
- Include available subjects/topics list for matching
- Ask for difficulty classification inline
- Ask for answer verification inline
- Return confidence scores per question

## Database Changes
None — questions save directly to existing `content_items` table using the same schema as `generate-from-rag`.

## Files Summary

| Action | File |
|--------|------|
| Create | `supabase/functions/convert-document-mcqs/index.ts` |
| Create | `src/components/admin/DocumentMCQConverter.tsx` |
| Modify | `src/components/admin/AdminTabs.tsx` (add tab) |
| Modify | `supabase/config.toml` (add function config) |

