import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMBEDDING_MODELS = ["text-embedding-005", "text-embedding-004"];
const MAX_QUERY_LENGTH = 300;
const DEFAULT_MATCH_COUNT = 4;
const MATCH_THRESHOLD = 0.75;

interface SearchRequest {
  query: string;
  matchCount?: number;
  documentId?: string; // Optional: filter by specific document
}

interface SearchResult {
  content: string;
  document_id: string;
  similarity: number;
  page_number: number | null;
  title: string;
}

// Generate embedding using Google Gemini API with model fallback
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
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.embedding?.values) return data.embedding.values;
    }

    if (response.status === 404) {
      const err = await response.text();
      console.warn(`Embedding model ${model} not found, trying next...`);
      continue;
    }

    const error = await response.text();
    console.error("Gemini API error:", error);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  throw new Error("No embedding model available");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

     // ============= AUTHENTICATION CHECK =============
     const authHeader = req.headers.get("Authorization");
     if (!authHeader?.startsWith("Bearer ")) {
       return new Response(
         JSON.stringify({ error: "Authentication required" }),
         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const token = authHeader.replace("Bearer ", "");
     const { data: userData, error: authError } = await supabase.auth.getUser(token);
     
     if (authError || !userData?.user) {
       return new Response(
         JSON.stringify({ error: "Invalid authentication token" }),
         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const userId = userData.user.id;
 
    const body = await req.json() as SearchRequest;
    const { query, matchCount = DEFAULT_MATCH_COUNT, documentId } = body;

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

    console.log(`Search query: "${trimmedQuery.substring(0, 50)}..." (${trimmedQuery.length} chars)`);

    // Generate embedding for the query
    console.log("Generating query embedding...");
    const queryEmbedding = await generateEmbedding(trimmedQuery, GEMINI_API_KEY);
    console.log(`Generated embedding with ${queryEmbedding.length} dimensions`);

    // Perform vector similarity search using RPC
    console.log("Performing vector search...");
    const { data: sections, error: searchError } = await supabase.rpc(
      "match_document_sections",
      {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: MATCH_THRESHOLD,
        match_count: Math.min(matchCount, 10), // Cap at 10 results
        filter_document_id: documentId || null,
      }
    );

    if (searchError) {
      console.error("Search error:", searchError);
      throw new Error(`Vector search failed: ${searchError.message}`);
    }

    if (!sections || sections.length === 0) {
      console.log("No matching sections found");
      
      // Log the search attempt
      await supabase.from("ai_usage_logs").insert({
        source_type: "document_search",
        questions_requested: 0,
        questions_fetched: 0,
        questions_saved: 0,
        metadata: {
          query: trimmedQuery.substring(0, 100),
          matchCount,
          resultsFound: 0,
          duration_ms: Date.now() - startTime,
        },
      });

      return new Response(
        JSON.stringify({ 
          results: [],
          message: "No matching documents found for your query"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch document titles for the results
    const documentIds = [...new Set(sections.map((s: any) => s.document_id))];
    const { data: documents } = await supabase
      .from("documents")
      .select("id, title")
      .in("id", documentIds);

    const titleMap = new Map(documents?.map((d: any) => [d.id, d.title]) || []);

    // Format results
    const results: SearchResult[] = sections.map((section: any) => ({
      content: section.content,
      document_id: section.document_id,
      similarity: Math.round(section.similarity * 100) / 100, // Round to 2 decimals
      page_number: section.page_number,
      title: titleMap.get(section.document_id) || "Untitled Document",
    }));

    console.log(`Found ${results.length} matching sections`);

    // Log the successful search
    await supabase.from("ai_usage_logs").insert({
      source_type: "document_search",
       triggered_by_user_id: userId,
      questions_requested: matchCount,
      questions_fetched: results.length,
      questions_saved: results.length,
      metadata: {
        query: trimmedQuery.substring(0, 100),
        matchCount,
        resultsFound: results.length,
        topSimilarity: results[0]?.similarity || 0,
        duration_ms: Date.now() - startTime,
      },
    });

    return new Response(
      JSON.stringify({
        results,
        query: trimmedQuery,
        totalResults: results.length,
        searchTime: Date.now() - startTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Search documents error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Failed to search documents"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
