import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ScrapedScholarship {
  title: string;
  description: string;
  deadline: string | null;
  organization: string;
  applyUrl: string;
  scholarshipScope: string;
}

function extractDeadlineFromText(text: string): string | null {
  // Match dates like "31 December 2026", "Dec 31, 2026", "31-12-2026", "2026-12-31"
  const patterns = [
    /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i,
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/,
    /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
}

function detectScholarshipScope(text: string): string {
  const intlKeywords = ['international', 'abroad', 'overseas', 'foreign', 'global', 'usa', 'uk', 'europe', 'china', 'australia'];
  const lower = text.toLowerCase();
  return intlKeywords.some(kw => lower.includes(kw)) ? 'international' : 'national';
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return baseUrl;
  }
}

function parseScholarships(doc: any, url: string, sourceName: string, selectors: any): ScrapedScholarship[] {
  const results: ScrapedScholarship[] = [];

  // Strategy 1: Custom CSS selectors
  if (selectors?.container) {
    try {
      const containers = doc.querySelectorAll(selectors.container);
      for (const container of containers) {
        const title = selectors.title
          ? container.querySelector(selectors.title)?.textContent?.trim()
          : container.querySelector('h1, h2, h3, h4, a')?.textContent?.trim();
        if (!title || title.length < 5) continue;

        const linkEl = container.querySelector('a[href]');
        const applyUrl = linkEl ? resolveUrl(linkEl.getAttribute('href') || '', url) : url;
        const text = container.textContent || '';

        results.push({
          title,
          description: text.substring(0, 500).trim(),
          deadline: extractDeadlineFromText(text),
          organization: sourceName,
          applyUrl,
          scholarshipScope: detectScholarshipScope(text),
        });
      }
    } catch (e) {
      console.warn(`[scrape-scholarships] Custom selector failed for ${url}:`, e.message);
    }
  }

  // Strategy 2: Keyword-based heading scan
  const keywords = ['scholarship', 'fellowship', 'grant', 'financial aid', 'stipend', 'award', 'bursary'];
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5');

  for (const heading of headings) {
    const headingText = heading.textContent?.toLowerCase() || '';
    if (!keywords.some(kw => headingText.includes(kw))) continue;

    const title = heading.textContent?.trim();
    if (!title || title.length < 5) continue;
    // Skip if already found by custom selectors
    if (results.some(r => r.title === title)) continue;

    const container = heading.parentElement;
    const containerText = container?.textContent || '';
    const linkEl = container?.querySelector('a[href]') || heading.querySelector('a[href]');
    const applyUrl = linkEl ? resolveUrl(linkEl.getAttribute('href') || '', url) : url;

    results.push({
      title,
      description: containerText.substring(0, 500).trim(),
      deadline: extractDeadlineFromText(containerText),
      organization: sourceName,
      applyUrl,
      scholarshipScope: detectScholarshipScope(containerText),
    });
  }

  // Strategy 3: Table row parsing
  const tables = doc.querySelectorAll('table');
  for (const table of tables) {
    const tableText = table.textContent?.toLowerCase() || '';
    if (!keywords.some(kw => tableText.includes(kw))) continue;

    const rows = table.querySelectorAll('tr');
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll('td, th');
      if (cells.length < 2) continue;

      const title = cells[0]?.textContent?.trim();
      if (!title || title.length < 5) continue;
      if (results.some(r => r.title === title)) continue;

      const rowText = rows[i].textContent || '';
      const linkEl = rows[i].querySelector('a[href]');
      const applyUrl = linkEl ? resolveUrl(linkEl.getAttribute('href') || '', url) : url;

      results.push({
        title,
        description: rowText.substring(0, 500).trim(),
        deadline: extractDeadlineFromText(rowText),
        organization: sourceName,
        applyUrl,
        scholarshipScope: detectScholarshipScope(rowText),
      });
    }
  }

  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.includes(serviceKey)) {
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader || '' } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }
      const { data: adminCheck } = await userClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (!adminCheck) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Parse request body
    let sourceUrl: string | null = null;
    try {
      const body = await req.json();
      sourceUrl = body?.sourceUrl || null;
    } catch { /* no body */ }

    // Fetch sources
    let query = adminClient
      .from('scraping_sources')
      .select('*')
      .eq('type', 'scholarship')
      .eq('is_active', true);

    if (sourceUrl) {
      query = query.eq('url', sourceUrl);
    }

    const { data: sources, error: sourcesError } = await query;
    if (sourcesError) throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
    if (!sources || sources.length === 0) {
      return new Response(JSON.stringify({ message: 'No active scholarship sources found', scraped: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];

    for (const source of sources) {
      try {
        console.log(`[scrape-scholarships] Fetching: ${source.name} (${source.url})`);

        const response = await fetch(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MCQsAI-Bot/1.0; +https://mcqsai.com)',
            'Accept': 'text/html,application/xhtml+xml',
          },
        });

        if (!response.ok) {
          console.warn(`[scrape-scholarships] HTTP ${response.status} for ${source.url}`);
          results.push({ source: source.name, status: 'error', error: `HTTP ${response.status}` });
          continue;
        }

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        if (!doc) {
          results.push({ source: source.name, status: 'error', error: 'Failed to parse HTML' });
          continue;
        }

        const scholarships = parseScholarships(doc, source.url, source.name, source.custom_selectors || {});
        console.log(`[scrape-scholarships] Found ${scholarships.length} items from ${source.name}`);

        // Deduplicate against existing
        const { data: existing } = await adminClient
          .from('external_opportunities')
          .select('apply_url')
          .eq('type', 'scholarship');
        const existingUrls = new Set((existing || []).map((e: any) => e.apply_url));

        let saved = 0;
        for (const s of scholarships) {
          if (existingUrls.has(s.applyUrl)) continue;

          const { error: insertError } = await adminClient
            .from('external_opportunities')
            .insert({
              type: 'scholarship',
              title: s.title,
              description: s.description,
              deadline_date: s.deadline ? null : null, // Raw text deadlines need manual parsing
              organization: s.organization,
              apply_url: s.applyUrl,
              source_name: source.name,
              scholarship_scope: s.scholarshipScope,
              status: 'pending',
              metadata: {
                scraped_at: new Date().toISOString(),
                raw_deadline: s.deadline,
                source_url: source.url,
              },
            });

          if (!insertError) {
            saved++;
            existingUrls.add(s.applyUrl);
          }
        }

        // Update source stats
        await adminClient
          .from('scraping_sources')
          .update({
            last_scraped_at: new Date().toISOString(),
            last_scrape_found: scholarships.length,
            last_scrape_saved: saved,
            updated_at: new Date().toISOString(),
          })
          .eq('id', source.id);

        results.push({ source: source.name, status: 'success', found: scholarships.length, saved });

      } catch (sourceError: any) {
        console.error(`[scrape-scholarships] Error scraping ${source.name}:`, sourceError.message);
        results.push({ source: source.name, status: 'error', error: sourceError.message?.substring(0, 200) });
      }
    }

    const totalFound = results.reduce((sum, r) => sum + (r.found || 0), 0);
    const totalSaved = results.reduce((sum, r) => sum + (r.saved || 0), 0);

    return new Response(JSON.stringify({
      scraped: results.length,
      totalFound,
      totalSaved,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[scrape-scholarships] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
