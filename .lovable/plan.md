
# Server-Side PDF Processing Architecture

## Summary
Move ALL PDF parsing to the `process-book` Edge Function. The client will only upload files to Supabase Storage and trigger processing - no PDF.js in frontend at all.

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ Select PDF File  │───>│ Upload to Storage│                   │
│  └──────────────────┘    └────────┬─────────┘                   │
│                                   │                             │
│                          ┌────────▼─────────┐                   │
│                          │ Create Document  │                   │
│                          │ Record (pending) │                   │
│                          └────────┬─────────┘                   │
│                                   │                             │
│                          ┌────────▼─────────┐                   │
│                          │ Invoke process-  │                   │
│                          │ book (file URL)  │                   │
│                          └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EDGE FUNCTION (process-book)                 │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ Fetch PDF from   │───>│ Parse with       │                   │
│  │ Storage URL      │    │ pdfjs-serverless │                   │
│  └──────────────────┘    └────────┬─────────┘                   │
│                                   │                             │
│                          ┌────────▼─────────┐                   │
│                          │ Chunk Text       │                   │
│                          └────────┬─────────┘                   │
│                                   │                             │
│                          ┌────────▼─────────┐                   │
│                          │ Generate Gemini  │                   │
│                          │ Embeddings       │                   │
│                          └────────┬─────────┘                   │
│                                   │                             │
│                          ┌────────▼─────────┐                   │
│                          │ Store Sections   │                   │
│                          │ + Update Status  │                   │
│                          └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

## Changes Required

### 1. Delete from Frontend (Remove Crash Source)
**File: `src/services/pdfExtractorService.ts`**
- DELETE this entire file
- This removes all `pdfjs-dist` imports from the client bundle
- No PDF.js = no worker crash

### 2. Update Document Library Component
**File: `src/components/admin/documents/DocumentLibrary.tsx`**
- Remove import of `pdfExtractorService`
- Simplify `handleUpload()` to only:
  1. Upload PDF to Supabase Storage
  2. Create document record with `pending` status
  3. Call `process-book` edge function with `{ documentId, fileUrl }` (no text)
- Remove all client-side text extraction progress UI
- Add simpler progress: "Uploading..." then "Processing on server..."

### 3. Update Document Service
**File: `src/services/documentService.ts`**
- Update `processDocument()` to accept `fileUrl` instead of `text`
- Remove `MAX_TEXT_LENGTH` check (server handles this now)

### 4. Rewrite Process-Book Edge Function
**File: `supabase/functions/process-book/index.ts`**
- Add `pdfjs-serverless` import from ESM CDN
- Change input from `{ documentId, text }` to `{ documentId, fileUrl }`
- Add PDF fetch and parsing logic:
  1. Fetch PDF binary from Storage URL
  2. Parse with `pdfjs-serverless`
  3. Extract text from all pages
  4. Chunk, embed, and store (existing logic)
- Add better error handling for large PDFs

## Technical Details

### PDF Library for Edge Functions
Use `pdfjs-serverless` which is designed for serverless/Deno environments:
```typescript
import { getDocument } from "https://esm.sh/pdfjs-serverless@0.6.0";
```

### New process-book Flow
```typescript
// 1. Fetch PDF from storage
const response = await fetch(fileUrl);
const arrayBuffer = await response.arrayBuffer();
const data = new Uint8Array(arrayBuffer);

// 2. Parse PDF
const doc = await getDocument(data).promise;

// 3. Extract text from all pages
let text = "";
for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const content = await page.getTextContent();
  text += content.items.map((item: any) => item.str).join(" ") + "\n";
}

// 4. Continue with existing chunking + embedding logic
```

### Updated DocumentLibrary Upload Flow
```typescript
// Step 1: Upload to storage (unchanged)
const fileUrl = await documentService.uploadToStorage(selectedFile);

// Step 2: Create document record (unchanged)
const docRecord = await documentService.createDocument(title, filename, fileUrl);

// Step 3: Trigger server-side processing (simplified)
setUploadProgress({ stage: "processing", message: "Processing PDF on server..." });
await documentService.processDocument(docRecord.id, fileUrl);

// Done - no client-side PDF parsing at all
```

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/services/pdfExtractorService.ts` | DELETE | Remove PDF.js from frontend |
| `src/components/admin/documents/DocumentLibrary.tsx` | MODIFY | Remove PDF.js import, simplify upload flow |
| `src/services/documentService.ts` | MODIFY | Change processDocument signature |
| `supabase/functions/process-book/index.ts` | REWRITE | Add server-side PDF parsing |

## Benefits of This Architecture

1. **No client-side crashes** - PDF.js completely removed from frontend bundle
2. **Works on all devices** - Mobile, desktop, Lovable preview all work identically
3. **Scalable** - Server handles heavy PDF processing
4. **Simpler client code** - Just upload and wait
5. **Better error handling** - Server can handle edge cases gracefully
6. **Future-proof** - Easy to add support for other document types (DOCX, etc.)

## Limitations to Consider

- Larger PDFs may take longer (server-side processing)
- Edge function timeout (default 60s) may need monitoring for very large files
- No client-side page-by-page progress (but overall progress still shown)
