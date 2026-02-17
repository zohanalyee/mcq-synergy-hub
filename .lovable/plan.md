# Fix: Retry Button, Background Processing, and Delete Issues

## Problem Summary

1. **Retry button only exists in Smart Upload cards** (in-memory state), not in the Documents Table where database-fetched documents appear. Documents manually set to `failed` in the DB have no retry option.
2. **Background processing via `EdgeRuntime.waitUntil()` appears to silently fail** -- the 202 response returns but no background logs appear.
3. **Delete may fail silently** for older documents due to missing error feedback or RLS constraints.

## Changes

### 1. Add Retry Button to Documents Table (DocumentLibrary.tsx)

The documents table (lines 882-960) currently shows status badges but has no retry/reprocess action for `failed` or `processing` documents. Add a "Retry Processing" button in the Actions column for documents with `status === 'failed'` or stuck `status === 'processing'`.

New handler `handleRetryFromTable(doc)` will:

- Update document status to `processing` via `documentService.updateStatus`
- Call `documentService.processDocument(doc.id, doc.title, doc.file_url)`
- Start polling every 10s for status change (completed/failed)
- Show toast on completion

### 2. Add Debug Logging to Background Job (process-book/index.ts)

Add explicit log lines at the very start and end of the `processInBackground` function to confirm the background job actually executes:

```text
Line 296 (start of processInBackground):
  console.log('[process-book] BACKGROUND JOB STARTED for:', documentId);

Line 346 (after success):
  console.log('[process-book] BACKGROUND JOB COMPLETED for:', documentId);

Line 349 (in catch):
  console.error('[process-book] BACKGROUND JOB FAILED for:', documentId, error);
```

Also wrap the `EdgeRuntime.waitUntil` call (line 393) in a try-catch to detect if `waitUntil` itself throws:

```text
try {
  EdgeRuntime.waitUntil(processInBackground(...));
  console.log('[process-book] waitUntil() accepted the background job');
} catch (e) {
  console.error('[process-book] waitUntil() REJECTED:', e);
  // Fallback: run inline (will timeout on large files but works for small ones)
  await processInBackground(...);
}
```

### 3. Add Auto-Timeout for Stuck Documents (DocumentLibrary.tsx)

In `fetchDocuments`, after loading docs, check for any document stuck in `processing` for over 15 minutes and auto-update them to `failed`:

```text
const stuckDocs = docs.filter(d => 
  d.status === 'processing' && 
  (Date.now() - new Date(d.updated_at).getTime()) > 15 * 60 * 1000
);
for (const doc of stuckDocs) {
  await documentService.updateStatus(doc.id, 'failed');
}
```

### 4. Improve Delete Error Handling (DocumentLibrary.tsx)

Add more specific error logging in `handleDelete` and show the actual error message in the toast instead of a generic "Failed to delete document".

## Files Modified

- `src/components/admin/documents/DocumentLibrary.tsx` -- retry button in table, auto-timeout, better delete errors
- `supabase/functions/process-book/index.ts` -- debug logging, waitUntil fallback

## Technical Details

### Documents Table Retry Button (added to Actions column, lines 894-957):

After the delete AlertDialog, add a conditional retry button:

```text
{(doc.status === 'failed' || doc.status === 'processing') && (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleRetryFromTable(doc)}
          disabled={retryingProcessing === doc.id}
        >
          {retryingProcessing === doc.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 text-amber-500" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Retry Processing</TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}
```

### handleRetryFromTable handler:

```text
const handleRetryFromTable = async (doc: DocumentWithLMS) => {
  setRetryingProcessing(doc.id);
  try {
    await documentService.updateStatus(doc.id, 'processing');
    await documentService.processDocument(doc.id, doc.title, doc.file_url);
    toast.info('Processing started in background...');
    
    // Poll for completion
    const poll = async () => {
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 10000));
        const { data } = await supabase
          .from('documents').select('status').eq('id', doc.id).single();
        if (data?.status === 'completed') {
          toast.success(`"${doc.title}" processed successfully!`);
          await fetchDocuments();
          setRetryingProcessing(null);
          return;
        }
        if (data?.status === 'failed') {
          throw new Error('Processing failed');
        }
      }
      throw new Error('Timed out');
    };
    poll().catch(err => {
      toast.error(`Processing failed: ${err.message}`);
      setRetryingProcessing(null);
      fetchDocuments();
    });
  } catch (error) {
    toast.error('Failed to start processing');
    setRetryingProcessing(null);
  }
};
```

### process-book waitUntil fallback (line 391-393):

```text
try {
  // @ts-ignore
  EdgeRuntime.waitUntil(processInBackground(documentId, fileUrl, title, GEMINI_API_KEY, supabase));
  console.log('[process-book] waitUntil() accepted background job for:', documentId);
} catch (waitUntilError) {
  console.error('[process-book] waitUntil() REJECTED, running inline:', waitUntilError);
  // Run synchronously as fallback -- may timeout for large files but works for small ones
  await processInBackground(documentId, fileUrl, title, GEMINI_API_KEY, supabase);
}  
```

Perfect solution! Approved for implementation.

CONFIRMED CHANGES:

✅ Add retry button to Documents Table (Actions column)

✅ Works for status='failed' OR status='processing'

✅ Auto-polling with 10s intervals

✅ Toast notifications on completion

✅ Debug logging at START of background job

✅ Debug logging at END (success/fail)

✅ Test if waitUntil() is accepted/rejected

✅ Fallback to inline processing if waitUntil fails

✅ Auto-timeout for stuck documents (>15 min)

✅ Runs on fetchDocuments() page load

✅ Auto-marks as 'failed' → retry button appears

✅ Better delete error messages

✅ Show actual error (not generic message)

ADDITIONAL REQUESTS:

1. Retry Button Icon Color:

   Use amber/orange for the RefreshCw icon to match warning theme:

   ```tsx

   <RefreshCw className="h-4 w-4 text-amber-500" />

   ```

2. Tooltip Enhancement:

   Add status-specific tooltip text:

   - If status='failed': "Retry Processing"

   - If status='processing': "Force Retry (currently processing)"

3. Confirm Before Retry for Processing Docs:

   If document is currently 'processing', show confirmation dialog:

   "Document is currently processing. Force retry?"

   This prevents accidental double-processing.

4. Add Retry Count Tracking (Optional):

   Add `retry_count` column to documents table

   Increment on each retry

   Show in UI: "Retry Processing (Attempt 2)"

   Prevent infinite retries (max 3)

5. Background Job Timeout:

   Add max execution time check in processInBackground:

   ```typescript

   const startTime = [Date.now](http://Date.now)();

   // ... processing ...

   if ([Date.now](http://Date.now)() - startTime > 10  *60*  1000) {

     throw new Error('Processing timeout (>10 minutes)');

   }

   ```

These are optional enhancements - priority is the core retry button + debug logging.

Please implement and deploy!