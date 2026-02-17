import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";
import { checkQuota, retryWithBackoff, quotaExhaustedResponse, QuotaExhaustedError } from '../_shared/quotaManager.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Configuration
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const EMBEDDING_MODELS = ["gemini-embedding-001", "text-embedding-005", "text-embedding-004"];
const MAX_PDF_SIZE = 25 * 1024 * 1024;
const MIN_QUALITY_CHARS = 500;
const MIN_QUALITY_LETTERS = 100;

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
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .single();

  if (!roleData) {
    return { authorized: false, error: "Admin privileges required" };
  }

  return { authorized: true, userId: data.user.id };
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

function extractTextFromGeminiResponse(result: any): string {
  if (result.candidates?.length > 0 && result.candidates[0].content?.parts?.length > 0) {
    return (result.candidates[0].content.parts[0].text || "").trim();
  }
  return "";
}

async function extractViaLovableGateway(pdfBytes: Uint8Array): Promise<string> {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

  console.log("[process-book] 🔍 Using Lovable AI Gateway for OCR...");
  const base64Pdf = pdfToBase64(pdfBytes);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Extract ALL text from this PDF document. Preserve page structure and formatting. Include all headings, paragraphs, bullet points, tables, and any other text content. Output only the extracted text, nothing else." },
          { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64Pdf}` } },
        ],
      }],
      max_tokens: 65536,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[process-book] Lovable AI Gateway error:", response.status, errorText);
    throw new Error(`Lovable AI Gateway OCR failed: ${response.status}`);
  }

  const result = await response.json();
  const text = result.choices?.[0]?.message?.content || "";
  if (!text || text.length < 50) throw new Error("Lovable AI Gateway returned insufficient text");

  console.log(`[process-book] ✅ Lovable Gateway OCR extracted ${text.length} characters`);
  return text.trim();
}

async function extractViaGeminiDirect(pdfBytes: Uint8Array, apiKey: string, retries = 1): Promise<string> {
  console.log("[process-book] 🔍 Using direct Gemini Vision OCR...");
  const base64Pdf = pdfToBase64(pdfBytes);

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: "Extract ALL text from this PDF document. Preserve page structure and formatting. Include all headings, paragraphs, bullet points, tables, and any other text. Output only the extracted text, nothing else." },
            { inline_data: { mime_type: "application/pdf", data: base64Pdf } },
          ] }],
          generationConfig: { maxOutputTokens: 65536, temperature: 0.1 },
        }),
      }
    );

    if (response.ok) {
      const result = await response.json();
      const text = extractTextFromGeminiResponse(result);
      if (text && text.length >= 50) {
        console.log(`[process-book] ✅ Direct Gemini OCR extracted ${text.length} characters`);
        return text;
      }
      throw new Error("Gemini Vision OCR returned insufficient text");
    }

    if (response.status === 429 && attempt < retries) {
      const errorBody = await response.text();
      console.warn(`[process-book] ⚠️ Gemini rate limited (attempt ${attempt + 1}). Retrying in 55s...`);
      await new Promise(resolve => setTimeout(resolve, 55000));
      continue;
    }

    const errorText = await response.text();
    throw new Error(`Gemini Vision OCR failed: ${response.status} - ${errorText}`);
  }

  throw new Error("Gemini Vision OCR exhausted all retries");
}

async function extractTextWithVisionOCR(pdfBytes: Uint8Array, geminiApiKey: string): Promise<string> {
  try {
    return await extractViaLovableGateway(pdfBytes);
  } catch (gatewayError) {
    console.warn(`[process-book] Lovable Gateway failed: ${gatewayError instanceof Error ? gatewayError.message : gatewayError}`);
  }

  try {
    return await extractViaGeminiDirect(pdfBytes, geminiApiKey, 1);
  } catch (geminiError) {
    console.error(`[process-book] Direct Gemini also failed: ${geminiError instanceof Error ? geminiError.message : geminiError}`);
  }

  const altKey = Deno.env.get("EXTERNAL_JOBS_GEMINI_KEY");
  if (altKey && altKey !== geminiApiKey) {
    console.log("[process-book] Trying EXTERNAL_JOBS_GEMINI_KEY as final fallback...");
    return await extractViaGeminiDirect(pdfBytes, altKey, 0);
  }

  throw new Error("All OCR methods failed. Your Gemini API free tier quota may be exhausted.");
}

async function extractPdfContent(fileUrl: string, apiKey: string): Promise<{ text: string; pageCount: number; method: "native" | "vision-ocr" }> {
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
  const ocrText = await extractTextWithVisionOCR(pdfBytes, apiKey);

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

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  let lastError = "";
  for (const model of EMBEDDING_MODELS) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `models/${model}`,
          content: { parts: [{ text }] },
          outputDimensionality: 768,
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.embedding?.values) return data.embedding.values;
    }

    const errorText = await response.text();
    if (response.status === 404) {
      console.warn(`[process-book] Embedding model ${model} not found, trying next...`);
      lastError = errorText;
      continue;
    }

    console.error(`Gemini embedding error (${model}):`, errorText);
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }
  throw new Error(`No embedding model available. Last error: ${lastError}`);
}

async function generateEmbeddingsBatch(chunks: string[], apiKey: string): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i], apiKey);
    embeddings.push(embedding);
    if ((i + 1) % 10 === 0) console.log(`Generated embeddings: ${i + 1}/${chunks.length}`);
    if (i < chunks.length - 1) await new Promise(resolve => setTimeout(resolve, 100));
  }
  return embeddings;
}

// Background processing logic
async function processInBackground(documentId: string, fileUrl: string, title: string | undefined, GEMINI_API_KEY: string, supabase: any) {
  const startTime = Date.now();
  console.log(`[process-book] 🔥 BACKGROUND JOB STARTED for: ${documentId}`);
  
  try {
    // Step 1: Extract text
    const { text, pageCount, method } = await extractPdfContent(fileUrl, GEMINI_API_KEY);
    console.log(`[process-book] Extracted ${text.length} chars from ${pageCount} pages via ${method}`);

    if (!text || text.length < 100) {
      throw new Error("PDF appears to be empty or contains very little extractable text");
    }

    // Check for timeout (>10 minutes)
    if (Date.now() - startTime > 10 * 60 * 1000) {
      throw new Error('Processing timeout (>10 minutes)');
    }

    // Step 2: Chunk
    const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);
    console.log(`[process-book] Created ${chunks.length} chunks`);
    if (chunks.length === 0) throw new Error("No valid text chunks could be extracted");

    // Step 3: Quota check
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

    // Step 4: Generate embeddings
    console.log("[process-book] Generating embeddings...");
    const embeddings = await generateEmbeddingsBatch(chunks, GEMINI_API_KEY);
    console.log(`[process-book] Generated ${embeddings.length} embeddings`);

    // Step 5: Insert sections
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

    // Step 6: Update status to completed
    await supabase.from("documents").update({ status: "completed", page_count: pageCount }).eq("id", documentId);
    console.log(`[process-book] ✅ BACKGROUND JOB COMPLETED for: ${documentId} — ${chunks.length} sections via ${method} in ${Math.round((Date.now() - startTime) / 1000)}s`);

  } catch (error) {
    console.error(`[process-book] 🔴 BACKGROUND JOB FAILED for: ${documentId}`, error);
    await supabase.from("documents").update({ status: "failed" }).eq("id", documentId);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authorization check
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

    console.log(`[process-book] Processing document: ${documentId} (background mode)`);

    // Update status to processing
    await supabase.from("documents").update({ status: "processing" }).eq("id", documentId);

    // Offload heavy work to background via EdgeRuntime.waitUntil
    try {
      // @ts-ignore - EdgeRuntime.waitUntil is available in Supabase Edge Functions
      EdgeRuntime.waitUntil(processInBackground(documentId, fileUrl, title, GEMINI_API_KEY, supabase));
      console.log(`[process-book] waitUntil() accepted background job for: ${documentId}`);
    } catch (waitUntilError) {
      console.error(`[process-book] waitUntil() REJECTED, running inline:`, waitUntilError);
      // Fallback: run synchronously (may timeout for large files but works for small ones)
      await processInBackground(documentId, fileUrl, title, GEMINI_API_KEY, supabase);
    }

    // Return 202 immediately
    return new Response(
      JSON.stringify({
        success: true,
        status: "processing",
        documentId,
        message: "Document processing started in background",
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
      // Ignore errors when updating status
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", details: "Failed to process book" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
