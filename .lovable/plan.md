COMPLETE SCALABLE PDF PROCESSING PLAN

For PDFs from 1 page to 1000+ pages

CURRENT PROBLEM:

- 15-page batches work for ~85 pages

- But 1000 pages = 67 batches × 20s = 22 minutes (still timeout!)

- Need a completely different architecture for large PDFs

---

## ARCHITECTURE: 3-TIER PROCESSING

### TIER 1: Small PDF (1-50 pages)

Strategy: Direct OCR (single request)

Time: 20-60 seconds

Handled by: Current approach (fixed)

### TIER 2: Medium PDF (51-200 pages)  

Strategy: Batch OCR via EdgeRuntime.waitUntil()

Time: 2-5 minutes

Handled by: New batch fix (15 pages/batch)

### TIER 3: Large PDF (200+ pages)

Strategy: Supabase pg_cron + Queue System

Time: As long as needed (no timeout!)

Handled by: Background job queue (NEW - needs implementation)

---

## IMPLEMENTATION PLAN

### STEP 1: Database Queue Table

```sql

CREATE TABLE pdf_processing_queue (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,

  file_url TEXT NOT NULL,

  total_pages INTEGER NOT NULL,

  processed_pages INTEGER DEFAULT 0,

  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed

  current_batch INTEGER DEFAULT 0,

  total_batches INTEGER,

  extracted_text TEXT DEFAULT '',

  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW(),

  updated_at TIMESTAMP DEFAULT NOW()

);

CREATE INDEX idx_queue_status ON pdf_processing_queue(status);

CREATE INDEX idx_queue_document ON pdf_processing_queue(document_id);

```

---

### STEP 2: Smart process-book (Detects PDF Size)

```typescript

// In process-book/index.ts

const DIRECT_OCR_LIMIT = 50;    // pages

const BATCH_OCR_LIMIT = 200;    // pages

// Above 200 pages → use queue system

serve(async (req) => {

  // ... existing auth + validation ...

  const { text: nativeText, pageCount } = await extractTextNative(pdfBytes);

  if (nativeText.quality === 'good') {

    // Native text works → process normally (any page count)

    EdgeRuntime.waitUntil(processNormalDocument(documentId, nativeText, ...));

    return new Response(JSON.stringify({ success: true, status: 'processing' }), { status: 202 });

  }

  // Scanned PDF → check page count

  if (pageCount <= DIRECT_OCR_LIMIT) {

    // TIER 1: Single OCR request

    EdgeRuntime.waitUntil(processWithDirectOCR(documentId, pdfBytes, ...));

    return new Response(JSON.stringify({ success: true, status: 'processing' }), { status: 202 });

  }

  if (pageCount <= BATCH_OCR_LIMIT) {

    // TIER 2: Batch OCR within waitUntil

    EdgeRuntime.waitUntil(processWithBatchOCR(documentId, pdfBytes, pageCount, ...));

    return new Response(JSON.stringify({ success: true, status: 'processing' }), { status: 202 });

  }

  // TIER 3: Large PDF → Queue system

  await addToProcessingQueue(documentId, fileUrl, pageCount);

  return new Response(JSON.stringify({

    success: true,

    status: 'queued',

    message: `Large PDF (${pageCount} pages) added to processing queue. Will complete in ${Math.ceil(pageCount / 50)} minutes.`

  }), { status: 202 });

});

```

---

### STEP 3: Queue Processor Edge Function (NEW)

```typescript

// New file: supabase/functions/process-pdf-queue/index.ts

// Called by pg_cron every 2 minutes

serve(async (req) => {

  const supabase = createClient(...SERVICE_ROLE_KEY...);

  // Get next pending job

  const { data: job } = await supabase

    .from('pdf_processing_queue')

    .select('*')

    .eq('status', 'pending')

    .order('created_at')

    .limit(1)

    .single();

  if (!job) {

    return new Response(JSON.stringify({ message: 'No pending jobs' }));

  }

  // Mark as processing

  await supabase.from('pdf_processing_queue')

    .update({ status: 'processing', updated_at: new Date() })

    .eq('id', [job.id](http://job.id));

  const PAGES_PER_INVOCATION = 50; // Process 50 pages per cron tick

  const startPage = job.processed_pages + 1;

  const endPage = Math.min(startPage + PAGES_PER_INVOCATION - 1, [job.total](http://job.total)_pages);

  try {

    // Download PDF

    const pdfBytes = await downloadPDF(job.file_url);

    

    // Extract this batch of pages

    const batchBytes = await extractPageRange(pdfBytes, startPage, endPage);

    

    // OCR this batch

    const batchText = await performOCR(batchBytes);

    

    // Update progress

    const newProcessedPages = endPage;

    const newText = job.extracted_text + '\n' + batchText;

    const isComplete = newProcessedPages >= [job.total](http://job.total)_pages;

    if (isComplete) {

      // All pages processed! Now chunk + embed

      await supabase.from('pdf_processing_queue')

        .update({ 

          status: 'completed',

          processed_pages: newProcessedPages,

          extracted_text: newText

        })

        .eq('id', [job.id](http://job.id));

      // Generate chunks and embeddings

      await generateChunksAndEmbeddings(job.document_id, newText, supabase);

      

      // Update document status

      await supabase.from('documents')

        .update({ status: 'completed' })

        .eq('id', job.document_id);

        

    } else {

      // More pages remaining → mark as pending for next tick

      await supabase.from('pdf_processing_queue')

        .update({

          status: 'pending', // Back to pending for next cron tick

          processed_pages: newProcessedPages,

          current_batch: job.current_batch + 1,

          extracted_text: newText

        })

        .eq('id', [job.id](http://job.id));

    }

  } catch (error) {

    await supabase.from('pdf_processing_queue')

      .update({ status: 'failed', error_message: error.message })

      .eq('id', [job.id](http://job.id));

    

    await supabase.from('documents')

      .update({ status: 'failed' })

      .eq('id', job.document_id);

  }

});

```

