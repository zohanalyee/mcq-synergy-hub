# Fix: Smart Upload Edge Function Failure

## Problem

The `process-book` Edge Function times out during Smart Upload. It downloads the PDF, extracts text (potentially with Vision OCR), chunks it, and generates embeddings for every chunk -- this can exceed the Edge Function CPU time limit for larger files.

Testing confirmed `analyze-pdf-metadata` and `auto-link-document` both return 200 OK. The failure happens at Step 5 (`processDocument`) in `DocumentLibrary.tsx`.

## Solution

Make the `process-book` failure **non-fatal** during Smart Upload. The document is already uploaded and linked by the time `process-book` runs. If it fails, show a warning instead of an error, and let the admin retry processing later.

## Changes

### 1. Make process-book non-fatal in Smart Upload (src/components/admin/documents/DocumentLibrary.tsx)

Wrap the `processDocument` call (line 242) in a try-catch. If it fails:

- Still mark the upload as "complete" (since file is uploaded and LMS-linked)
- Show a warning toast instead of a hard error
- Store a `processingFailed` flag on the SmartUploadFile so the UI can show a "Retry Processing" button

### 2. Add `processingFailed` flag to SmartUploadFile interface

Add a boolean `processingFailed` field. When true, show a warning badge and a "Retry Processing" button next to the completed card.

### 3. Add retry processing button in the smart upload cards UI

When `processingFailed` is true on a completed file, show:

- An amber warning badge ("Text extraction pending")
- A "Retry Processing" button that calls `documentService.processDocument` again

### 4. Update process-book to use EdgeRuntime.waitUntil for long tasks (supabase/functions/process-book/index.ts)

Restructure the function to:

- Return a 202 response immediately after validating inputs and updating status to "processing"
- Use `EdgeRuntime.waitUntil()` to run the actual PDF processing (text extraction, chunking, embedding) in the background
- The background task updates the document status to "completed" or "failed" when done

This prevents the function from timing out on large files.

## Technical Details

### SmartUploadFile interface change:

```text
Add: processingFailed?: boolean
```

### DocumentLibrary.tsx change (handleSmartUpload, around line 242):

```text
// Step 5: Process PDF - non-fatal
let processingFailed = false;
try {
  await documentService.processDocument(docRecord.id, nameWithoutExt, fileUrl);
} catch (processError) {
  console.warn('Processing failed (non-fatal):', processError);
  processingFailed = true;
}

// Step 6 continues regardless...
// Step 7: mark complete with processingFailed flag
```

### process-book/index.ts restructure:

```text
// After validation and auth check:
// 1. Update status to "processing"
// 2. Return 202 immediately
// 3. Use EdgeRuntime.waitUntil() for the actual work

EdgeRuntime.waitUntil((async () => {
  try {
    // extract text, chunk, embed, insert sections
    // update status to "completed"
  } catch (error) {
    // update status to "failed"
  }
})());

return new Response(JSON.stringify({ success: true, status: "processing" }), {
  status: 202,
  headers: { ...corsHeaders, "Content-Type": "application/json" }
});
```

### Files modified:

- `src/components/admin/documents/DocumentLibrary.tsx` -- non-fatal process-book, retry button
- `supabase/functions/process-book/index.ts` -- background processing with EdgeRuntime.waitUntil.    Perfect diagnosis and solution! Approved.
  CONFIRMED UNDERSTANDING:
  ✅ process-book times out on large PDFs
  ✅ analyze-pdf-metadata works (200 OK)
  ✅ auto-link-document works (200 OK)
  ✅ Only processing fails (Step 5)
  ✅ But file is already uploaded and linked
  APPROVED SOLUTION:
  ✅ Make process-book non-fatal in Smart Upload
  ✅ Show warning + retry button (not error)
  ✅ Use EdgeRuntime.waitUntil() for background processing
  ✅ Return 202 immediately
  ✅ Update status when background work completes
  ADDITIONAL REQUESTS:
  1. Auto-refresh status in UI:
     After "Retry Processing" clicked, poll document status every 10 seconds and update UI when completed.
  2. Show processing progress if possible:
     If background task can send progress updates (e.g., "Extracting text 50%"), show in UI.
  3. Batch retry:
     If multiple uploads pending processing, add "Retry All" button.
  4. Notification on completion:
     When background processing completes, show toast: "PDF processing complete! 184 chunks created."
  These are optional enhancements - priority is the core non-fatal + background processing fix.
  Please implement and deploy!