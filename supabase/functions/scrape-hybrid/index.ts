import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ScrapeResult {
  success: boolean;
  scraperUsed: 'cheerio' | 'firecrawl' | 'none';
  itemsFound: number;
  items: any[];
  markdown?: string;
  error?: string;
  executionTimeMs: number;
}

// ─── Shared helpers ───

function extractDeadlineFromText(text: string): string | null {
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

function resolveUrl(href: string, baseUrl: string): string {
  try { return new URL(href, baseUrl).href; } catch { return baseUrl; }
}

// ─── Cheerio (deno-dom) scraping ───

async function scrapeWithCheerio(url: string, sourceType: string, sourceName: string, selectors: any): Promise<ScrapeResult> {
  const startTime = Date.now();
  try {
    console.log(`[cheerio] Fetching: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MCQsAI-Bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc) throw new Error('Failed to parse HTML');

    let items: any[] = [];
    const keywords: Record<string, string[]> = {
      scholarship: ['scholarship', 'fellowship', 'grant', 'financial aid', 'stipend', 'award'],
      job: ['vacancy', 'post', 'position', 'job', 'recruitment', 'career', 'hiring'],
      tender: ['tender', 'procurement', 'bid', 'rfp', 'nit', 'eoi'],
      board_result: ['result', 'announcement', 'gazette', 'merit'],
    };

    // Try custom selectors first
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
          items.push({
            title, description: text.substring(0, 500).trim(),
            deadline: extractDeadlineFromText(text), organization: sourceName,
            applyUrl,
          });
        }
      } catch (e) {
        console.warn(`[cheerio] Custom selector failed:`, e.message);
      }
    }

    // Fallback: keyword-based heading scan
    if (items.length === 0) {
      const kws = keywords[sourceType] || [];
      const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, .title, .heading');
      for (const heading of headings) {
        const text = heading.textContent?.trim() || '';
        const lower = text.toLowerCase();
        if (text.length < 5 || !kws.some(kw => lower.includes(kw))) continue;

        const parent = heading.parentElement;
        const fullText = parent?.textContent || text;
        const linkEl = (parent || heading).querySelector?.('a[href]') || heading.closest?.('a');
        const applyUrl = linkEl ? resolveUrl(linkEl.getAttribute?.('href') || '', url) : url;

        items.push({
          title: text.substring(0, 200),
          description: fullText.substring(0, 500).trim(),
          deadline: extractDeadlineFromText(fullText),
          organization: sourceName, applyUrl,
        });
      }
    }

    // Fallback: table rows
    if (items.length === 0) {
      const rows = doc.querySelectorAll('table tr, .list-item, .card, article');
      for (const row of rows) {
        const text = row.textContent?.trim() || '';
        const kws = keywords[sourceType] || [];
        if (text.length < 10 || !kws.some(kw => text.toLowerCase().includes(kw))) continue;
        const linkEl = row.querySelector('a[href]');
        const applyUrl = linkEl ? resolveUrl(linkEl.getAttribute('href') || '', url) : url;
        const title = linkEl?.textContent?.trim() || text.substring(0, 200);
        items.push({
          title, description: text.substring(0, 500).trim(),
          deadline: extractDeadlineFromText(text),
          organization: sourceName, applyUrl,
        });
      }
    }

    // Deduplicate by title
    const seen = new Set<string>();
    items = items.filter(item => {
      const key = item.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return {
      success: items.length > 0, scraperUsed: 'cheerio',
      itemsFound: items.length, items,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error(`[cheerio] Error:`, error.message);
    return {
      success: false, scraperUsed: 'cheerio',
      itemsFound: 0, items: [], error: error.message,
      executionTimeMs: Date.now() - startTime,
    };
  }
}

// ─── Firecrawl scraping ───

async function scrapeWithFirecrawl(
  url: string, sourceType: string, sourceName: string,
  enableCrawl = false, maxDepth = 2,
): Promise<ScrapeResult> {
  const startTime = Date.now();
  try {
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) throw new Error('FIRECRAWL_API_KEY not configured');

    console.log(`[firecrawl] ${enableCrawl ? 'Crawling' : 'Scraping'}: ${url}`);

    const endpoint = enableCrawl
      ? 'https://api.firecrawl.dev/v1/crawl'
      : 'https://api.firecrawl.dev/v1/scrape';

    const body: any = { url, formats: ['markdown', 'html'], onlyMainContent: true, waitFor: 2000 };
    if (enableCrawl) {
      body.limit = 10;
      body.maxDepth = maxDepth;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let markdown = '';
    let items: any[] = [];

    const keywords: Record<string, string[]> = {
      scholarship: ['scholarship', 'fellowship', 'grant', 'award'],
      job: ['vacancy', 'job', 'position', 'recruitment'],
      tender: ['tender', 'procurement', 'bid', 'rfp'],
      board_result: ['result', 'announcement', 'gazette'],
    };
    const kws = keywords[sourceType] || [];

    if (enableCrawl && Array.isArray(data.data)) {
      for (const page of data.data) {
        markdown += (page.markdown || '') + '\n';
        items.push(...parseMarkdown(page.markdown || '', kws, sourceName, page.metadata?.sourceURL || url));
      }
    } else if (data.data?.markdown) {
      markdown = data.data.markdown;
      items = parseMarkdown(markdown, kws, sourceName, url);
    }

    return {
      success: true, scraperUsed: 'firecrawl',
      itemsFound: items.length, items, markdown: markdown.substring(0, 2000),
      executionTimeMs: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error(`[firecrawl] Error:`, error.message);
    return {
      success: false, scraperUsed: 'firecrawl',
      itemsFound: 0, items: [], error: error.message,
      executionTimeMs: Date.now() - startTime,
    };
  }
}

function parseMarkdown(markdown: string, keywords: string[], sourceName: string, url: string): any[] {
  const items: any[] = [];
  const sections = markdown.split(/^#{2,3}\s+/m);
  for (const section of sections) {
    const lines = section.split('\n');
    const title = lines[0]?.trim() || '';
    const text = section.toLowerCase();
    if (keywords.some(kw => text.includes(kw)) && title.length > 5) {
      const linkMatch = section.match(/\[.*?\]\((https?:\/\/[^\)]+)\)/);
      items.push({
        title,
        description: section.substring(0, 500).trim(),
        deadline: extractDeadlineFromText(section),
        organization: sourceName,
        applyUrl: linkMatch ? linkMatch[1] : url,
      });
    }
  }
  return items;
}

// ─── Main handler ───

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.includes(serviceKey)) {
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader || '' } },
      });
      const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(
        (authHeader || '').replace('Bearer ', '')
      );
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const userId = claimsData.claims.sub as string;
      const { data: adminCheck } = await adminClient
        .from('user_roles').select('role')
        .eq('user_id', userId).eq('role', 'admin').maybeSingle();
      if (!adminCheck) {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { sourceUrl, sourceId, forceFirecrawl } = await req.json();

    // Load source config
    let source: any = null;
    if (sourceId) {
      const { data } = await adminClient.from('scraping_sources').select('*').eq('id', sourceId).single();
      source = data;
    } else if (sourceUrl) {
      const { data } = await adminClient.from('scraping_sources').select('*').eq('url', sourceUrl).maybeSingle();
      source = data;
    }
    if (!source) {
      return new Response(JSON.stringify({ error: 'Source not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result: ScrapeResult;

    // Hybrid logic
    if (forceFirecrawl || source.needs_firecrawl || source.scraper_preference === 'firecrawl') {
      console.log(`[hybrid] Using Firecrawl for ${source.name}`);
      result = await scrapeWithFirecrawl(
        source.url, source.type, source.name,
        source.firecrawl_crawl_enabled, source.firecrawl_max_depth || 2,
      );
    } else {
      console.log(`[hybrid] Trying Cheerio first for ${source.name}`);
      result = await scrapeWithCheerio(source.url, source.type, source.name, source.custom_selectors || {});

      // Fallback to Firecrawl if Cheerio fails
      if (!result.success || result.itemsFound === 0) {
        const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
        if (firecrawlKey) {
          console.log(`[hybrid] Cheerio failed (${result.error || '0 items'}), falling back to Firecrawl`);
          result = await scrapeWithFirecrawl(
            source.url, source.type, source.name,
            source.firecrawl_crawl_enabled, source.firecrawl_max_depth || 2,
          );
          if (result.success && result.itemsFound > 0) {
            await adminClient.from('scraping_sources')
              .update({ needs_firecrawl: true }).eq('id', source.id);
          }
        }
      }
    }

    // Log attempt
    await adminClient.from('scraping_attempts').insert({
      source_id: source.id,
      scraper_used: result.scraperUsed,
      success: result.success,
      items_found: result.itemsFound,
      error_message: result.error || null,
      execution_time_ms: result.executionTimeMs,
    });

    // Save items to database
    let savedCount = 0;
    if (result.success && result.items.length > 0) {
      const { data: existing } = await adminClient
        .from('external_opportunities').select('apply_url').eq('type', source.type);
      const existingUrls = new Set((existing || []).map((e: any) => e.apply_url));

      for (const item of result.items) {
        if (existingUrls.has(item.applyUrl)) continue;
        const { error: insertError } = await adminClient.from('external_opportunities').insert({
          type: source.type,
          title: item.title,
          description: item.description,
          apply_url: item.applyUrl,
          organization: item.organization,
          deadline_date: item.deadline,
          source_name: source.name,
          status: 'pending',
          metadata: {
            scraped_at: new Date().toISOString(),
            scraper_used: result.scraperUsed,
            source_url: source.url,
          },
        });
        if (!insertError) {
          savedCount++;
          existingUrls.add(item.applyUrl);
        }
      }
    }

    // Update source stats
    await adminClient.from('scraping_sources').update({
      last_scraped_at: new Date().toISOString(),
      last_scrape_found: result.itemsFound,
      last_scrape_saved: savedCount,
      last_scraper_used: result.scraperUsed,
      updated_at: new Date().toISOString(),
    }).eq('id', source.id);

    return new Response(
      JSON.stringify({
        success: result.success, scraperUsed: result.scraperUsed,
        found: result.itemsFound, saved: savedCount,
        executionTimeMs: result.executionTimeMs,
        markdown: result.markdown?.substring(0, 1000),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('[scrape-hybrid] Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
