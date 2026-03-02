import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { checkQuota, retryWithBackoff, quotaExhaustedResponse, QuotaExhaustedError } from '../_shared/quotaManager.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MCQQuestion {
  title: string;
  options: { A: string; B: string; C: string; D: string };
  correct_option: string;
  explanation: string;
  difficulty: string;
}

 // Helper: Verify admin authorization
 async function verifyAdmin(req: Request, supabase: any): Promise<{ authorized: boolean; userId?: string; error?: string }> {
   const authHeader = req.headers.get("Authorization");
   
   // Allow service role calls (from scheduled jobs)
   const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
   if (authHeader?.includes(serviceKey || "")) {
     return { authorized: true, userId: "service_role" };
   }
 
   // Allow admin trigger header (from scheduled-autofill)
   if (req.headers.get("x-admin-trigger") === "true" && authHeader?.startsWith("Bearer ")) {
     return { authorized: true, userId: "admin_trigger" };
   }
 
   // Verify JWT for regular calls
   if (!authHeader?.startsWith("Bearer ")) {
     return { authorized: false, error: "Missing or invalid authorization header" };
   }
 
   const token = authHeader.replace("Bearer ", "");
   const { data, error } = await supabase.auth.getUser(token);
   
   if (error || !data?.user) {
     return { authorized: false, error: "Invalid token" };
   }
 
   // Check if user is admin
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

import { callGeminiText } from '../_shared/gemini.ts';

// Wrapper for backward compatibility
async function callGeminiAI(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<string> {
  return callGeminiText(apiKey, systemPrompt, userPrompt, {
    temperature: 0.7,
    maxOutputTokens: 8192,
  });
}

function parseJSONFromResponse(text: string): MCQQuestion[] {
  // Try to extract JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      console.error("Failed to parse JSON array");
    }
  }

  // Try parsing the whole response
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    console.error("Failed to parse response as JSON");
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
     const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
     const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
     const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 
     if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
       throw new Error("Missing required environment variables (GEMINI_API_KEY)");
     }
 
     const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
 
     // ============= AUTHORIZATION CHECK =============
     const auth = await verifyAdmin(req, supabase);
     if (!auth.authorized) {
       console.log(`[generate-from-rag] ⛔ Unauthorized: ${auth.error}`);
       return new Response(
         JSON.stringify({ error: auth.error }),
         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
     console.log(`[generate-from-rag] ✅ Authorized: ${auth.userId}`);

    // ============= QUOTA CHECK =============
    try {
      const quota = await checkQuota(supabase);
      console.log(`[generate-from-rag] 📊 Quota remaining: ${quota.remaining}`);
    } catch (err) {
      if (err instanceof QuotaExhaustedError) {
        return quotaExhaustedResponse(corsHeaders);
      }
      throw err;
    }
 
    const {
      topic_id,
       document_id, // Optional: for backward compatibility
      subject,
      topic,
       topic_name,
       subject_name,
      count = 10,
      difficulty_distribution = { easy: 4, medium: 4, hard: 2 },
    } = await req.json();

     // topic_id is now the primary required parameter
     if (!topic_id) {
      return new Response(
         JSON.stringify({ error: "topic_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

     // Resolve subject/topic names from topic_id if not provided
     let subjectName = subject || subject_name;
     let topicName = topic || topic_name;
     
     if (!subjectName || !topicName) {
       const { data: topicData } = await supabase
         .from("topics")
         .select("name, subjects!inner(name)")
         .eq("id", topic_id)
         .single();
       
       if (topicData) {
         topicName = topicName || topicData.name;
         const subjectData = Array.isArray(topicData.subjects) ? topicData.subjects[0] : topicData.subjects;
         subjectName = subjectName || subjectData?.name || "General";
       }
    }

     // ============= STEP 1: Resolve document_id from topic_id =============
     let targetDocumentId = document_id;
     
     if (!targetDocumentId) {
       // Find documents linked to this topic
       const { data: documents, error: docError } = await supabase
         .from("documents")
         .select("id, title")
         .eq("topic_id", topic_id)
         .eq("status", "completed")
         .order("created_at", { ascending: false })
         .limit(1);
 
       if (docError) {
         throw new Error(`Failed to fetch documents: ${docError.message}`);
       }
 
       if (!documents || documents.length === 0) {
         console.log(`[generate-from-rag] No documents found for topic: ${topic_id}`);
         return new Response(
           JSON.stringify({ 
             error: "No RAG documents found for this topic. Please upload a document first.",
             error_type: "no_rag_data",
             topic_id,
             has_documents: false
           }),
           { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
 
       targetDocumentId = documents[0].id;
       console.log(`[generate-from-rag] Resolved document: ${targetDocumentId} (${documents[0].title})`);
     }
 
     // ============= STEP 2: Fetch document sections =============
     console.log(`[generate-from-rag] Fetching chunks for document: ${targetDocumentId}`);
     const { data: sections, error: sectionsError } = await supabase
       .from("document_sections")
       .select("content")
       .eq("document_id", targetDocumentId)
       .order("section_index")
       .limit(20);

    if (sectionsError) {
      throw new Error(`Failed to fetch document sections: ${sectionsError.message}`);
    }

    if (!sections || sections.length === 0) {
      return new Response(
         JSON.stringify({ error: "No content chunks found in document. Try re-processing the PDF." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

     // ============= STEP 3: Combine chunks into context =============
    const context = sections.map(s => s.content).join("\n\n---\n\n");
     console.log(`[generate-from-rag] Using ${sections.length} chunks, total: ${context.length} chars`);

     // ============= STEP 4: Build MCQ generation prompt =============
    const systemPrompt = `You are an expert MCQ question generator for educational content.
Your task is to create high-quality multiple choice questions based ONLY on the provided document context.

RULES:
1. Generate questions ONLY from the provided context - do not add external knowledge
2. Each question must have exactly 4 options (A, B, C, D)
3. Only ONE option should be correct
4. Provide a brief explanation for the correct answer
5. Distribute difficulty as specified
6. Questions should test understanding, not just recall

OUTPUT FORMAT:
Return ONLY a valid JSON array with this structure:
[
  {
    "title": "The question text",
    "options": { "A": "First option", "B": "Second option", "C": "Third option", "D": "Fourth option" },
    "correct_option": "A",
    "explanation": "Brief explanation why A is correct",
    "difficulty": "Easy"
  }
]`;

    const userPrompt = `Generate ${count} multiple-choice questions from the following educational content.

 SUBJECT: ${subjectName || "General"}
 TOPIC: ${topicName || "General"}

DIFFICULTY DISTRIBUTION:
- Easy: ${difficulty_distribution.easy} questions
- Medium: ${difficulty_distribution.medium} questions
- Hard: ${difficulty_distribution.hard} questions

DOCUMENT CONTENT:
${context.substring(0, 15000)}

Generate exactly ${count} questions. Return ONLY the JSON array, no other text.`;

     // ============= STEP 5: Generate MCQs using Direct Gemini API =============
     console.log("[generate-from-rag] Generating MCQs via direct Gemini API...");
    const responseText = await retryWithBackoff(
      () => callGeminiAI(systemPrompt, userPrompt, GEMINI_API_KEY),
      2,
      'generate-from-rag MCQ generation'
    );
    
     // ============= STEP 6: Parse response =============
    const questions = parseJSONFromResponse(responseText);
     console.log(`[generate-from-rag] Parsed ${questions.length} questions`);

    if (questions.length === 0) {
      return new Response(
        JSON.stringify({ error: "Failed to generate valid questions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

     // ============= STEP 7: Save questions to content_items =============
    let savedCount = 0;
    const errors: string[] = [];

    for (const q of questions) {
      try {
         // Normalize difficulty to title case
         const normalizedDifficulty = q.difficulty 
           ? q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1).toLowerCase()
           : "Medium";
 
        const { error: insertError } = await supabase.from("content_items").insert({
          title: q.title,
          description: q.title,
          category: "mcq",
          status: "approved",
           subject: subjectName,
           topic: topicName,
          topic_id: topic_id,
           difficulty: normalizedDifficulty,
          options: q.options,
          correct_option: q.correct_option,
          explanation: q.explanation,
          source_type: "rag_generated",
           source_document_id: targetDocumentId,
          show_in_subjects: true,
          show_in_syllabus: true,
          show_in_mock_tests: true,
        });

        if (insertError) {
          errors.push(`Insert error: ${insertError.message}`);
        } else {
          savedCount++;
        }
      } catch (err) {
        errors.push(`Save error: ${(err as Error).message}`);
      }
    }

     // ============= STEP 8: Log usage =============
    await supabase.from("ai_usage_logs").insert({
      source_type: "rag_mcq_generation",
       subject: subjectName,
       topic: topicName,
      questions_requested: count,
      questions_fetched: questions.length,
      questions_saved: savedCount,
       triggered_by_user_id: auth.userId === "service_role" || auth.userId === "admin_trigger" ? null : auth.userId,
       metadata: { document_id: targetDocumentId, topic_id, errors: errors.length > 0 ? errors : undefined },
    });

     console.log(`[generate-from-rag] ✅ Saved ${savedCount}/${questions.length} questions`);

    return new Response(
      JSON.stringify({
        success: true,
        questions_generated: questions.length,
        questions_saved: savedCount,
         topic_id,
         document_id: targetDocumentId,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-from-rag error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
