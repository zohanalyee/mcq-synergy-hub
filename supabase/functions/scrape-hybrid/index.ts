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

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ─── Expanded keyword lists for Pakistani sites ───

const keywords: Record<string, string[]> = {
  scholarship: ['scholarship', 'fellowship', 'grant', 'financial aid', 'stipend', 'award', 'bursary', 'merit', 'need-based', 'hec', 'funded'],
  job: ['vacancy', 'post', 'position', 'job', 'recruitment', 'career', 'hiring', 'apply', 'advertisement', 'notice', 'employment', 'opportunity', 'walk-in', 'interview', 'bps', 'grade', 'ppsc', 'fpsc', 'nts', 'ots', 'ets'],
  tender: ['tender', 'procurement', 'bid', 'rfp', 'nit', 'eoi', 'expression of interest', 'quotation', 'pre-bid', 'ppra', 'auction', 'supply'],
  board_result: ['result', 'announcement', 'gazette', 'merit', 'matric', 'intermediate', 'ssc', 'hsc', 'annual', 'supplementary', 'exam', 'board', 'bise', 'passing', 'marks', 'grade', 'position holders', 'toppers'],
};

// ─── Cheerio (deno-dom) scraping ───

async function scrapeWithCheerio(url: string, sourceType: string, sourceName: string, selectors: any): Promise<ScrapeResult> {
  const startTime = Date.now();
  try {
    console.log(`[cheerio] Fetching: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc) throw new Error('Failed to parse HTML');

    let items: any[] = [];
    const kws = keywords[sourceType] || [];

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
          // Extract image
          const imgEl = container.querySelector('img[src]');
          const imageUrl = imgEl ? resolveUrl(imgEl.getAttribute('src') || '', url) : null;
          items.push({
            title, description: text.substring(0, 500).trim(),
            deadline: extractDeadlineFromText(text), organization: sourceName,
            applyUrl, imageUrl,
          });
        }
      } catch (e) {
        console.warn(`[cheerio] Custom selector failed:`, e.message);
      }
    }

    // Fallback: keyword-based heading scan
    if (items.length === 0) {
      const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, .title, .heading, .notice-title, .notification-title');
      for (const heading of headings) {
        const text = heading.textContent?.trim() || '';
        const lower = text.toLowerCase();
        if (text.length < 5 || !kws.some(kw => lower.includes(kw))) continue;

        const parent = heading.parentElement;
        const fullText = parent?.textContent || text;
        const linkEl = (parent || heading).querySelector?.('a[href]') || heading.closest?.('a');
        const applyUrl = linkEl ? resolveUrl(linkEl.getAttribute?.('href') || '', url) : url;
        // Extract image
        const imgEl = (parent || heading).querySelector?.('img[src]');
        const imageUrl = imgEl ? resolveUrl(imgEl.getAttribute?.('src') || '', url) : null;

        items.push({
          title: text.substring(0, 200),
          description: fullText.substring(0, 500).trim(),
          deadline: extractDeadlineFromText(fullText),
          organization: sourceName, applyUrl, imageUrl,
        });
      }
    }

    // Fallback: table rows, list items, notices
    if (items.length === 0) {
      const rows = doc.querySelectorAll('table tr, .list-item, .card, article, li, dd, .notice, .notification, .news-item, .latest-news li');
      for (const row of rows) {
        const text = row.textContent?.trim() || '';
        if (text.length < 10 || !kws.some(kw => text.toLowerCase().includes(kw))) continue;
        const linkEl = row.querySelector('a[href]');
        const applyUrl = linkEl ? resolveUrl(linkEl.getAttribute('href') || '', url) : url;
        const title = linkEl?.textContent?.trim() || text.substring(0, 200);
        // Check for PDF links
        let pdfUrl: string | null = null;
        const allLinks = row.querySelectorAll('a[href]');
        for (const l of allLinks) {
          const href = l.getAttribute('href') || '';
          if (href.endsWith('.pdf') || href.includes('download')) {
            pdfUrl = resolveUrl(href, url);
            break;
          }
        }
        // Extract image
        const imgEl = row.querySelector('img[src]');
        const imageUrl = imgEl ? resolveUrl(imgEl.getAttribute('src') || '', url) : null;
        items.push({
          title, description: text.substring(0, 500).trim(),
          deadline: extractDeadlineFromText(text),
          organization: sourceName, applyUrl,
          imageUrl, documentUrl: pdfUrl,
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

function parseMarkdown(markdown: string, kws: string[], sourceName: string, url: string): any[] {
  const items: any[] = [];
  const seen = new Set<string>();

  function addItem(rawTitle: string, section: string, fallbackUrl: string) {
    // Extract image BEFORE sanitizing
    const imageMatch = section.match(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/);
    const imageUrl = imageMatch ? imageMatch[1] : null;
    // Extract link BEFORE sanitizing
    const linkMatch = section.match(/\[[^\]]*\]\((https?:\/\/[^)]+)\)/);
    const applyUrl = linkMatch ? linkMatch[1] : fallbackUrl;

    const title = sanitizeText(rawTitle);
    if (title.length < 5) return;
    const key = title.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    items.push({
      title: title.substring(0, 200),
      description: sanitizeText(section).substring(0, 500),
      deadline: extractDeadlineFromText(section),
      organization: sourceName,
      applyUrl, imageUrl,
    });
  }

  // Strategy 1: Split by markdown headings
  const headingSections = markdown.split(/^#{1,4}\s+/m);
  for (const section of headingSections) {
    const lines = section.split('\n');
    const rawTitle = lines[0]?.trim() || '';
    const text = section.toLowerCase();
    if (kws.some(kw => text.includes(kw)) && rawTitle.length > 3) {
      addItem(rawTitle, section, url);
    }
  }

  // Strategy 2: paragraphs
  if (items.length === 0) {
    const paragraphs = markdown.split(/\n\n+/);
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (trimmed.length < 15) continue;
      if (!kws.some(kw => trimmed.toLowerCase().includes(kw))) continue;
      const firstLine = trimmed.split('\n')[0].replace(/^[#*\-|>\s]+/, '').trim();
      addItem(firstLine, trimmed, url);
    }
  }

  // Strategy 3: table rows
  if (items.length === 0) {
    const tableRows = markdown.split('\n').filter(line => line.includes('|') && !line.match(/^[\s\-|]+$/));
    for (const row of tableRows) {
      const cells = row.split('|').map(c => c.trim()).filter(c => c.length > 0);
      const rowText = cells.join(' ').toLowerCase();
      if (!kws.some(kw => rowText.includes(kw))) continue;
      const title = cells[0] || cells[1] || '';
      addItem(title, row, url);
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
      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: adminCheck } = await adminClient
        .from('user_roles').select('role')
        .eq('user_id', user.id).eq('role', 'admin').maybeSingle();
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

    // Save items — improved deduplication using title+type AND apply_url
    let savedCount = 0;
    if (result.success && result.items.length > 0) {
      // Load existing by both apply_url and title for this type
      const { data: existingByUrl } = await adminClient
        .from('external_opportunities').select('apply_url, title').eq('type', source.type);
      const existingUrls = new Set((existingByUrl || []).map((e: any) => e.apply_url));
      const existingTitles = new Set((existingByUrl || []).map((e: any) => (e.title || '').toLowerCase().trim()));

      for (let i = 0; i < result.items.length; i++) {
        const item = result.items[i];
        const titleKey = (item.title || '').toLowerCase().trim();

        // Skip if title already exists (prevents semantic duplicates)
        if (existingTitles.has(titleKey)) {
          console.log(`[dedup] Skipping duplicate title: ${item.title.substring(0, 50)}`);
          continue;
        }

        // If applyUrl equals the source base URL, make it unique with title hash
        let finalUrl = item.applyUrl;
        if (finalUrl === source.url || existingUrls.has(finalUrl)) {
          if (finalUrl === source.url) {
            finalUrl = `${source.url}#item-${simpleHash(titleKey)}`;
          } else if (existingUrls.has(finalUrl) && !existingTitles.has(titleKey)) {
            // Same URL but different title — it's a new item, make URL unique
            finalUrl = `${finalUrl}#${simpleHash(titleKey)}`;
          } else {
            continue; // True duplicate
          }
        }

        const { error: insertError } = await adminClient.from('external_opportunities').insert({
          type: source.type,
          title: item.title,
          description: item.description,
          apply_url: finalUrl,
          organization: item.organization,
          deadline_date: item.deadline,
          source_name: source.name,
          image_url: item.imageUrl || null,
          document_url: item.documentUrl || null,
          status: 'pending',
          metadata: {
            scraped_at: new Date().toISOString(),
            scraper_used: result.scraperUsed,
            source_url: source.url,
          },
        });
        if (!insertError) {
          savedCount++;
          existingUrls.add(finalUrl);
          existingTitles.add(titleKey);
        } else {
          console.warn(`[save] Insert error: ${insertError.message}`);
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
