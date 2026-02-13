

# Smart PDF Upload with AI Auto-Categorization and Approval System

## Overview

This feature transforms the existing Document Library into a smart upload system where AI automatically detects the LMS hierarchy (System/Level/Subject/Topic) from uploaded PDFs, auto-creates missing categories as "unapproved" (hidden from students), and provides an approval dashboard for admin review.

## Important: Schema Mapping

Your existing database uses different table names than referenced in the request:
- "Board" = `educational_systems` table
- "Class" = `levels` table
- "Subject" = `subjects` table
- "Topic" = `topics` table

All changes will be adapted to match this existing schema.

---

## Phase 1: Database Changes

**Migration: Add approval columns to LMS tables**

Add `auto_created`, `approved`, `created_by_ai`, `admin_reviewed_at`, `admin_reviewed_by` columns to:
- `educational_systems`
- `levels`
- `subjects`
- `topics` (also add `ai_suggested_name` and `ai_confidence`)

All existing rows will be set to `approved = TRUE`.

**New table: `lms_approvals`**

Tracks pending AI-created categories with fields: `entity_type`, `entity_id`, `entity_name`, `ai_metadata` (JSONB), `status` (pending/approved/rejected/merged), `admin_notes`, `approved_by`, timestamps. RLS: admin-only access.

---

## Phase 2: Edge Function - `analyze-pdf-metadata`

New edge function that:
1. Receives `filename` and `first_page_text` from the uploaded PDF
2. Calls the Lovable AI Gateway (google/gemini-2.5-flash) with a prompt tuned for Pakistani educational content
3. Returns JSON with detected `system` (board), `level` (class), `subject`, `topic`, `confidence`, and `reasoning`

Uses existing `LOVABLE_API_KEY` secret. Config: `verify_jwt = false` (auth handled in code).

---

## Phase 3: Edge Function - `auto-link-document`

New edge function that:
1. Receives `document_id` and AI `metadata`
2. For each level of the hierarchy (system, level, subject, topic):
   - Checks if an existing matching record exists
   - If yes, reuses it
   - If no, creates it with `approved = false`, `auto_created = true`, `created_by_ai = true`
   - Logs a pending entry in `lms_approvals`
3. Links the document to the resolved `topic_id`, `subject_id`, `level_id`, `system_id`

Uses service role key for database writes.

---

## Phase 4: Frontend - Smart Upload Mode

**Update `DocumentLibrary.tsx`** to add a Smart/Manual upload toggle:

- **Smart Upload tab**: Drag-and-drop or file picker. On upload:
  1. Read first ~2000 chars of PDF text (via FileReader)
  2. Call `analyze-pdf-metadata` edge function
  3. Show AI detection results (System, Level, Subject, Topic, confidence %)
  4. Upload file to `course_books` storage bucket
  5. Create document record
  6. Call `auto-link-document` to create/link LMS hierarchy
  7. Trigger `process-book` for text extraction and embeddings
  8. Show status badges: "Needs Review" (if new categories created) or "Complete"

- **Manual Upload tab**: Existing dropdown-based upload flow (preserved as-is)

Each file shows a progress card with stages: Analyzing, Uploading, Linking, Processing, Complete/Error.

---

## Phase 5: Approval Dashboard

**New component: `LMSApprovalDashboard.tsx`**

- Added as a new tab "LMS Approvals" in AdminTabs with a pending count badge
- Shows all pending `lms_approvals` entries grouped by entity type
- Each card shows: entity type badge, name, AI metadata (board, class, subject, confidence %), reasoning
- Low confidence items (<70%) get a warning badge
- Actions per item: Approve (sets `approved = true` on the entity), Reject (marks as rejected)
- Batch approve/reject with checkboxes

---

## Phase 6: Hide Unapproved from Students

Update student-facing queries to filter `approved = true` (or handle NULL as approved for backward compatibility):

Files to update:
- `src/services/lmsStructureService.ts` - `getEducationalSystems()`, `getLevelsBySystem()`, `getSubjectsByLevel()`, `getTopicsWithRAGStatus()`
- `src/services/supabaseSubjectService.ts`
- `src/services/supabaseTopicService.ts`
- `src/components/admin/question-bank/ManualQuestionDialog.tsx`
- `src/components/syllabus-builder/hooks/useSyllabusData.ts`
- Database function `global_context_search` - add `AND (s.approved IS NULL OR s.approved = true)` filter

Admin views will continue to show all items (approved and unapproved) with visual distinction.

The filter pattern: `.or('approved.is.null,approved.eq.true')` ensures backward compatibility since existing rows won't have the column value until the migration sets them.

---

## Technical Details

### New files:
- `supabase/functions/analyze-pdf-metadata/index.ts`
- `supabase/functions/auto-link-document/index.ts`
- `src/components/admin/LMSApprovalDashboard.tsx`

### Modified files:
- `supabase/config.toml` (add new function entries)
- `src/components/admin/documents/DocumentLibrary.tsx` (smart upload mode)
- `src/components/admin/AdminTabs.tsx` (add Approvals tab)
- `src/services/lmsStructureService.ts` (approved filter for student queries)
- `src/services/supabaseSubjectService.ts` (approved filter)
- `src/services/supabaseTopicService.ts` (approved filter)
- `src/types/lms.types.ts` (add approval fields to interfaces)
- `src/services/documentService.ts` (smart upload helpers)

### Database migration:
- ALTER TABLE for 4 LMS tables (add approval columns)
- CREATE TABLE `lms_approvals`
- UPDATE existing rows to `approved = TRUE`
- RLS policies on `lms_approvals` (admin-only CRUD)
- Update `global_context_search` function to filter unapproved

