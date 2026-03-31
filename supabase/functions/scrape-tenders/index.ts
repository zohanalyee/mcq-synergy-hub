import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TenderData {
  title: string;
  description: string;
  apply_url: string;
  organization: string;
  tender_number: string;
  tender_value: string;
  tender_category: string;
  deadline_date: string | null;
  document_url: string;
  location: string;
}

function extractTenderNumber(text: string): string {
  const patterns = [
    /(?:tender|nit|ref|no)[.:\s#]*([A-Z0-9\/-]{3,30})/i,
    /([A-Z]{2,}[-\/]\d+[-\/]\d+)/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return "";
}

function extractTenderCategory(text: string): string {
  const cats: Record<string, string[]> = {
    Construction: ["construction", "building", "civil", "road", "bridge"],
    IT: ["it ", "software", "computer", "digital", "ict"],
    Consultancy: ["consultancy", "consultant", "advisory"],
    Supply: ["supply", "procurement", "purchase", "goods"],
    Services: ["services", "service", "maintenance", "cleaning"],
    Equipment: ["equipment", "machinery", "plant", "vehicle"],
  };
  const lower = text.toLowerCase();
  for (const [cat, kws] of Object.entries(cats)) {
    if (kws.some(kw => lower.includes(kw))) return cat;
  }
  return "General";
}

function extractTenderValue(text: string): string {
  const m = text.match(/([\d,]+(?:\.\d+)?)\s*(?:million|lakh|crore|PKR|Rs\.?)/i);
  return m ? m[0] : "";
}

function parseDeadline(text: string): string | null {
  const patterns = [
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/,
    /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{4})/i,
  ];
  const months: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      if (m[2] && months[m[2].toLowerCase().slice(0, 3)]) {
        return `${m[3]}-${months[m[2].toLowerCase().slice(0, 3)]}-${m[1].padStart(2, "0")}`;
      }
      const day = m[1].padStart(2, "0");
      const month = m[2].padStart(2, "0");
      return `${m[3]}-${month}-${day}`;
    }
  }
  return null;
}

function detectRegion(text: string): string | null {
  const lower = text.toLowerCase();
  if (/karachi|hyderabad|sukkur|larkana|sindh/.test(lower)) return "sindh";
  if (/lahore|faisalabad|rawalpindi|multan|punjab/.test(lower)) return "punjab";
  if (/peshawar|mardan|swat|kpk|khyber/.test(lower)) return "kpk";
  if (/quetta|balochistan|gwadar/.test(lower)) return "balochistan";
  if (/islamabad|federal/.test(lower)) return "federal";
  return null;
}

