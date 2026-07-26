import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";
import { checkQuota, QuotaExhaustedError } from '../_shared/quotaManager.ts';
import { callVisionWithAutoSwitch, callGeminiEmbedding } from '../_shared/gemini.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Configuration
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
// Embedding models: managed inside shared callGeminiEmbedding helper.
const MAX_PDF_SIZE = 25 * 1024 * 1024;
const MIN_QUALITY_CHARS = 500;
const MIN_QUALITY_LETTERS = 100;
const DIRECT_OCR_LIMIT = 50;
const BATCH_OCR_LIMIT = 200;
const BATCH_SIZE = 15;

interface ProcessRequest {
  documentId: string;
  fileUrl: string;
  title?: string;
}

// Helper: Verify admin authorization
async function verifyAdmin(req: Request, supabase: any): Promise<{ authorized: boolean; userId?: string; error?: string }> {
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (authHeader?.includes(serviceKey || "")) {
    return { authorized: true, userId: "service_role" };
  }
  if (!authHeader?.startsWith("Bearer ")) {
    return { authorized: false, error: "Missing or invalid authorization header" };
  }
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { authorized: false, error: "Invalid token" };
  }
  const { data: roleData } = await supabase
    .from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").single();
  if (!roleData) {
    return { authorized: false, error: "Admin privileges required" };
  }
  return { authorized: true, userId: data.user.id };
}

// Extract a range of pages from a PDF using pdf-lib
async function extractPageRange(pdfBytes: Uint8Array, startPage: number, endPage: number): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const newDoc = await PDFDocument.create();
  const indices = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage - 1 + i);
  const pages = await newDoc.copyPages(srcDoc, indices);
  pages.forEach(page => newDoc.addPage(page));
  const newBytes = await newDoc.save();
  return new Uint8Array(newBytes);
}

// Stage 1: Try native text extraction with unpdf
async function extractTextNative(pdfBytes: Uint8Array): Promise<{
  text: string;
  pageCount: number;
  quality: "good" | "poor";
}> {
  try {
    const pdf = await getDocumentProxy(pdfBytes);
    const pageCount = pdf.numPages;
    console.log(`[process-book] PDF has ${pageCount} pages`);
    const { text: fullText } = await extractText(pdf, { mergePages: true });
    const trimmed = fullText.trim();
    console.log(`[process-book] Native extraction: ${trimmed.length} characters`);
    const letterCount = (trimmed.match(/[a-zA-Z\u0600-\u06FF\u0900-\u097F]/g) || []).length;
    const hasGoodText = trimmed.length > MIN_QUALITY_CHARS && letterCount > MIN_QUALITY_LETTERS;
    return { text: trimmed, pageCount, quality: hasGoodText ? "good" : "poor" };
  } catch (error) {
    console.error("[process-book] Native extraction failed:", error);
    return { text: "", pageCount: 0, quality: "poor" };
  }
}

function pdfToBase64(pdfBytes: Uint8Array): string {
  let raw = "";
  const STEP = 32768;
  for (let i = 0; i < pdfBytes.length; i += STEP) {
    const slice = pdfBytes.subarray(i, Math.min(i + STEP, pdfBytes.length));
    raw += String.fromCharCode(...slice);
  }
  return btoa(raw);
}