---

### STEP 4: pg_cron Schedule

```sql

-- In Supabase → Database → Extensions → enable pg_cron

-- Then in SQL Editor:

SELECT cron.schedule(

  'process-pdf-queue',     -- job name

  '*/2 * * * *',           -- every 2 minutes

  $$

  SELECT net.http_post(

    url := '[https://YOUR_PROJECT.supabase.co/functions/v1/process-pdf-queue](https://YOUR_PROJECT.supabase.co/functions/v1/process-pdf-queue)',

    headers := '{"Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb,

    body := '{}'::jsonb

  );

  $$

);

```

---

### STEP 5: UI Progress for Large PDFs

```typescript

// Update DocumentLibrary.tsx to show queue progress:

// New query for queued documents:

const { data: queueStatus } = await supabase

  .from('pdf_processing_queue')

  .select('processed_pages, total_pages, status, current_batch, total_batches')

  .eq('document_id', [doc.id](http://doc.id))

  .single();

// Show in UI:

{queueStatus && queueStatus.status === 'pending' && (

  <div className="text-xs text-muted-foreground">

    <Progress 

      value={(queueStatus.processed_pages / [queueStatus.total](http://queueStatus.total)_pages) * 100} 

    />

    <span>

      Page {queueStatus.processed_pages} of {[queueStatus.total](http://queueStatus.total)_pages}

      ({Math.round((queueStatus.processed_pages / [queueStatus.total](http://queueStatus.total)_pages) * 100)}%)

    </span>

    <span className="text-xs">

      Estimated: {Math.ceil(([queueStatus.total](http://queueStatus.total)_pages - queueStatus.processed_pages) / 50 * 2)} min remaining

    </span>

  </div>

)}

```

---

## COMPLETE FLOW DIAGRAM

```

Admin uploads PDF

       ↓

Check native text quality

       ↓

Has good native text?

  YES → Process normally (any size) ✅

  NO → Check page count

         ↓

    ≤ 50 pages?

      YES → Direct OCR (single request, 20s) ✅

      NO ↓

    ≤ 200 pages?

      YES → Batch OCR via waitUntil (15 pages/batch, 3-5 min) ✅

      NO ↓

    > 200 pages → Queue System

      - Add to pdf_processing_queue

      - pg_cron runs every 2 minutes

      - Processes 50 pages per tick

      - 1000 pages = 20 ticks = 40 minutes

      - Progress shown in UI

      - Email/notification on completion ✅

```

---

## TIME ESTIMATES AT SCALE

| PDF Size | Pages | Strategy | Time |

|----------|-------|----------|------|

| Small | 1-50 | Direct OCR | 20-60 sec |

| Medium | 51-200 | Batch OCR | 2-5 min |

| Large | 201-500 | Queue (2min/tick) | 10-20 min |

| Very Large | 501-1000 | Queue (2min/tick) | 20-40 min |

| Massive | 1000+ | Queue (2min/tick) | 40+ min |

ALL sizes work without timeout! ✅

---

## IMPLEMENTATION PRIORITY

Phase 1 (IMMEDIATE - fixes current issue):

✅ Already implementing: Batch OCR for 50-200 pages

Phase 2 (THIS WEEK - handles large PDFs):

1. Create pdf_processing_queue table

2. Create process-pdf-queue edge function

3. Set up pg_cron (every 2 minutes)

4. Update process-book to detect large PDFs

5. Add UI progress display

Phase 3 (NEXT WEEK - polish):

1. Email notification on completion

2. Better progress UI

3. Retry failed queue items

4. Queue monitoring dashboard

---

## ADDITIONAL CONSIDERATIONS

### Text PDFs (not scanned):

If PDF has native text (not image-based):

- NO OCR needed at all

- Process instantly regardless of page count

- 1000 pages with native text = 30 seconds

- Only scanned PDFs need OCR batching

### Partial Processing:

If queue fails midway (page 400 of 1000):

- Save progress in database

- Resume from page 400 on next retry

- Don't restart from beginning

- Efficient and reliable

### Storage Consideration:

Extracted text stored in pdf_processing_queue temporarily

After processing complete, text goes to document_sections

Queue entry can be cleaned up after 24 hours

---

PLEASE IMPLEMENT PHASE 2 AFTER CURRENT BATCH OCR FIX!

This makes the platform truly scalable for any PDF size.