function parseTenders(doc: any, url: string, sourceName: string, selectors: any): TenderData[] {
  const tenders: TenderData[] = [];

  // Try custom selectors first
  if (selectors?.itemSelector) {
    const items = doc.querySelectorAll(selectors.itemSelector);
    for (const item of items) {
      const title = item.querySelector(selectors.titleSelector || "h2, h3, .title")?.textContent?.trim() || "";
      if (title.length < 10) continue;
      const text = item.textContent || "";
      const link = item.querySelector("a")?.getAttribute("href") || "";
      const fullLink = link.startsWith("http") ? link : link ? new URL(link, url).href : url;

      tenders.push({
        title,
        description: text.substring(0, 500).trim(),
        apply_url: fullLink,
        organization: sourceName,
        tender_number: extractTenderNumber(text),
        tender_value: extractTenderValue(text),
        tender_category: extractTenderCategory(text),
        deadline_date: parseDeadline(text),
        document_url: "",
        location: "Pakistan",
      });
    }
  }

  // Table-based parsing (PPRA style)
  if (tenders.length === 0) {
    const tables = doc.querySelectorAll("table");
    for (const table of tables) {
      const rows = table.querySelectorAll("tr");
      if (rows.length < 3) continue;

      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll("td");
        if (cells.length < 2) continue;

        const rowText = rows[i].textContent?.trim() || "";
        if (rowText.length < 15) continue;

        // Find first cell with substantial text as title
        let titleText = "";
        let linkHref = "";
        let docHref = "";

        for (const cell of cells) {
          const cellText = cell.textContent?.trim() || "";
          if (cellText.length > titleText.length) titleText = cellText;
          const anchor = cell.querySelector("a");
          if (anchor) {
            const href = anchor.getAttribute("href") || "";
            if (href.endsWith(".pdf") || href.includes("download")) {
              docHref = href.startsWith("http") ? href : new URL(href, url).href;
            } else if (!linkHref) {
              linkHref = href.startsWith("http") ? href : href ? new URL(href, url).href : "";
            }
          }
        }

        if (titleText.length < 10) continue;

        const tenderNum = extractTenderNumber(rowText);
        tenders.push({
          title: titleText.substring(0, 300),
          description: rowText.substring(0, 500),
          apply_url: linkHref || docHref || url,
          organization: sourceName,
          tender_number: tenderNum,
          tender_value: extractTenderValue(rowText),
          tender_category: extractTenderCategory(rowText),
          deadline_date: parseDeadline(rowText),
          document_url: docHref,
          location: "Pakistan",
        });
      }
    }
  }

  // Generic heading/article parsing
  if (tenders.length === 0) {
    const headings = doc.querySelectorAll("h2, h3, h4, .tender-item, article");
    for (const h of headings) {
      const text = h.textContent?.trim() || "";
      const kws = ["tender", "nit", "procurement", "bid", "rfp", "rfq", "eoi"];
      if (text.length > 15 && kws.some(kw => text.toLowerCase().includes(kw))) {
        const link = h.querySelector("a")?.getAttribute("href") || h.closest("a")?.getAttribute("href") || "";
        const fullLink = link.startsWith("http") ? link : link ? new URL(link, url).href : url;

        tenders.push({
          title: text.substring(0, 300),
          description: text.substring(0, 500),
          apply_url: fullLink,
          organization: sourceName,
          tender_number: extractTenderNumber(text),
          tender_value: extractTenderValue(text),
          tender_category: extractTenderCategory(text),
          deadline_date: parseDeadline(text),
          document_url: "",
          location: "Pakistan",
        });
      }
    }
  }

  return tenders;
}

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
    const body = await req.json().catch(() => ({}));
    const sourceUrl = body.sourceUrl || null;

    let query = supabase.from("scraping_sources").select("*").eq("type", "tender").eq("is_active", true);
    if (sourceUrl) query = query.eq("url", sourceUrl);

    const { data: sources, error: srcError } = await query;
    if (srcError) throw new Error(`Failed to fetch sources: ${srcError.message}`);
    if (!sources?.length) {
      return new Response(JSON.stringify({ success: true, message: "No active tender sources", found: 0, saved: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalFound = 0;
    let totalSaved = 0;
    const errors: string[] = [];

    for (const source of sources) {
      try {
        console.log(`[scrape-tenders] Fetching ${source.name}: ${source.url}`);
        const res = await fetch(source.url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; MCQsAI/1.0)" },
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) { errors.push(`${source.name}: HTTP ${res.status}`); continue; }

        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        if (!doc) { errors.push(`${source.name}: Failed to parse HTML`); continue; }

        const selectors = source.custom_selectors || {};
        const tenders = parseTenders(doc, source.url, source.name, selectors);
        totalFound += tenders.length;
        console.log(`[scrape-tenders] ${source.name}: found ${tenders.length} tenders`);

        let savedCount = 0;
        for (const tender of tenders) {
          const { data: existing } = await supabase
            .from("external_opportunities").select("id")
            .eq("apply_url", tender.apply_url).eq("type", "tender").maybeSingle();
          if (existing) continue;

          const region = detectRegion(tender.location + " " + tender.title + " " + source.name);

          const { error: insertError } = await supabase.from("external_opportunities").insert({
            type: "tender",
            status: "pending",
            title: tender.title,
            description: tender.description,
            apply_url: tender.apply_url,
            source_name: source.name,
            organization: tender.organization,
            location: tender.location,
            deadline_date: tender.deadline_date,
            tender_number: tender.tender_number || null,
            tender_value: tender.tender_value || null,
            tender_category: tender.tender_category || null,
            document_url: tender.document_url || null,
            sector: "government",
            region: region,
            metadata: { scraped_from: source.url },
          });

          if (!insertError) savedCount++;
        }

        totalSaved += savedCount;

        await supabase.from("scraping_sources").update({
          last_scraped_at: new Date().toISOString(),
          last_scrape_found: tenders.length,
          last_scrape_saved: savedCount,
        }).eq("id", source.id);

      } catch (err: any) {
        console.error(`[scrape-tenders] Error scraping ${source.name}:`, err.message);
        errors.push(`${source.name}: ${err.message?.substring(0, 100)}`);
      }
    }

    console.log(`[scrape-tenders] Done: found=${totalFound}, saved=${totalSaved}`);
    return new Response(JSON.stringify({
      success: true, found: totalFound, saved: totalSaved,
      sources_processed: sources.length, errors: errors.length > 0 ? errors : undefined,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("[scrape-tenders] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
