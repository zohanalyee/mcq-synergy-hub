import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ScrapedJob {
  title: string;
  description: string;
  organization: string;
  location: string;
  deadline: string | null;
  applyUrl: string;
  sector: string;
  region: string;
}

const CITIES_REGION_MAP: Record<string, string> = {
  'karachi': 'sindh', 'hyderabad': 'sindh', 'sukkur': 'sindh', 'larkana': 'sindh',
  'lahore': 'punjab', 'faisalabad': 'punjab', 'rawalpindi': 'punjab', 'multan': 'punjab', 'gujranwala': 'punjab',
  'peshawar': 'kpk', 'mardan': 'kpk', 'abbottabad': 'kpk', 'swat': 'kpk',
  'quetta': 'balochistan', 'gwadar': 'balochistan',
  'islamabad': 'federal', 'muzaffarabad': 'other', 'gilgit': 'other',
};

function extractDeadlineFromText(text: string): string | null {
  const patterns = [
    /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i,
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
}

function detectLocation(text: string): string {
  const lower = text.toLowerCase();
  for (const city of Object.keys(CITIES_REGION_MAP)) {
    if (lower.includes(city)) return city.charAt(0).toUpperCase() + city.slice(1);
  }
  return 'Pakistan';
}

function detectRegion(text: string): string {
  const lower = text.toLowerCase();
  for (const [city, region] of Object.entries(CITIES_REGION_MAP)) {
    if (lower.includes(city)) return region;
  }
  // Check province names directly
  if (lower.includes('sindh')) return 'sindh';
  if (lower.includes('punjab')) return 'punjab';
  if (lower.includes('kpk') || lower.includes('khyber')) return 'kpk';
  if (lower.includes('balochistan')) return 'balochistan';
  if (lower.includes('islamabad') || lower.includes('federal')) return 'federal';
  return 'federal';
}

function detectSector(sourceName: string, text: string): string {
  const govKeywords = ['ppsc', 'fpsc', 'nts', 'government', 'ministry', 'public service', 'bps-', 'grade-'];
  const lower = (sourceName + ' ' + text).toLowerCase();
  return govKeywords.some(kw => lower.includes(kw)) ? 'government' : 'private';
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return baseUrl;
  }
}

