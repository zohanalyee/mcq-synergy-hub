import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { checkQuota, retryWithBackoff, quotaExhaustedResponse, QuotaExhaustedError } from '../_shared/quotaManager.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============= MODEL FALLBACK CONFIGURATION =============
// Ordered by preference - will try each until one works
// Using stable model names without deprecated suffixes
const PREFERRED_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

// Call Gemini API with automatic model fallback
async function callGeminiWithFallback(
  apiKey: string,
  prompt: string
): Promise<{ success: boolean; text?: string; modelUsed?: string; error?: string }> {
  
  for (const model of PREFERRED_MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    console.log(`🔄 Trying model: ${model}`);
    
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          }
        })
      });

      console.log(`📥 ${model} Response Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        console.log(`✅ Success with model: ${model}`);
        return { success: true, text, modelUsed: model };
      }

      // Handle specific error codes
      if (response.status === 429) {
        console.warn(`⚠️ Rate limit on ${model}, trying next model...`);
        continue;
      }
      if (response.status === 404 || response.status === 400) {
        const errorText = await response.text();
        console.warn(`⚠️ Model ${model} unavailable (${response.status}): ${errorText.slice(0, 100)}`);
        continue;
      }
      if (response.status === 403 || response.status === 401) {
        return { success: false, error: 'AUTH_ERROR' };
      }
      
      console.warn(`⚠️ ${model} returned ${response.status}, trying next...`);
      continue;
      
    } catch (fetchError) {
      console.error(`❌ Network error with ${model}:`, fetchError);
      continue;
    }
  }

  // All models failed
  console.error('❌ ALL_MODELS_FAILED: Exhausted all fallback options');
  return { success: false, error: 'RATE_LIMIT_EXCEEDED' };
}

type SectorType = 'government' | 'private';
type RegionType = 'sindh' | 'punjab' | 'kpk' | 'balochistan' | 'federal' | 'international' | 'other';
type ScholarshipScope = 'national' | 'international';

interface AIParsedOpportunity {
  title: string;
  description: string;
  apply_url: string;
  image_url?: string;
  source_name: string;
  type: 'job' | 'scholarship';
  deadline_date?: string;
  location?: string;
  organization?: string;
  sector?: SectorType;
  region?: RegionType;
  scholarship_scope?: ScholarshipScope;
}

// Auto-tagging functions for validation/fallback
function detectSector(text: string): SectorType {
  const govKeywords = [
    'ministry', 'psc', 'spsc', 'fpsc', 'ppsc', 'kppsc', 'bpsc',
    'government', 'public sector', 'civil service', 'nts',
    'federal', 'provincial', 'commissioner', 'deputy commissioner'
  ];
  const lowerText = text.toLowerCase();
  return govKeywords.some(k => lowerText.includes(k)) ? 'government' : 'private';
}

function detectRegion(text: string): RegionType {
  const lowerText = text.toLowerCase();
  const regionMap: Record<string, RegionType> = {
    'karachi': 'sindh', 'hyderabad': 'sindh', 'sukkur': 'sindh', 'larkana': 'sindh', 'sindh': 'sindh',
    'lahore': 'punjab', 'faisalabad': 'punjab', 'multan': 'punjab', 'rawalpindi': 'punjab', 'gujranwala': 'punjab', 'punjab': 'punjab',
    'islamabad': 'federal', 'federal': 'federal',
    'peshawar': 'kpk', 'abbottabad': 'kpk', 'mardan': 'kpk', 'swat': 'kpk', 'kpk': 'kpk', 'khyber': 'kpk',
    'quetta': 'balochistan', 'balochistan': 'balochistan', 'gwadar': 'balochistan',
    'international': 'international', 'usa': 'international', 'uk': 'international', 
    'canada': 'international', 'australia': 'international', 'germany': 'international',
    'remote': 'other', 'worldwide': 'international'
  };

  for (const [keyword, region] of Object.entries(regionMap)) {
    if (lowerText.includes(keyword)) return region;
  }
  return 'other';
}

function detectScholarshipScope(text: string): ScholarshipScope {
  const internationalKeywords = [
    'international', 'abroad', 'foreign', 'overseas', 'usa', 'uk', 'australia',
    'canada', 'germany', 'fulbright', 'chevening', 'erasmus', 'commonwealth'
  ];
  const lowerText = text.toLowerCase();
  return internationalKeywords.some(k => lowerText.includes(k)) ? 'international' : 'national';
}

function parseAIResponse(response: string): AIParsedOpportunity[] {
  try {
    // Extract JSON array from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EXTERNAL_JOBS_GEMINI_KEY = Deno.env.get("EXTERNAL_JOBS_GEMINI_KEY");
    if (!EXTERNAL_JOBS_GEMINI_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "AUTH_ERROR" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "AUTH_ERROR" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // ============= REQUEST LOGGING =============
    console.log(`[fetch-external-jobs] 📥 Request at ${new Date().toISOString()}`, {
      userAgent: req.headers.get('user-agent')?.slice(0, 50),
      referer: req.headers.get('referer'),
    });

    // ============= QUOTA CHECK =============
    try {
      const quota = await checkQuota(supabase);
      console.log(`[fetch-external-jobs] 📊 Quota remaining: ${quota.remaining}`);
    } catch (err) {
      if (err instanceof QuotaExhaustedError) {
        return quotaExhaustedResponse(corsHeaders);
      }
      throw err;
    }

    const { searchType = 'jobs' } = await req.json();

    // Build the prompt based on search type (reduced to exactly 5 items)
    const prompt = searchType === 'scholarships' 
      ? `Search for the latest scholarship opportunities for Pakistani students in 2026. Return a JSON array with exactly 5 scholarships. Each object should have:
- title: Scholarship name
- description: Brief description (max 200 chars)
- apply_url: Application URL (use realistic URLs from HEC, Fulbright, etc.)
- image_url: Logo/banner URL if available
- source_name: Source website name (HEC, Fulbright, USAID, etc.)
- type: "scholarship"
- deadline_date: in YYYY-MM-DD format
- location: Country or "Pakistan"
- organization: Organization name
- scholarship_scope: "national" if within Pakistan, "international" if abroad
- region: Detect from location (sindh, punjab, kpk, balochistan, federal, international, other)

Return ONLY the JSON array, no explanations.`
      : `Search for the latest job opportunities in Pakistan for 2026. Return a JSON array with exactly 5 jobs. Each object should have:
- title: Job title
- description: Brief description (max 200 chars)
- apply_url: Application URL (use realistic URLs from job portals)
- image_url: Company logo URL if available
- source_name: Source website name (LinkedIn, Indeed, Rozee.pk, etc.)
- type: "job"
- deadline_date: in YYYY-MM-DD format
- location: City, Pakistan
- organization: Company name
- sector: "government" if contains Ministry, PSC, SPSC, FPSC, PPSC, NTS, Commissioner; else "private"
- region: Detect from city (Karachi/Hyderabad→sindh, Lahore/Multan→punjab, Islamabad→federal, Peshawar→kpk, Quetta→balochistan, Remote→other)

Return ONLY the JSON array, no explanations.`;

    console.log("[fetch-external-jobs] Calling Gemini API with model fallback for:", searchType);

    // Use the robust fallback mechanism with retryWithBackoff
    const result = await retryWithBackoff(
      () => callGeminiWithFallback(EXTERNAL_JOBS_GEMINI_KEY, prompt),
      2,
      `fetch-external-jobs-${searchType}`
    );

    if (!result.success) {
      console.error("All Gemini models failed:", result.error);
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`AI Response received using model: ${result.modelUsed}`);
    const aiText = result.text || "";
    
    console.log("AI Response received, parsing...");
    const opportunities = parseAIResponse(aiText);
    console.log(`Parsed ${opportunities.length} opportunities`);

    if (opportunities.length === 0) {
      return new Response(
        JSON.stringify({ success: true, added: 0, duplicates: 0, message: "No opportunities found in AI response" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let added = 0;
    let duplicates = 0;
    const errors: string[] = [];

    for (const opp of opportunities) {
      try {
        // Validate and apply fallback tagging
        const fullText = `${opp.title} ${opp.description} ${opp.organization} ${opp.location}`;
        
        const insertData = {
          title: opp.title,
          description: opp.description,
          apply_url: opp.apply_url,
          image_url: opp.image_url || null,
          source_name: opp.source_name || "AI Generated",
          type: opp.type,
          status: 'pending',
          deadline_date: opp.deadline_date || null,
          location: opp.location || null,
          organization: opp.organization || null,
          sector: opp.type === 'job' ? (opp.sector || detectSector(fullText)) : null,
          region: opp.region || detectRegion(fullText),
          scholarship_scope: opp.type === 'scholarship' ? (opp.scholarship_scope || detectScholarshipScope(fullText)) : null,
          metadata: { ai_generated: true, fetched_at: new Date().toISOString() }
        };

        const { error } = await supabase
          .from('external_opportunities')
          .insert(insertData);

        if (error) {
          if (error.code === '23505') {
            duplicates++;
          } else {
            console.error("Insert error:", error);
            errors.push(`Failed to insert: ${opp.title}`);
          }
        } else {
          added++;
        }
      } catch (err) {
        console.error("Processing error:", err);
        errors.push(`Error processing: ${opp.title}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        added,
        duplicates,
        total_parsed: opportunities.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
