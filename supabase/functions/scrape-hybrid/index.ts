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

function sanitizeText(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]/g, '$1')
    .replace(/\([^)]*\)/g, '')
    .replace(/[#*_~>`|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractDeadlineFromText(text: string): string | null {
  const patterns = [
    /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i,
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i,
    /last\s+date[:\s]+([^\n.,;]{8,25})/i,
    /closing\s+date[:\s]+([^\n.,;]{8,25})/i,
    /deadline[:\s]+([^\n.,;]{8,25})/i,
    /due\s+date[:\s]+([^\n.,;]{8,25})/i,
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

// ─── Field extraction helpers ───

function extractLocation(text: string): string | null {
  const cities = [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Hyderabad', 'Gujranwala', 'Peshawar', 'Quetta',
    'Sialkot', 'Sukkur', 'Larkana', 'Mardan', 'Abbottabad',
    'Swat', 'Gilgit', 'Muzaffarabad', 'Gwadar', 'Sargodha',
  ];
  const provinces = ['Sindh', 'Punjab', 'KPK', 'Khyber Pakhtunkhwa', 'Balochistan', 'AJK', 'Gilgit-Baltistan'];
  const lower = text.toLowerCase();
  for (const city of cities) {
    if (lower.includes(city.toLowerCase())) return city;
  }
  for (const province of provinces) {
    if (lower.includes(province.toLowerCase())) return province;
  }
  if (/all\s+pakistan|nationwide|country\s*wide/i.test(text)) return 'All Pakistan';
  return null;
}

function extractQualification(text: string): string | null {
  const qualifications = [
    'PhD', 'Doctorate', 'M.Phil', 'Masters', 'MS', 'MSc', 'MBA', 'MA',
    'Bachelor', 'BS', 'BSc', 'BA', 'BE', 'B.Tech',
    'Intermediate', 'FSc', 'FA', 'HSC',
    'Matric', 'SSC', 'O-Level', 'A-Level',
    'Graduate', 'Post-Graduate',
  ];
  const lower = text.toLowerCase();
  for (const qual of qualifications) {
    if (lower.includes(qual.toLowerCase())) return qual;
  }
  const match = text.match(/qualification[:\s]+([^\n.,;]{5,50})/i);
  return match ? match[1].trim() : null;
}

function extractSalary(text: string): string | null {
  const patterns = [
    /(?:BPS|Grade|Scale)[-:\s]*(\d+)(?:\s*to\s*|\s*-\s*)?(\d+)?/i,
    /(?:PKR|Rs\.?|Rupees)\s*([\d,]+)(?:\s*to\s*|\s*-\s*)?([\d,]+)?/i,
    /salary[:\s]*([\d,]+)(?:\s*to\s*|\s*-\s*)?([\d,]+)?/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
}

function extractExperience(text: string): string | null {
  const patterns = [
    /(\d+)\s*(?:to|\-)\s*(\d+)\s*years?\s*(?:of\s*)?experience/i,
    /(\d+)\+?\s*years?\s*(?:of\s*)?experience/i,
    /experience[:\s]+([^\n.,;]{5,40})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  if (/fresh|no\s+experience|entry\s+level/i.test(text)) return 'Fresh/Entry Level';
  return null;
}

function extractPositions(text: string): number | null {
  const match = text.match(/(\d+)\s*(?:post|position|vacancy|vacancies|seat)/i);
  return match ? parseInt(match[1]) : null;
}

function extractDepartment(text: string): string | null {
  const match = text.match(/department[:\s]+([^\n.,;]{5,50})/i);
  return match ? match[1].trim() : null;
}

function extractEligibility(text: string): string | null {
  const match = text.match(/eligibility[:\s]+([^\n]{20,200})/i);
  if (match) return match[1].trim();
  const phrases = [
    /Pakistani\s+(?:citizens|nationals|students)/i,
    /domicile\s+of\s+\w+/i,
    /minimum\s+(?:CGPA|percentage)[:\s]+[\d.]+/i,
  ];
  for (const phrase of phrases) {
    const m = text.match(phrase);
    if (m) return m[0];
  }
  return null;
}

function extractAmount(text: string): string | null {
  const patterns = [
    /(?:amount|value|worth|stipend)[:\s]*(?:PKR|Rs\.?|USD)?\s*([\d,]+)/i,
    /(?:PKR|Rs\.?|USD)\s*([\d,]+)\s*(?:per\s+month)?/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
}

function extractFieldOfStudy(text: string): string | null {
  const fields = [
    'Engineering', 'Computer Science', 'IT', 'Software',
    'Medicine', 'Medical', 'MBBS', 'BDS',
    'Business', 'Management', 'Finance',
    'Sciences', 'Physics', 'Chemistry', 'Biology',
    'Arts', 'Social Sciences', 'Humanities',
    'Law', 'Education', 'Agriculture',
  ];
  const lower = text.toLowerCase();
  for (const field of fields) {
    if (lower.includes(field.toLowerCase())) return field;
  }
  return null;
}

function extractEducationLevel(text: string): string | null {
  if (/phd|doctorate|doctoral/i.test(text)) return 'PhD';
  if (/masters?|ms |mphil|m\.phil/i.test(text)) return 'Masters';
  if (/undergraduate|bachelor|bs |bsc/i.test(text)) return 'Undergraduate';
  if (/intermediate|hsc|fsc|a\s*level/i.test(text)) return 'Intermediate';
  if (/matric|ssc|o\s*level/i.test(text)) return 'Matric';
  return null;
}

function extractTenderNumber(text: string): string | null {
  const patterns = [
    /(?:tender|nit|ref|no)[.:\s#]*([A-Z0-9\/-]{5,30})/i,
    /([A-Z]{2,}[-\/]\d+[-\/]\d+)/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractTenderValue(text: string): string | null {
  const match = text.match(/([\d,]+(?:\.\d+)?)\s*(?:million|lakh|crore|billion)?\s*(?:PKR|Rs\.?)?/i);
  return match ? match[0] : null;
}

function extractTenderCategory(text: string): string | null {
  const categories: Record<string, string[]> = {
    'Construction': ['construction', 'building', 'civil', 'road', 'bridge', 'infrastructure'],
    'IT': ['it', 'software', 'computer', 'digital', 'technology', 'system'],
    'Consultancy': ['consultancy', 'consultant', 'advisory'],
    'Supply': ['supply', 'procurement', 'purchase', 'goods', 'equipment'],
    'Services': ['services', 'maintenance', 'cleaning', 'security', 'transport'],
    'Medical': ['medical', 'healthcare', 'hospital', 'medicine'],
  };
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => lower.includes(kw))) return category;
  }
  return 'General';
}

function extractDocumentUrl(containerOrText: string, baseUrl: string): string | null {
  const pdfMatch = containerOrText.match(/href=["']([^"']*\.pdf[^"']*)/i);
  if (pdfMatch) return resolveUrl(pdfMatch[1], baseUrl);
  const downloadMatch = containerOrText.match(/href=["']([^"']*(?:download|document)[^"']*)/i);
  if (downloadMatch) return resolveUrl(downloadMatch[1], baseUrl);
  return null;
}

// Enrich item with type-specific fields based on full text
function enrichItem(item: any, fullText: string, sourceType: string): any {
  const location = extractLocation(fullText);
  if (location) item.location = location;

  if (sourceType === 'job') {
    item.qualification = extractQualification(fullText);
    item.salary = extractSalary(fullText);
    item.experience = extractExperience(fullText);
    item.positions = extractPositions(fullText);
    item.department = extractDepartment(fullText);
  } else if (sourceType === 'scholarship') {
    item.eligibility = extractEligibility(fullText);
    item.amount = extractAmount(fullText);
    item.field_of_study = extractFieldOfStudy(fullText);
    item.education_level = extractEducationLevel(fullText);
  } else if (sourceType === 'tender') {
    item.tender_number = extractTenderNumber(fullText);
    item.tender_value = extractTenderValue(fullText);
    item.tender_category = extractTenderCategory(fullText);
  }
  return item;
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
          const imgEl = container.querySelector('img[src]');
          const imageUrl = imgEl ? resolveUrl(imgEl.getAttribute('src') || '', url) : null;
          const item: any = {
            title, description: text.substring(0, 500).trim(),
            deadline: extractDeadlineFromText(text), organization: sourceName,
            applyUrl, imageUrl,
          };
          enrichItem(item, text, sourceType);
          items.push(item);
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
        const imgEl = (parent || heading).querySelector?.('img[src]');
        const imageUrl = imgEl ? resolveUrl(imgEl.getAttribute?.('src') || '', url) : null;

        const item: any = {
          title: text.substring(0, 200),
          description: fullText.substring(0, 500).trim(),
          deadline: extractDeadlineFromText(fullText),
          organization: sourceName, applyUrl, imageUrl,
        };
        enrichItem(item, fullText, sourceType);
        items.push(item);
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
        let pdfUrl: string | null = null;
        const allLinks = row.querySelectorAll('a[href]');
        for (const l of allLinks) {
          const href = l.getAttribute('href') || '';
          if (href.endsWith('.pdf') || href.includes('download')) {
            pdfUrl = resolveUrl(href, url);
            break;
          }
        }
        const imgEl = row.querySelector('img[src]');
        const imageUrl = imgEl ? resolveUrl(imgEl.getAttribute('src') || '', url) : null;
        const item: any = {
          title, description: text.substring(0, 500).trim(),
          deadline: extractDeadlineFromText(text),
          organization: sourceName, applyUrl,
          imageUrl, documentUrl: pdfUrl,
        };
        enrichItem(item, text, sourceType);
        items.push(item);
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
      signal: AbortSignal.timeout(60000), // 60s timeout (was 30s)
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
        items.push(...parseMarkdown(page.markdown || '', kws, sourceName, page.metadata?.sourceURL || url, sourceType));
      }
    } else if (data.data?.markdown) {
      markdown = data.data.markdown;
      items = parseMarkdown(markdown, kws, sourceName, url, sourceType);
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

function parseMarkdown(markdown: string, kws: string[], sourceName: string, url: string, sourceType: string): any[] {
  const items: any[] = [];
  const seen = new Set<string>();

  function addItem(rawTitle: string, section: string, fallbackUrl: string) {
    const imageMatch = section.match(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/);
    const imageUrl = imageMatch ? imageMatch[1] : null;
    const linkMatch = section.match(/\[[^\]]*\]\((https?:\/\/[^)]+)\)/);
    const applyUrl = linkMatch ? linkMatch[1] : fallbackUrl;

    const title = sanitizeText(rawTitle);
    if (title.length < 5) return;
    const key = title.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    const item: any = {
      title: title.substring(0, 200),
      description: sanitizeText(section).substring(0, 500),
      deadline: extractDeadlineFromText(section),
      organization: sourceName,
      applyUrl, imageUrl,
    };
    enrichItem(item, section, sourceType);
    items.push(item);
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

    // Save items — title-only dedup
    let savedCount = 0;
    if (result.success && result.items.length > 0) {
      const { data: existingRows } = await adminClient
        .from('external_opportunities').select('title').eq('type', source.type);
      const existingTitles = new Set(
        (existingRows || []).map((e: any) => sanitizeText(e.title || '').toLowerCase())
      );

      for (let i = 0; i < result.items.length; i++) {
        const item = result.items[i];
        const cleanTitle = sanitizeText(item.title || '');
        if (cleanTitle.length < 5) {
          console.log(`[dedup] Skipping short/empty title: "${cleanTitle}"`);
          continue;
        }
        const titleKey = cleanTitle.toLowerCase();

        if (existingTitles.has(titleKey)) {
          console.log(`[dedup] Skipping duplicate title: ${cleanTitle.substring(0, 50)}`);
          continue;
        }

        // Synthesize unique URL if needed
        let finalUrl = item.applyUrl || source.url;
        if (finalUrl === source.url) {
          finalUrl = `${source.url}#item-${simpleHash(titleKey)}`;
        }

        const cleanDesc = sanitizeText(item.description || '');

        const insertData: any = {
          type: source.type,
          title: cleanTitle,
          description: cleanDesc.substring(0, 500),
          apply_url: finalUrl,
          organization: item.organization,
          deadline_date: item.deadline,
          source_name: source.name,
          image_url: item.imageUrl || null,
          document_url: item.documentUrl || null,
          location: item.location || null,
          status: 'pending',
          metadata: {
            scraped_at: new Date().toISOString(),
            scraper_used: result.scraperUsed,
            source_url: source.url,
          },
        };

        // Add type-specific fields
        if (source.type === 'job') {
          insertData.qualification = item.qualification || null;
          insertData.salary = item.salary || null;
          insertData.experience = item.experience || null;
          insertData.positions = item.positions || null;
          insertData.department = item.department || null;
        } else if (source.type === 'scholarship') {
          insertData.eligibility = item.eligibility || null;
          insertData.amount = item.amount || null;
          insertData.field_of_study = item.field_of_study || null;
          insertData.education_level = item.education_level || null;
          insertData.scholarship_scope = item.scholarship_scope || null;
        } else if (source.type === 'tender') {
          insertData.tender_number = item.tender_number || null;
          insertData.tender_value = item.tender_value || null;
          insertData.tender_category = item.tender_category || null;
        }

        const { error: insertError } = await adminClient.from('external_opportunities').insert(insertData);
        if (!insertError) {
          savedCount++;
          existingTitles.add(titleKey);
        } else {
          console.warn(`[save] Insert error for "${cleanTitle.substring(0, 40)}": ${insertError.message}`);
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
