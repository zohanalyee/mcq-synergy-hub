

# Admin-Guided AI Categorization: Chunk Preview and Manual Override

## What This Adds

After a Smart Upload completes, admins can:
1. Expand a "View Content" section to see the first chunks of the processed PDF
2. See a "Fix Categorization" button when AI detects "Unknown" or low confidence
3. Open a dialog showing AI suggestions, chunk previews, and manual override dropdowns
4. Save corrections which re-link the document to the correct LMS hierarchy

---

## Changes

### 1. Update SmartUploadFile interface (DocumentLibrary.tsx)

Add `chunks` and `documentId` fields to track chunk data and the created document ID after processing.

### 2. Fetch chunks after processing completes (DocumentLibrary.tsx)

After `processDocument` succeeds, query `document_sections` for up to 10 chunks and store them in the smart file state. Also store the `documentId` for re-linking.

### 3. Add collapsible chunk preview UI (DocumentLibrary.tsx)

Below each completed smart upload card, add a `Collapsible` section showing:
- First 5 chunks with 200-char previews
- Count of remaining chunks
- "Fix Categorization" button (always visible, highlighted when Unknown or confidence < 70%)

### 4. Create ManualCategorizationDialog component

New file: `src/components/admin/documents/ManualCategorizationDialog.tsx`

A dialog that shows:
- AI's detected metadata with confidence badge
- Content preview from first 3 chunks
- Four editable fields: System (select from DB), Level (select), Subject (select), Topic (text input)
- Cascading selects: changing System loads its Levels, changing Level loads its Subjects
- "Confirm & Re-link" button that calls `auto-link-document` with corrected metadata

### 5. Wire the dialog into DocumentLibrary

Add state for the dialog (`fixDialog`), an `openFixDialog` function, and render the dialog component. On confirm, call `auto-link-document` with the corrected metadata and refresh documents.

---

## Technical Details

### SmartUploadFile interface changes:
```text
Add:
  chunks?: { index: number; content: string; preview: string }[]
  documentId?: string
```

### Chunk fetching (after step 6 in handleSmartUpload):
Query `document_sections` table filtered by `document_id`, ordered by `section_index`, limit 10. Map to preview objects with first 200 chars.

### ManualCategorizationDialog props:
- `open`, `onClose`
- `filename`, `aiMetadata`, `chunks`, `documentId`
- `onConfirm` callback

### Cascading select logic:
- On mount: load all approved `educational_systems`
- On system change: load `levels` filtered by `system_id`
- On level change: load `subjects` filtered by `level_id`
- Topic remains a free text input

### Re-linking flow:
Call `supabase.functions.invoke('auto-link-document', { body: { document_id, metadata } })` with corrected values and confidence 1.0.

### Files to create:
- `src/components/admin/documents/ManualCategorizationDialog.tsx`

### Files to modify:
- `src/components/admin/documents/DocumentLibrary.tsx`

