import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { callAIWithAutoSwitch, callGeminiEmbedding } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_QUERY_LENGTH = 500;

const DEFAULT_TOP_K = 5;
const MATCH_THRESHOLD = 0.70;

 // Rate limiting: track requests per user (simple in-memory, resets on cold start)
 const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
 const RATE_LIMIT_MAX = 20; // Max requests per window
 const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
 
 function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
   const now = Date.now();
   const entry = rateLimitMap.get(userId);
   
   if (!entry || now > entry.resetAt) {
     rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
     return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
   }
   
   if (entry.count >= RATE_LIMIT_MAX) {
     return { allowed: false, remaining: 0 };
   }
   
   entry.count++;
   return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
 }
 
interface SearchRequest {
  query: string;
  documentIds?: string[];
  topK?: number;
}

interface SearchResult {
  content: string;
  document_id: string;
  similarity: number;
  page_number: number | null;
  title: string;
}

// Generate answer using shared AI helper (Gemini + Lovable Gateway fallback + logged)
async function generateAnswer(
  query: string,
  context: string,
  supabase: any
): Promise<string> {
  const systemPrompt = `You are an academic assistant helping students understand their course material.

STRICT RULES:
1. Answer ONLY using the provided document context below
2. Do NOT add any external knowledge or information
3. If the answer is not present in the context, respond exactly with: "This information is not available in the uploaded documents."
4. Be concise, clear, and student-friendly
5. If partially relevant information exists, share it but note any limitations

CONTEXT FROM UPLOADED DOCUMENTS:
${context}`;

  const userPrompt = `Question: ${query}\n\nPlease answer based only on the document context provided.`;
  const { text } = await callAIWithAutoSwitch(
    systemPrompt,
    userPrompt,
    { temperature: 0.3, maxOutputTokens: 1024 },
    { supabaseClient: supabase, sourceType: "rag_search" }
  );
  if (!text) throw new Error("No answer generated");
  return text;
}


serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);


     // ============= MANDATORY AUTHENTICATION =============
     const authHeader = req.headers.get("Authorization");
     if (!authHeader?.startsWith("Bearer ")) {
       return new Response(
         JSON.stringify({ error: "Unauthorized: Authentication required to search documents" }),
         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
     const token = authHeader.replace("Bearer ", "");
     const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
       global: { headers: { Authorization: authHeader } },
     });
     const { data: claimsData, error: claimsError } = await (supabaseAuth.auth as any).getClaims(token);
     if (claimsError || !claimsData?.claims?.sub) {
       return new Response(
         JSON.stringify({ error: "Unauthorized: Invalid or expired token" }),
         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
     const userId: string = claimsData.claims.sub;
 
     // ============= RATE LIMITING (by userId or IP) =============
     const rateLimitKey = userId || req.headers.get("x-forwarded-for") || "anonymous";
     const rateCheck = checkRateLimit(rateLimitKey);
     if (!rateCheck.allowed) {
       console.log(`[rag-search] ⛔ Rate limited: ${rateLimitKey}`);
       return new Response(
         JSON.stringify({ error: "Too many requests. Please wait before trying again." }),
         { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "X-RateLimit-Remaining": "0" } }
       );
     }
 
    const body = await req.json() as SearchRequest;
    const { query, documentIds, topK = DEFAULT_TOP_K } = body;

    // Validation
    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "Query is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length === 0) {
      return new Response(
        JSON.stringify({ error: "Query cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (trimmedQuery.length > MAX_QUERY_LENGTH) {
      return new Response(
        JSON.stringify({ 
          error: `Query too long. Maximum ${MAX_QUERY_LENGTH} characters allowed.`,
          currentLength: trimmedQuery.length
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`RAG query: "${trimmedQuery.substring(0, 50)}..." (${trimmedQuery.length} chars)`);

    // Step 1: Generate embedding for user query
    console.log("Generating query embedding...");
    const queryEmbedding = await callGeminiEmbedding(trimmedQuery, { logCtx: { supabaseClient: supabase, sourceType: "rag_search" } });


    // Step 2: Vector similarity search
    console.log("Performing vector search...");
    
    // Use the existing match_document_sections RPC or direct query
    let sections: any[] = [];
    
    if (documentIds && documentIds.length > 0) {
      // Filter by specific documents
      for (const docId of documentIds) {
        const { data, error } = await supabase.rpc(
          "match_document_sections",
          {
            query_embedding: JSON.stringify(queryEmbedding),
            match_threshold: MATCH_THRESHOLD,
            match_count: topK,
            filter_document_id: docId,
          }
        );
        if (data && !error) {
          sections.push(...data);
        }
      }
      // Sort by similarity and take top K
      sections.sort((a, b) => b.similarity - a.similarity);
      sections = sections.slice(0, topK);
    } else {
      // Search across all documents
      const { data, error } = await supabase.rpc(
        "match_document_sections",
        {
          query_embedding: JSON.stringify(queryEmbedding),
          match_threshold: MATCH_THRESHOLD,
          match_count: topK,
          filter_document_id: null,
        }
      );
      if (error) {
        console.error("Search error:", error);
        throw new Error(`Vector search failed: ${error.message}`);
      }
      sections = data || [];
    }

    // Step 3: Check if we found relevant chunks
    if (!sections || sections.length === 0) {
      console.log("No matching sections found");
      
      // Log the failed search
      await supabase.from("ai_usage_logs").insert({
        source_type: "rag_search",
        questions_requested: 1,
        questions_fetched: 0,
        questions_saved: 0,
        metadata: {
          query: trimmedQuery.substring(0, 100),
          topK,
          resultsFound: 0,
          status: "no_matches",
          duration_ms: Date.now() - startTime,
        },
      });

      return new Response(
        JSON.stringify({ 
          answer: "This information is not available in the uploaded documents. Please try rephrasing your question or check if the relevant document has been uploaded.",
          sources: [],
          query: trimmedQuery,
          searchTime: Date.now() - startTime,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4: Fetch document titles
    const documentIdSet = [...new Set(sections.map((s: any) => s.document_id))];
    const { data: documents } = await supabase
      .from("documents")
      .select("id, title")
      .in("id", documentIdSet);

    const titleMap = new Map(documents?.map((d: any) => [d.id, d.title]) || []);

    // Step 5: Build context from retrieved chunks
    const contextParts = sections.map((section: any, index: number) => {
      const title = titleMap.get(section.document_id) || "Unknown Document";
      const pageInfo = section.page_number ? ` (Page ${section.page_number})` : "";
      return `[Source ${index + 1}: ${title}${pageInfo}]\n${section.content}`;
    });
    
    const context = contextParts.join("\n\n---\n\n");
    console.log(`Built context from ${sections.length} chunks (${context.length} chars)`);

    // Step 6: Generate answer using Gemini
    console.log("Generating answer...");
    const answer = await generateAnswer(trimmedQuery, context, GEMINI_API_KEY);
    console.log(`Generated answer: ${answer.length} chars`);

    // Step 7: Format sources for response
    const sources = sections.map((section: any) => ({
      documentId: section.document_id,
      title: titleMap.get(section.document_id) || "Unknown Document",
      pageNumber: section.page_number,
      similarity: Math.round(section.similarity * 100) / 100,
      excerpt: section.content.substring(0, 150) + (section.content.length > 150 ? "..." : ""),
    }));

    // Step 8: Log successful search
    await supabase.from("ai_usage_logs").insert({
      source_type: "rag_search",
       triggered_by_user_id: userId,
      questions_requested: 1,
      questions_fetched: sections.length,
      questions_saved: 1,
      metadata: {
        query: trimmedQuery.substring(0, 100),
        topK,
        resultsFound: sections.length,
        topSimilarity: sections[0]?.similarity || 0,
        answerLength: answer.length,
        status: "success",
        duration_ms: Date.now() - startTime,
      },
    });

    return new Response(
      JSON.stringify({
        answer,
        sources,
        query: trimmedQuery,
        searchTime: Date.now() - startTime,
      }),
       { headers: { ...corsHeaders, "Content-Type": "application/json", "X-RateLimit-Remaining": String(rateCheck.remaining) } }
    );

  } catch (error) {
    console.error("RAG search error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Failed to process your question. Please try again."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
