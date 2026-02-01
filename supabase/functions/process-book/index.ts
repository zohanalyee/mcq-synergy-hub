import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getDocument } from "https://esm.sh/pdfjs-serverless@0.4.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Configuration
const CHUNK_SIZE = 1000; // characters per chunk
const CHUNK_OVERLAP = 200; // overlap between chunks
const EMBEDDING_MODEL = "text-embedding-004"; // Google's 768-dim model
const MAX_PDF_SIZE = 25 * 1024 * 1024; // 25MB

interface ProcessRequest {
  documentId: string;
  fileUrl: string;
  title?: string;
}

// Fetch and parse PDF from URL
async function extractTextFromPdf(fileUrl: string): Promise<{ text: string; pageCount: number }> {
  console.log(`Fetching PDF from: ${fileUrl}`);
  
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_PDF_SIZE) {
    throw new Error(`PDF file too large (${Math.round(parseInt(contentLength) / 1024 / 1024)}MB). Maximum is ${MAX_PDF_SIZE / 1024 / 1024}MB.`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  
  console.log(`PDF downloaded: ${data.length} bytes`);

  // Parse PDF with pdfjs-serverless
  const doc = await getDocument(data).promise;
  const pageCount = doc.numPages;
  
  console.log(`PDF has ${pageCount} pages`);

  let fullText = "";
  
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    const pageText = textContent.items
      .map((item: { str?: string }) => item.str || "")
      .join(" ");
    
    fullText += pageText + "\n\n";
    
    // Log progress for debugging
    if (pageNum % 10 === 0) {
      console.log(`Extracted text from page ${pageNum}/${pageCount}`);
    }
  }

  return {
    text: fullText.trim(),
    pageCount,
  };
}

// Split text into overlapping chunks
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    
    if (chunk.length > 50) { // Only add chunks with meaningful content
      chunks.push(chunk);
    }
    
    start += chunkSize - overlap;
  }
  
  return chunks;
}

// Generate embedding using Google Gemini API
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: {
          parts: [{ text }],
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Gemini API error:", error);
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  if (!data.embedding?.values) {
    throw new Error("No embedding returned from Gemini API");
  }

  return data.embedding.values;
}

// Batch generate embeddings with rate limiting
async function generateEmbeddingsBatch(
  chunks: string[],
  apiKey: string
): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i], apiKey);
    embeddings.push(embedding);
    
    // Log progress
    if ((i + 1) % 10 === 0) {
      console.log(`Generated embeddings: ${i + 1}/${chunks.length}`);
    }
    
    // Rate limiting: 60 requests per minute for free tier
    // Add small delay between requests
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return embeddings;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { documentId, fileUrl, title } = await req.json() as ProcessRequest;

    if (!documentId || !fileUrl) {
      return new Response(
        JSON.stringify({ error: "documentId and fileUrl are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing document: ${documentId}`);
    console.log(`File URL: ${fileUrl}`);

    // Update document status to processing
    await supabase
      .from("documents")
      .update({ status: "processing" })
      .eq("id", documentId);

    // Step 1: Fetch and extract text from PDF (server-side)
    const { text, pageCount } = await extractTextFromPdf(fileUrl);
    console.log(`Extracted ${text.length} characters from ${pageCount} pages`);

    if (!text || text.length < 100) {
      throw new Error("PDF appears to be empty or contains very little extractable text");
    }

    // Step 2: Chunk the text
    const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);
    console.log(`Created ${chunks.length} chunks`);

    if (chunks.length === 0) {
      throw new Error("No valid text chunks could be extracted");
    }

    // Step 3: Generate embeddings for all chunks
    console.log("Generating embeddings with Gemini...");
    const embeddings = await generateEmbeddingsBatch(chunks, GEMINI_API_KEY);
    console.log(`Generated ${embeddings.length} embeddings`);

    // Step 4: Prepare sections for insertion
    const sections = chunks.map((content, index) => ({
      document_id: documentId,
      content,
      embedding: JSON.stringify(embeddings[index]), // pgvector accepts JSON array
      section_index: index,
      token_count: Math.ceil(content.length / 4), // Rough token estimate
    }));

    // Step 5: Insert sections into database
    const { error: insertError } = await supabase
      .from("document_sections")
      .insert(sections);

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to insert sections: ${insertError.message}`);
    }

    // Step 6: Update document status to completed
    await supabase
      .from("documents")
      .update({ 
        status: "completed",
        page_count: chunks.length 
      })
      .eq("id", documentId);

    console.log(`Successfully processed document ${documentId} with ${chunks.length} sections`);

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        pagesExtracted: pageCount,
        chunksProcessed: chunks.length,
        embeddingDimension: embeddings[0]?.length || 768,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process book error:", error);
    
    // Try to update document status to failed
    try {
      const body = await req.clone().json();
      if (body?.documentId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from("documents")
          .update({ status: "failed" })
          .eq("id", body.documentId);
      }
    } catch {
      // Ignore errors when updating status
    }
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Failed to process book"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