// Batch OCR via shared callVisionWithAutoSwitch (handles key rotation +
// ai_usage_logs recording centrally).
async function extractViaGeminiDirect(pdfBytes: Uint8Array, pageCount = 0, supabase: any): Promise<string> {
  const logCtx = { supabaseClient: supabase, sourceType: 'process-book-ocr' };

  // For small PDFs or unknown page count, send whole thing
  if (pageCount <= DIRECT_OCR_LIMIT) {
    console.log("[process-book] 🔍 Using Gemini Vision OCR (single request)...");
    const base64Pdf = pdfToBase64(pdfBytes);
    const { text } = await callVisionWithAutoSwitch(
      "Extract ALL text from this PDF document. Preserve page structure and formatting. Output only the extracted text, nothing else.",
      base64Pdf,
      "application/pdf",
      { maxOutputTokens: 65536, temperature: 0.1 },
      logCtx
    );
    if (!text || text.length < 50) throw new Error("Gemini Vision OCR returned insufficient text");
    console.log(`[process-book] ✅ Vision OCR extracted ${text.length} characters`);
    return text;
  }

  // Batch mode for medium PDFs
  const batches = Math.ceil(pageCount / BATCH_SIZE);
  console.log(`[process-book] 🔍 Batch OCR: ${batches} batches`);
  let fullText = "";

  for (let batch = 0; batch < batches; batch++) {
    const startPage = batch * BATCH_SIZE + 1;
    const endPage = Math.min(startPage + BATCH_SIZE - 1, pageCount);
    console.log(`[process-book] Batch ${batch + 1}/${batches}: pages ${startPage}-${endPage}`);

    try {
      const batchBytes = await extractPageRange(pdfBytes, startPage, endPage);
      const batchBase64 = pdfToBase64(batchBytes);

      const { text: batchText } = await callVisionWithAutoSwitch(
        `Extract ALL text from pages ${startPage}-${endPage}. Preserve structure. Output only the extracted text.`,
        batchBase64,
        "application/pdf",
        { maxOutputTokens: 16384, temperature: 0.1 },
        logCtx
      );
      fullText += (batchText || "") + "\n\n";
      console.log(`[process-book] Batch ${batch + 1} extracted ${batchText?.length || 0} chars`);
      if (batch < batches - 1) await new Promise(r => setTimeout(r, 500));
    } catch (batchError) {
      console.warn(`[process-book] ⚠️ Batch ${batch + 1} error:`, batchError instanceof Error ? batchError.message : batchError);
    }
  }

  if (fullText.length < 50) throw new Error("Gemini batch OCR extracted insufficient text");
  console.log(`[process-book] ✅ Total OCR: ${fullText.length} characters`);
  return fullText.trim();
}

async function extractTextWithVisionOCR(pdfBytes: Uint8Array, supabase: any, pageCount: number): Promise<string> {
  // Shared helper already rotates GEMINI_API_KEY → EXTERNAL_JOBS_GEMINI_KEY.
  return await extractViaGeminiDirect(pdfBytes, pageCount, supabase);
}

async function extractPdfContent(fileUrl: string, supabase: any): Promise<{ text: string; pageCount: number; method: "native" | "vision-ocr" }> {
  console.log(`[process-book] Fetching PDF from: ${fileUrl}`);
  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_PDF_SIZE) {
    throw new Error(`PDF file too large (${Math.round(parseInt(contentLength) / 1024 / 1024)}MB). Maximum is ${MAX_PDF_SIZE / 1024 / 1024}MB.`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const pdfBytes = new Uint8Array(arrayBuffer);
  console.log(`[process-book] PDF downloaded: ${pdfBytes.length} bytes`);

  const nativeResult = await extractTextNative(pdfBytes);

  if (nativeResult.quality === "good") {
    console.log("[process-book] ✅ Native extraction quality is good, using it");
    return { text: nativeResult.text, pageCount: nativeResult.pageCount, method: "native" };
  }

  console.log(`[process-book] ⚠️ Native extraction poor (${nativeResult.text.length} chars). Falling back to Vision OCR...`);
  const ocrText = await extractTextWithVisionOCR(pdfBytes, supabase, nativeResult.pageCount || 1);

  if (!ocrText || ocrText.length < 100) {
    throw new Error("PDF appears to be empty or unreadable.");
  }
  return { text: ocrText, pageCount: nativeResult.pageCount || 1, method: "vision-ocr" };
}

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk);
    start += chunkSize - overlap;
  }
  return chunks;
}

