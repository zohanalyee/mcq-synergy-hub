import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.includes(serviceKey)) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader || "" } },
      });
      const token = authHeader?.replace("Bearer ", "") || "";
      const { data: claimsData } = await userClient.auth.getClaims(token);
      if (!claimsData?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      }
      const { data: adminCheck } = await userClient
        .from("user_roles").select("role")
        .eq("user_id", claimsData.claims.sub).eq("role", "admin").maybeSingle();
      if (!adminCheck) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      }
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: sources, error: srcError } = await supabase
      .from("scraping_sources").select("*")
      .eq("type", "board_result").eq("is_active", true);

    if (srcError) throw new Error(`Failed to fetch sources: ${srcError.message}`);
    if (!sources?.length) {
      return new Response(JSON.stringify({ success: true, announcements: 0, message: "No active board result sources" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentYear = new Date().getFullYear();
    const announcements: any[] = [];
    const errors: string[] = [];

    for (const source of sources) {
      try {
        console.log(`[detect-board-results] Checking ${source.name}: ${source.url}`);
        const res = await fetch(source.url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; MCQsAI/1.0)" },
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) { errors.push(`${source.name}: HTTP ${res.status}`); continue; }

        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        if (!doc) { errors.push(`${source.name}: Failed to parse`); continue; }

        const pageText = doc.body?.textContent?.toLowerCase() || "";
        const resultKeywords = ["result", "announced", "declared", "available", "check result", "gazette"];
        const yearStr = String(currentYear);

        const hasResult = resultKeywords.some(kw => pageText.includes(kw)) && pageText.includes(yearStr);
        if (!hasResult) {
          console.log(`[detect-board-results] ${source.name}: No result detected`);
          continue;
        }

        // Determine exam type
        let examType = "Unknown";
        if (pageText.includes("ssc") || pageText.includes("matric") || pageText.includes("9th") || pageText.includes("10th")) {
          examType = "SSC";
        } else if (pageText.includes("hsc") || pageText.includes("inter") || pageText.includes("11th") || pageText.includes("12th")) {
          examType = "HSC";
        }

        // Find result URL
        let resultUrl = source.url;
        const links = doc.querySelectorAll("a");
        for (const link of links as any) {
          const linkText = (link.textContent?.toLowerCase() || "") + " " + ((link as any).getAttribute?.("href") || "").toLowerCase();
          if (linkText.includes("result") || linkText.includes("check") || linkText.includes("gazette")) {
            const href = (link as any).getAttribute?.("href") || "";
            resultUrl = href.startsWith("http") ? href : href ? new URL(href, source.url).href : source.url;
            break;
          }
        }

        // Check if already recorded
        const { data: existing } = await supabase
          .from("board_result_announcements").select("id")
          .eq("board_name", source.name).eq("exam_type", examType).eq("year", currentYear)
          .maybeSingle();

        if (existing) {
          console.log(`[detect-board-results] ${source.name} ${examType} ${currentYear}: Already recorded`);
          continue;
        }

        // New announcement!
        console.log(`[detect-board-results] 🔥 NEW RESULT: ${source.name} ${examType} ${currentYear}`);
        const { data: announcement, error: insertError } = await supabase
          .from("board_result_announcements").insert({
            board_name: source.name,
            exam_type: examType,
            year: currentYear,
            result_url: resultUrl,
          }).select().single();

        if (insertError) {
          errors.push(`${source.name}: Insert failed - ${insertError.message}`);
          continue;
        }

        announcements.push(announcement);

        // Trigger blog generation
        try {
          const blogRes = await fetch(`${supabaseUrl}/functions/v1/generate-blog`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: `${source.name} ${examType} Result ${currentYear} Announced - Check Now!`,
              topic: "board-results",
              keywords: [source.name, examType, "result", String(currentYear), "check online"],
              targetLength: 800,
            }),
          });

          if (blogRes.ok) {
            const blogData = await blogRes.json();
            if (blogData.id) {
              await supabase.from("board_result_announcements").update({
                blog_generated: true,
                blog_id: blogData.id,
              }).eq("id", announcement.id);
            }
          }
        } catch (blogErr: any) {
          console.error(`[detect-board-results] Blog generation failed:`, blogErr.message);
        }

        // Update scraping source metadata
        await supabase.from("scraping_sources").update({
          last_scraped_at: new Date().toISOString(),
          last_scrape_found: 1,
          last_scrape_saved: 1,
        }).eq("id", source.id);

      } catch (err: any) {
        console.error(`[detect-board-results] Error checking ${source.name}:`, err.message);
        errors.push(`${source.name}: ${err.message?.substring(0, 100)}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      announcements: announcements.length,
      details: announcements,
      sources_checked: sources.length,
      errors: errors.length > 0 ? errors : undefined,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("[detect-board-results] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
