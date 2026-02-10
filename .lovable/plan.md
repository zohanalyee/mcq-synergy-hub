
# Fix PDF Upload Dimension Mismatch + Add QuotaMonitor to Admin Panel

## Root Cause

The PDF upload error **"expected 768 dimensions, not 3072"** is the actual failure. The `gemini-embedding-001` model outputs 3072-dimensional vectors by default, but the `document_sections.embedding` column is defined as `vector(768)`. The edge function logs from the context confirm this exact error.

## Two Changes Required

### 1. Fix Embedding Dimension Mismatch (process-book, search-documents, rag-search)

The simplest fix is to tell `gemini-embedding-001` to output 768 dimensions using the `outputDimensionality` parameter in the API request. This avoids any database migration and keeps compatibility with existing stored embeddings.

**Files to edit:**
- `supabase/functions/process-book/index.ts` -- Add `outputDimensionality: 768` to the `generateEmbedding` function's API request body
- `supabase/functions/search-documents/index.ts` -- Same change for query embeddings
- `supabase/functions/rag-search/index.ts` -- Same change for query embeddings

The change is in the `embedContent` API call body, adding:
```
content: { parts: [{ text }] },
outputDimensionality: 768,   // <-- add this line
```

This ensures all three functions produce 768-dimension vectors matching the database schema and the `match_document_sections` RPC function.

### 2. Add QuotaMonitor to AdminPanel Page

**File to edit:** `src/pages/AdminPanel.tsx`

Import the `QuotaMonitor` component and render it between the `AdminHeader` and `AdminContent` sections. This gives administrators immediate visibility into AI quota status when they open the admin panel.

### 3. Improve Error Logging in DocumentLibrary

**File to edit:** `src/components/admin/documents/DocumentLibrary.tsx`

Enhance the catch block in `handleUpload` to log the full error details to the console and show a more descriptive toast to the admin, making future debugging easier.

---

## Technical Details

| File | Change |
|------|--------|
| `supabase/functions/process-book/index.ts` | Add `outputDimensionality: 768` to embedding API call |
| `supabase/functions/search-documents/index.ts` | Add `outputDimensionality: 768` to embedding API call |
| `supabase/functions/rag-search/index.ts` | Add `outputDimensionality: 768` to embedding API call |
| `src/pages/AdminPanel.tsx` | Import and render `QuotaMonitor` above `AdminContent` |
| `src/components/admin/documents/DocumentLibrary.tsx` | Add detailed error logging in catch block |

All three edge functions will be redeployed after the changes. Perfect diagnosis! The embedding dimension mismatch (3072 vs 768) is exactly the issue.

Plan approved. Please implement all 3 changes:

1. ✅ Add outputDimensionality: 768 to all 3 edge functions
   - process-book/index.ts
   - search-documents/index.ts
   - rag-search/index.ts

2. ✅ Add QuotaMonitor to AdminPanel.tsx
   - Render it prominently at the top
   - Between AdminHeader and AdminContent

3. ✅ Improve error logging in DocumentLibrary.tsx
   - Console.log full error details
   - Show descriptive toast with error message

Please implement and deploy all changes now.