async function generateEmbeddingsBatch(chunks: string[], supabase: any): Promise<number[][]> {
  const logCtx = { supabaseClient: supabase, sourceType: 'process-book-embedding' };
  const embeddings: number[][] = [];
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await callGeminiEmbedding(chunks[i], { logCtx });
    embeddings.push(embedding);
    if ((i + 1) % 10 === 0) console.log(`Generated embeddings: ${i + 1}/${chunks.length}`);
    if (i < chunks.length - 1) await new Promise(resolve => setTimeout(resolve, 100));
  }
  return embeddings;
}


// Background processing for Tier 1 & 2 (≤200 pages)
async function processInBackground(documentId: string, fileUrl: string, title: string | undefined, supabase: any) {
  const startTime = Date.now();
  console.log(`[process-book] 🔥 BACKGROUND JOB STARTED for: ${documentId}`);

  try {
    const { text, pageCount, method } = await extractPdfContent(fileUrl, supabase);
    console.log(`[process-book] Extracted ${text.length} chars from ${pageCount} pages via ${method}`);

    if (!text || text.length < 100) {
      throw new Error("PDF appears to be empty or contains very little extractable text");
    }
    if (Date.now() - startTime > 10 * 60 * 1000) {
      throw new Error('Processing timeout (>10 minutes)');
    }

    const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);
    console.log(`[process-book] Created ${chunks.length} chunks`);
    if (chunks.length === 0) throw new Error("No valid text chunks could be extracted");

    console.log(`[process-book] Checking quota before generating ${chunks.length} embeddings...`);
    try {
      const quota = await checkQuota(supabase);
      console.log(`[process-book] 📊 Quota remaining: ${quota.remaining}, chunks needed: ${chunks.length}`);
    } catch (err) {
      if (err instanceof QuotaExhaustedError) {
        await supabase.from("documents").update({ status: "failed" }).eq("id", documentId);
        console.error("[process-book] Quota exhausted during background processing");
        return;
      }
      throw err;
    }

    console.log("[process-book] Generating embeddings...");
    const embeddings = await generateEmbeddingsBatch(chunks, supabase);

    console.log(`[process-book] Generated ${embeddings.length} embeddings`);

    const sections = chunks.map((content, index) => ({
      document_id: documentId,
      content,
      embedding: JSON.stringify(embeddings[index]),
      section_index: index,
      token_count: Math.ceil(content.length / 4),
    }));

    const { error: insertError } = await supabase.from("document_sections").insert(sections);
    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to insert sections: ${insertError.message}`);
    }

    await supabase.from("documents").update({ status: "completed", page_count: pageCount }).eq("id", documentId);
    console.log(`[process-book] ✅ BACKGROUND JOB COMPLETED for: ${documentId} — ${chunks.length} sections via ${method} in ${Math.round((Date.now() - startTime) / 1000)}s`);

  } catch (error) {
    console.error(`[process-book] 🔴 BACKGROUND JOB FAILED for: ${documentId}`, error);
    await supabase.from("documents").update({ status: "failed" }).eq("id", documentId);
  }
}

// Add large PDF to queue for cron-based processing
async function addToProcessingQueue(supabase: any, documentId: string, fileUrl: string, pageCount: number) {
  const totalBatches = Math.ceil(pageCount / BATCH_SIZE);
  const { error } = await supabase.from("pdf_processing_queue").insert({
    document_id: documentId,
    file_url: fileUrl,
    total_pages: pageCount,
    total_batches: totalBatches,
    status: "pending",
  });
  if (error) throw new Error(`Failed to add to queue: ${error.message}`);
  console.log(`[process-book] 📋 Added to queue: ${documentId} (${pageCount} pages, ${totalBatches} batches)`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GEMINI_API_KEY presence is validated inside the shared helpers.


    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const auth = await verifyAdmin(req, supabase);
    if (!auth.authorized) {
      return new Response(
        JSON.stringify({ error: auth.error }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log(`[process-book] ✅ Authorized: ${auth.userId}`);

    const { documentId, fileUrl, title } = await req.json() as ProcessRequest;
    if (!documentId || !fileUrl) {
      return new Response(
        JSON.stringify({ error: "documentId and fileUrl are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[process-book] Processing document: ${documentId}`);
    await supabase.from("documents").update({ status: "processing" }).eq("id", documentId);

    // Determine tier: download PDF and check native text + page count
    const pdfResponse = await fetch(fileUrl);
    if (!pdfResponse.ok) throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfArrayBuffer);
    console.log(`[process-book] PDF downloaded: ${pdfBytes.length} bytes`);

    const nativeResult = await extractTextNative(pdfBytes);
    const pageCount = nativeResult.pageCount || 1;

    // If native text is good, process normally regardless of size
    if (nativeResult.quality === "good") {
      console.log(`[process-book] Native text good (${nativeResult.text.length} chars). Processing normally.`);
      try {
        // @ts-ignore
        EdgeRuntime.waitUntil((async () => {
          const startTime = Date.now();
          console.log(`[process-book] 🔥 BACKGROUND JOB STARTED (native) for: ${documentId}`);
          try {
            const chunks = chunkText(nativeResult.text, CHUNK_SIZE, CHUNK_OVERLAP);
            if (chunks.length === 0) throw new Error("No valid chunks");
            const embeddings = await generateEmbeddingsBatch(chunks, supabase);
            const sections = chunks.map((content, index) => ({
              document_id: documentId, content, embedding: JSON.stringify(embeddings[index]),
              section_index: index, token_count: Math.ceil(content.length / 4),
            }));
            await supabase.from("document_sections").insert(sections);
            await supabase.from("documents").update({ status: "completed", page_count: pageCount }).eq("id", documentId);
            console.log(`[process-book] ✅ COMPLETED (native) for: ${documentId} in ${Math.round((Date.now() - startTime) / 1000)}s`);
          } catch (err) {
            console.error(`[process-book] 🔴 FAILED (native) for: ${documentId}`, err);
            await supabase.from("documents").update({ status: "failed" }).eq("id", documentId);
          }
        })());
      } catch {
        // Fallback inline
        await processInBackground(documentId, fileUrl, title, supabase);

      }
      return new Response(
        JSON.stringify({ success: true, status: "processing", documentId, tier: "native", pageCount }),
        { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Scanned PDF — route by tier
    if (pageCount <= BATCH_OCR_LIMIT) {
      // TIER 1 & 2: Direct or batch OCR within waitUntil
      const tier = pageCount <= DIRECT_OCR_LIMIT ? 1 : 2;
      console.log(`[process-book] Tier ${tier}: ${pageCount} pages, using ${tier === 1 ? 'direct' : 'batch'} OCR`);
      try {
        // @ts-ignore
        EdgeRuntime.waitUntil(processInBackground(documentId, fileUrl, title, supabase));
        console.log(`[process-book] waitUntil() accepted background job for: ${documentId}`);
      } catch (waitUntilError) {
        console.error(`[process-book] waitUntil() REJECTED, running inline:`, waitUntilError);
        await processInBackground(documentId, fileUrl, title, supabase);
      }
      return new Response(
        JSON.stringify({ success: true, status: "processing", documentId, tier, pageCount }),
        { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // TIER 3: Large PDF → Queue system
    console.log(`[process-book] Tier 3: ${pageCount} pages → adding to processing queue`);
    await addToProcessingQueue(supabase, documentId, fileUrl, pageCount);
    const estimatedMinutes = Math.ceil(pageCount / 50) * 2;
    return new Response(
      JSON.stringify({
        success: true,
        status: "queued",
        documentId,
        tier: 3,
        pageCount,
        message: `Large PDF (${pageCount} pages) added to processing queue. Estimated time: ~${estimatedMinutes} minutes.`,
      }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Process book error:", error);
    try {
      const body = await req.clone().json();
      if (body?.documentId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase.from("documents").update({ status: "failed" }).eq("id", body.documentId);
      }
    } catch {
      // Ignore
    }
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", details: "Failed to process book" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
