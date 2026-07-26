import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { callAIWithAutoSwitch } from "../_shared/gemini.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};



const categoryPrompts: Record<string, string> = {
  job: `Extract these fields from the job advertisement:
- title: Professional job title (e.g., "Assistant Director BPS-17 - Ministry of Finance")
- description: A GitHub-Flavored Markdown string. STRICT FORMATTING RULES:
  * Use "## Overview" (2-3 short sentences), "## Eligibility", "## How to Apply", "## Important Dates" sections.
  * If the ad lists multiple posts/positions side-by-side, output a MARKDOWN TABLE with columns like: | Post Name | BPS | Vacancies | Quota / Domicile | Qualifications |. Omit columns that don't apply. Use one row per post.
  * Use bulleted lists ("- ") for eligibility criteria, age limits, required documents, fees.
  * NEVER produce a wall of text. Keep prose paragraphs ≤ 3 sentences.
- deadline: Date in YYYY-MM-DD format if found
- organization: Hiring organization name
- location: City/Province
- qualification: Required education (e.g., "Master's in Public Administration")
- salary: Pay scale or salary range (e.g., "BPS-17 (Rs. 57,000-115,000)")
- experience: Required experience (e.g., "5 years in relevant field")
- positions: Number of vacancies as integer
- department: Department name
- sector: "government" or "private"
- region: One of: federal, sindh, punjab, kpk, balochistan
- keywords: Array of 5-8 SEO keywords`,


  scholarship: `Extract these fields from the scholarship notice:
- title: Professional title (e.g., "HEC Overseas PhD Scholarship 2026")
- description: 2-3 clean paragraphs about the scholarship, eligibility, and application process
- deadline: Date in YYYY-MM-DD format if found
- organization: Offering organization
- location: Country/City
- eligibility: Who can apply (e.g., "Pakistani nationals with 16 years education")
- amount: Scholarship value (e.g., "Full tuition + $1,500/month stipend")
- field_of_study: Eligible fields
- education_level: Required level (e.g., "Master's degree")
- scholarship_scope: "national" or "international"
- sector: "government" or "private"
- region: One of: federal, sindh, punjab, kpk, balochistan
- keywords: Array of 5-8 SEO keywords`,

  tender: `Extract these fields from the tender notice:
- title: Professional title (e.g., "Construction of Bridge on RCD Highway - NHA")
- description: 2-3 clean paragraphs about the tender scope, requirements, and submission process
- deadline: Date in YYYY-MM-DD format if found
- organization: Procuring agency
- location: Project location
- tender_number: Official tender/reference number
- tender_value: Estimated cost if mentioned
- tender_category: Category (e.g., "Construction", "IT Services", "Medical Equipment")
- department: Department name
- sector: "government" or "private"
- region: One of: federal, sindh, punjab, kpk, balochistan
- keywords: Array of 5-8 SEO keywords`,

  board_result: `Extract these fields from the board result announcement:
- title: Professional title (e.g., "BISE Lahore Matric Result 2026 Announced")
- description: 2-3 clean paragraphs about the result announcement, pass percentage, and how to check
- organization: Board name (e.g., "BISE Lahore")
- location: City/Province
- sector: "government"
- region: One of: federal, sindh, punjab, kpk, balochistan
- keywords: Array of 5-8 SEO keywords`,

  mock_test: `You are refining the SEO metadata for an online MOCK TEST / practice exam page on a Pakistani exam-prep portal. Use the test title, organization, syllabus subjects/topics, question count, and duration provided to produce search-optimized metadata. Generate these fields:
- seo_title: A compelling, search-friendly page title UNDER 60 characters. Include the exam/organization name and the words "Mock Test" or "MCQs" where natural (e.g., "FIA Sub-Inspector Mock Test 2026 - Free MCQs").
- meta_description: A UNIQUE meta description between 150 and 160 characters describing this specific test - mention the organization, the key subjects covered, the question count, and that it is a free online practice test. Plain text, no markdown, no quotes.
- keywords: Array of 5-8 SEO keywords targeting Pakistani exam search queries (e.g., "FIA Sub-Inspector test preparation", "FIA MCQs 2026", "FPSC mock test online"). Use the actual exam name and subjects.
- description: A clean GitHub-Flavored Markdown string (2-4 short sections) describing what the test covers: a one-line "## Overview", a "## Topics Covered" bulleted list derived from the syllabus, and a short "## Exam Pattern" note mentioning the question count and duration. Keep prose paragraphs <= 3 sentences. Base everything on the provided data - do NOT invent facts.`,
};

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const { text } = await callAIWithAutoSwitch(
    systemPrompt,
    userPrompt,
    { temperature: 0.3, maxOutputTokens: 4096 },
    { supabaseClient: null, sourceType: "enhance-content" }
  );
  return text;
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============= ADMIN AUTH GUARD =============
    // This endpoint consumes paid AI credits (Gemini quota + Lovable AI fallback).
    // Restrict to authenticated admins only.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin privileges required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { rawText, category, organization, sourceUrl } = await req.json();

    if (!rawText || !category) {
      return new Response(JSON.stringify({ error: "rawText and category are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const categoryPrompt = categoryPrompts[category] || categoryPrompts.job;

    const systemPrompt = `You are an expert content curator for a Pakistani education and opportunities portal (mcqsai.com).
Your job is to take raw text from job ads, scholarship notices, tenders, or board results and produce clean, professional, SEO-optimized content.

IMPORTANT RULES:
1. Output ONLY valid JSON — no outer markdown fence, no explanation. The OUTER response is JSON.
2. Clean up all formatting artifacts (extra spaces, broken lines, OCR errors)
3. The "description" field VALUE is a SINGLE STRING containing GitHub-Flavored Markdown. Use "##" headings, bulleted lists ("- "), and pipe-separated markdown tables for tabular data (posts/BPS/vacancies/quota). NEVER produce wall-of-text paragraphs.
4. If a field is not found in the text, set it to null
5. For Pakistani dates like "15 جولائی 2026", convert to YYYY-MM-DD
6. Keywords should target Pakistani search queries (e.g., "PPSC Jobs 2026", "HEC Scholarship")`;

    const userPrompt = `Category: ${category}
${organization ? `Organization: ${organization}` : ""}
${sourceUrl ? `Source URL: ${sourceUrl}` : ""}

RAW TEXT:
${rawText.substring(0, 8000)}

${categoryPrompt}

Return a single JSON object with all the fields listed above. Use null for missing values.`;

    const result = await callAI(systemPrompt, userPrompt);

    // Extract JSON from response (handle possible markdown fences)
    let jsonStr = result;
    const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    
    // Try to find JSON object
    const objMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!objMatch) {
      throw new Error("AI did not return valid JSON");
    }

    const parsed = JSON.parse(objMatch[0]);

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("enhance-content error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