function parseJobs(doc: any, url: string, sourceName: string, selectors: any): ScrapedJob[] {
  const results: ScrapedJob[] = [];
  const jobKeywords = ['vacancy', 'post', 'position', 'job', 'recruitment', 'career', 'hiring', 'employment'];

  // Strategy 1: Custom CSS selectors
  if (selectors?.container) {
    try {
      const containers = doc.querySelectorAll(selectors.container);
      for (const container of containers) {
        const title = selectors.title
          ? container.querySelector(selectors.title)?.textContent?.trim()
          : container.querySelector('h1, h2, h3, h4, a')?.textContent?.trim();
        if (!title || title.length < 5) continue;

        const text = container.textContent || '';
        const linkEl = container.querySelector('a[href]');
        const applyUrl = linkEl ? resolveUrl(linkEl.getAttribute('href') || '', url) : url;

        results.push({
          title,
          description: text.substring(0, 500).trim(),
          organization: sourceName,
          location: detectLocation(text),
          deadline: extractDeadlineFromText(text),
          applyUrl,
          sector: detectSector(sourceName, text),
          region: detectRegion(text),
        });
      }
    } catch (e) {
      console.warn(`[scrape-jobs] Custom selector failed for ${url}:`, (e as Error).message);
    }
  }

  // Strategy 2: Keyword-based heading scan
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5');
  for (const heading of headings) {
    const headingText = heading.textContent?.toLowerCase() || '';
    if (!jobKeywords.some(kw => headingText.includes(kw))) continue;

    const title = heading.textContent?.trim();
    if (!title || title.length < 5) continue;
    if (results.some(r => r.title === title)) continue;

    const container = heading.parentElement;
    const containerText = container?.textContent || '';
    const linkEl = container?.querySelector('a[href]') || heading.querySelector('a[href]');
    const applyUrl = linkEl ? resolveUrl(linkEl.getAttribute('href') || '', url) : url;

    results.push({
      title,
      description: containerText.substring(0, 500).trim(),
      organization: sourceName,
      location: detectLocation(containerText),
      deadline: extractDeadlineFromText(containerText),
      applyUrl,
      sector: detectSector(sourceName, containerText),
      region: detectRegion(containerText),
    });
  }

  // Strategy 3: Table row parsing (PPSC/FPSC common format)
  const tables = doc.querySelectorAll('table');
  for (const table of tables) {
    const rows = table.querySelectorAll('tr');
    if (rows.length < 2) continue;

    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll('td, th');
      if (cells.length < 2) continue;

      const title = cells[0]?.textContent?.trim();
      if (!title || title.length < 5) continue;
      if (results.some(r => r.title === title)) continue;

      const rowText = rows[i].textContent || '';
      // Only include rows that look job-related
      const rowLower = rowText.toLowerCase();
      if (!jobKeywords.some(kw => rowLower.includes(kw)) && cells.length < 3) continue;

      const linkEl = rows[i].querySelector('a[href]');
      const applyUrl = linkEl ? resolveUrl(linkEl.getAttribute('href') || '', url) : url;

      results.push({
        title,
        description: rowText.substring(0, 500).trim(),
        organization: sourceName,
        location: detectLocation(rowText),
        deadline: extractDeadlineFromText(rowText),
        applyUrl,
        sector: detectSector(sourceName, rowText),
        region: detectRegion(rowText),
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

    let sourceUrl: string | null = null;
    try {
      const body = await req.json();
      sourceUrl = body?.sourceUrl || null;
    } catch { /* no body */ }

    let query = adminClient
      .from('scraping_sources')
      .select('*')
      .eq('type', 'job')
      .eq('is_active', true);

    if (sourceUrl) {
      query = query.eq('url', sourceUrl);
    }

    const { data: sources, error: sourcesError } = await query;
    if (sourcesError) throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
    if (!sources || sources.length === 0) {
      return new Response(JSON.stringify({ message: 'No active job sources found', scraped: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];

    for (const source of sources) {
      try {
        console.log(`[scrape-jobs] Fetching: ${source.name} (${source.url})`);

        const response = await fetch(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MCQsAI-Bot/1.0; +https://www.mcqsai.com)',
            'Accept': 'text/html,application/xhtml+xml',
          },
        });

        if (!response.ok) {
          console.warn(`[scrape-jobs] HTTP ${response.status} for ${source.url}`);
          results.push({ source: source.name, status: 'error', error: `HTTP ${response.status}` });
          continue;
        }

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        if (!doc) {
          results.push({ source: source.name, status: 'error', error: 'Failed to parse HTML' });
          continue;
        }

        const jobs = parseJobs(doc, source.url, source.name, source.custom_selectors || {});
        console.log(`[scrape-jobs] Found ${jobs.length} items from ${source.name}`);

        // Deduplicate
        const { data: existing } = await adminClient
          .from('external_opportunities')
          .select('apply_url')
          .eq('type', 'job');
        const existingUrls = new Set((existing || []).map((e: any) => e.apply_url));

        let saved = 0;
        for (const job of jobs) {
          if (existingUrls.has(job.applyUrl)) continue;

          const { error: insertError } = await adminClient
            .from('external_opportunities')
            .insert({
              type: 'job',
              title: job.title,
              description: sanitizeEmailLinks(job.description),
              organization: job.organization,
              location: job.location,
              apply_url: mailtoForApplyUrl(job.applyUrl),
              source_name: source.name,
              sector: job.sector,
              region: job.region,
              status: 'pending',
              metadata: {
                scraped_at: new Date().toISOString(),
                raw_deadline: job.deadline,
                source_url: source.url,
              },
            });

          if (!insertError) {
            saved++;
            existingUrls.add(job.applyUrl);
          }
        }

        await adminClient
          .from('scraping_sources')
          .update({
            last_scraped_at: new Date().toISOString(),
            last_scrape_found: jobs.length,
            last_scrape_saved: saved,
            updated_at: new Date().toISOString(),
          })
          .eq('id', source.id);

        results.push({ source: source.name, status: 'success', found: jobs.length, saved });

      } catch (sourceError: any) {
        console.error(`[scrape-jobs] Error scraping ${source.name}:`, sourceError.message);
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
    console.error('[scrape-jobs] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
