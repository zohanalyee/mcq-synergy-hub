import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";
import { PDFDocument } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_SIZE = 15;
const PAGES_PER_INVOCATION = 50;
const EMBEDDING_MODELS = ["gemini-embedding-001", "text-embedding-005", "text-embedding-004"];
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

function pdfToBase64(pdfBytes: Uint8Array): string {
  let raw = "";
  const STEP = 32768;
  for (let i = 0; i < pdfBytes.length; i += STEP) {
    const slice = pdfBytes.subarray(i, Math.min(i + STEP, pdfBytes.length));
    raw += String.fromCharCode(...slice);
  }
  return btoa(raw);
}

async function extractPageRange(pdfBytes: Uint8Array, startPage: number, endPage: number): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const newDoc = await PDFDocument.create();
  const indices = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage - 1 + i);
  const pages = await newDoc.copyPages(srcDoc, indices);
  pages.forEach(page => newDoc.addPage(page));
  return new Uint8Array(await newDoc.save());
}

async function ocrBatch(pdfBytes: Uint8Array, startPage: number, endPage: number): Promise<string> {
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

  if (!geminiApiKey) {
    console.error("[queue] GEMINI_API_KEY not configured");
    return "";
  }

  const batchBytes = await extractPageRange(pdfBytes, startPage, endPage);
  const batchBase64 = pdfToBase64(batchBytes);

  // Direct Gemini API call
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: `Extract ALL text from pages ${startPage}-${endPage}. Preserve structure. Output only the extracted text.` },
          { inline_data: { mime_type: "application/pdf", data: batchBase64 } },
        ] }],
        generationConfig: { maxOutputTokens: 16384, temperature: 0.1 },
      }),
    }
  );
  if (response.ok) {
    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
  const errText = await response.text();
  console.warn(`[queue] Gemini OCR failed: ${response.status} ${errText.substring(0, 200)}`);

  return "";
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
    if (response.status !== 404) {
      const errorText = await response.text();
      throw new Error(`Embedding error: ${response.status} - ${errorText}`);
    }
  }
  throw new Error("No embedding model available");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get next pending job
    const { data: job, error: fetchError } = await supabase
      .from("pdf_processing_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!job) {
      return new Response(JSON.stringify({ message: "No pending jobs" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[queue] Processing job ${job.id}: document ${job.document_id}, pages ${job.processed_pages}/${job.total_pages}`);

    // Mark as processing
    await supabase.from("pdf_processing_queue")
      .update({ status: "processing" })
      .eq("id", job.id);

    const startPage = job.processed_pages + 1;
    const endPage = Math.min(startPage + PAGES_PER_INVOCATION - 1, job.total_pages);

    // Download PDF
    const pdfResponse = await fetch(job.file_url);
    if (!pdfResponse.ok) throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
    const pdfBytes = new Uint8Array(await pdfResponse.arrayBuffer());

    // OCR this batch of pages in sub-batches of BATCH_SIZE
    let batchText = "";
    const subBatches = Math.ceil((endPage - startPage + 1) / BATCH_SIZE);

    for (let i = 0; i < subBatches; i++) {
      const subStart = startPage + i * BATCH_SIZE;
      const subEnd = Math.min(subStart + BATCH_SIZE - 1, endPage);
      console.log(`[queue] Sub-batch ${i + 1}/${subBatches}: pages ${subStart}-${subEnd}`);

      try {
        const text = await ocrBatch(pdfBytes, subStart, subEnd);
        batchText += text + "\n\n";
        console.log(`[queue] Sub-batch ${i + 1} extracted ${text.length} chars`);
      } catch (e) {
        console.warn(`[queue] Sub-batch ${i + 1} failed:`, e instanceof Error ? e.message : e);
      }

      if (i < subBatches - 1) await new Promise(r => setTimeout(r, 500));
    }

    const newProcessedPages = endPage;
    const newText = (job.extracted_text || "") + batchText;
    const isComplete = newProcessedPages >= job.total_pages;

    if (isComplete) {
      console.log(`[queue] ✅ All pages processed for ${job.document_id}. Generating embeddings...`);

      // Chunk and embed
      const chunks = chunkText(newText, CHUNK_SIZE, CHUNK_OVERLAP);
      console.log(`[queue] Created ${chunks.length} chunks`);

      const embeddings: number[][] = [];
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await generateEmbedding(chunks[i], geminiApiKey);
        embeddings.push(embedding);
        if ((i + 1) % 10 === 0) console.log(`[queue] Embeddings: ${i + 1}/${chunks.length}`);
        if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 100));
      }

      const sections = chunks.map((content, index) => ({
        document_id: job.document_id,
        content,
        embedding: JSON.stringify(embeddings[index]),
        section_index: index,
        token_count: Math.ceil(content.length / 4),
      }));

      const { error: insertError } = await supabase.from("document_sections").insert(sections);
      if (insertError) throw new Error(`Insert sections failed: ${insertError.message}`);

      // Mark queue complete
      await supabase.from("pdf_processing_queue")
        .update({ status: "completed", processed_pages: newProcessedPages, extracted_text: "" })
        .eq("id", job.id);

      // Update document
      await supabase.from("documents")
        .update({ status: "completed", page_count: job.total_pages })
        .eq("id", job.document_id);

      console.log(`[queue] ✅ Job ${job.id} COMPLETED: ${chunks.length} sections created`);
    } else {
      // More pages remaining
      await supabase.from("pdf_processing_queue")
        .update({
          status: "pending",
          processed_pages: newProcessedPages,
          current_batch: (job.current_batch || 0) + 1,
          extracted_text: newText,
        })
        .eq("id", job.id);

      console.log(`[queue] Job ${job.id}: processed pages ${startPage}-${endPage}. ${job.total_pages - newProcessedPages} pages remaining.`);
    }

    return new Response(JSON.stringify({
      success: true,
      job_id: job.id,
      document_id: job.document_id,
      processed_pages: newProcessedPages,
      total_pages: job.total_pages,
      is_complete: isComplete,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[queue] Error:", error);

    // Try to mark the job as failed
    try {
      const body = await req.clone().json().catch(() => null);
      // If we have job context, mark it failed
    } catch {}

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
