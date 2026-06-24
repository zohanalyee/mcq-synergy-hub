import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAIWithAutoSwitch } from "../_shared/gemini.ts";
import { sanitizeEmailLinks } from "../_shared/sanitize.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/* ---------------- Internal-link catalogue (duplicated for edge runtime) ---------------- */
const CATALOGUE: Record<string, { anchor: string; href: string; description: string; cta: string }[]> = {
  jobs: [
    { anchor: 'NTS MCQs', href: '/exams/nts', description: 'Practice NTS-style MCQs.', cta: 'Practice NTS MCQs' },
    { anchor: 'FPSC MCQs', href: '/fpsc-past-papers', description: 'FPSC past-paper MCQs.', cta: 'Practice FPSC MCQs' },
    { anchor: 'PPSC MCQs', href: '/ppsc-past-papers', description: 'PPSC topic-wise MCQs.', cta: 'Practice PPSC MCQs' },
    { anchor: 'Age Calculator', href: '/tools/age-calculator', description: 'Check age eligibility.', cta: 'Open Age Calculator' },
    { anchor: 'Percentage Calculator', href: '/tools/percentage-calculator', description: 'Compute marks percentage.', cta: 'Open Percentage Calculator' },
    { anchor: 'Merit Calculator', href: '/tools/merit-calculator', description: 'Estimate merit for government jobs.', cta: 'Open Merit Calculator' },
  ],
  scholarships: [
    { anchor: 'Study Guides', href: '/study-guides', description: 'Preparation guides.', cta: 'Browse Study Guides' },
    { anchor: 'Board MCQs', href: '/board-mcqs', description: 'Board MCQ practice.', cta: 'Practice Board MCQs' },
    { anchor: 'CGPA Calculator', href: '/tools/cgpa-calculator', description: 'Convert CGPA.', cta: 'Open CGPA Calculator' },
  ],
  mdcat: [
    { anchor: 'MDCAT Syllabus', href: '/mdcat-syllabus', description: '2026 MDCAT syllabus.', cta: 'View Syllabus' },
    { anchor: 'Biology MCQs', href: '/subjects/biology', description: 'MDCAT Biology MCQs.', cta: 'Practice Biology' },
    { anchor: 'Chemistry MCQs', href: '/subjects/chemistry', description: 'MDCAT Chemistry MCQs.', cta: 'Practice Chemistry' },
    { anchor: 'Aggregate Calculator', href: '/tools/aggregate-calculator', description: 'Compute MDCAT aggregate.', cta: 'Open Aggregate Calculator' },
    { anchor: 'Mock Tests', href: '/mock-tests', description: 'Full-length mock tests.', cta: 'Take Mock Test' },
  ],
  ecat: [
    { anchor: 'ECAT Preparation', href: '/ecat-preparation', description: 'ECAT prep.', cta: 'Start ECAT Prep' },
    { anchor: 'Physics MCQs', href: '/subjects/physics', description: 'ECAT Physics MCQs.', cta: 'Practice Physics' },
    { anchor: 'Maths MCQs', href: '/subjects/mathematics', description: 'ECAT Maths MCQs.', cta: 'Practice Maths' },
  ],
  css: [
    { anchor: 'Current Affairs MCQs', href: '/subjects/current-affairs', description: 'Daily current-affairs MCQs.', cta: 'Practice Current Affairs' },
    { anchor: 'Pakistan Affairs MCQs', href: '/subjects/pakistan-affairs', description: 'Pakistan Affairs MCQs.', cta: 'Practice Pakistan Affairs' },
    { anchor: 'English MCQs', href: '/subjects/english', description: 'CSS English MCQs.', cta: 'Practice English' },
    { anchor: 'CSS MCQs', href: '/css-mcqs', description: 'CSS mock MCQs.', cta: 'Practice CSS MCQs' },
  ],
  fpsc: [
    { anchor: 'FPSC MCQs', href: '/fpsc-past-papers', description: 'FPSC past-papers.', cta: 'Practice FPSC' },
    { anchor: 'General Knowledge MCQs', href: '/subjects/general-knowledge', description: 'GK MCQs.', cta: 'Practice GK' },
    { anchor: 'Pakistan Affairs MCQs', href: '/subjects/pakistan-affairs', description: 'Pakistan Affairs.', cta: 'Practice Pak Affairs' },
  ],
  ppsc: [
    { anchor: 'PPSC MCQs', href: '/ppsc-past-papers', description: 'PPSC topic-wise MCQs.', cta: 'Practice PPSC' },
    { anchor: 'General Knowledge MCQs', href: '/subjects/general-knowledge', description: 'GK MCQs.', cta: 'Practice GK' },
  ],
  nts: [
    { anchor: 'NTS MCQs', href: '/exams/nts', description: 'NTS MCQs.', cta: 'Practice NTS' },
    { anchor: 'Past Papers', href: '/past-papers', description: 'Past papers archive.', cta: 'Browse Past Papers' },
  ],
  'study-guides': [
    { anchor: 'Study Guides', href: '/study-guides', description: 'In-depth guides.', cta: 'Browse Study Guides' },
    { anchor: 'Custom Syllabus Builder', href: '/custom-syllabus', description: 'Build a study plan.', cta: 'Open Builder' },
    { anchor: 'Mock Tests', href: '/mock-tests', description: 'Mock tests.', cta: 'Take Mock Test' },
  ],
  'board-exams': [
    { anchor: 'Board MCQs', href: '/board-mcqs', description: 'Board MCQs.', cta: 'Practice Board MCQs' },
    { anchor: '9th Class MCQs', href: '/9th-class-mcqs', description: 'Matric Part-I MCQs.', cta: 'Practice 9th MCQs' },
    { anchor: 'Past Papers', href: '/past-papers', description: 'Past papers.', cta: 'Browse Past Papers' },
  ],
  admissions: [
    { anchor: 'NUST Entry Test', href: '/nust-entry-test', description: 'NUST NET prep.', cta: 'Prepare for NUST NET' },
    { anchor: 'COMSATS Entry Test', href: '/comsats-entry-test', description: 'COMSATS prep.', cta: 'Prepare for COMSATS' },
    { anchor: 'Aggregate Calculator', href: '/tools/aggregate-calculator', description: 'Compute aggregate.', cta: 'Open Aggregate Calculator' },
  ],
  'government-jobs': [
    { anchor: 'Forces Jobs Tests', href: '/forces-jobs-tests', description: 'PAF/Army/ASF prep.', cta: 'Browse Forces Tests' },
    { anchor: 'FPSC MCQs', href: '/fpsc-past-papers', description: 'FPSC MCQs.', cta: 'Practice FPSC' },
    { anchor: 'PPSC MCQs', href: '/ppsc-past-papers', description: 'PPSC MCQs.', cta: 'Practice PPSC' },
  ],
  general: [
    { anchor: 'Subjects', href: '/subjects', description: 'Browse all subjects.', cta: 'Browse Subjects' },
    { anchor: 'Mock Tests', href: '/mock-tests', description: 'Mock tests.', cta: 'Take Mock Test' },
    { anchor: 'Tools', href: '/tools', description: 'Calculators & utilities.', cta: 'Open Tools' },
  ],
};

const VALID_CATEGORIES = Object.keys(CATALOGUE);

const ALL_HREFS = new Set<string>();
Object.values(CATALOGUE).forEach(arr => arr.forEach(e => ALL_HREFS.add(e.href)));

const BANNED_PHRASES = [
  'golden opportunity', 'unlock your future', 'exciting chance', 'bright future',
  'incredible opportunity', 'amazing opportunity', 'dream come true', 'once in a lifetime',
  'don\'t miss out', 'embark on a journey',
];

const GENERIC_TAGS = new Set(['article', 'blog', 'education', 'pakistan', 'mcqsai', 'general', 'info', 'guide']);

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 100);
}

function extractJson(text: string): any {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  throw new Error('AI returned invalid JSON');
}

function pickLinks(category: string, max = 8) {
  return (CATALOGUE[category] ?? CATALOGUE.general).slice(0, max);
}

function estimateReadingMinutes(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function buildSystemPrompt(allowedLinks: { anchor: string; href: string }[]) {
  const allowedList = allowedLinks.map(l => `  - ${l.anchor} → ${l.href}`).join('\n');
  return `You are an editorial-grade SEO writer for MCQSAI — Pakistan's exam-prep platform (MDCAT, ECAT, NUST NET, CSS, PPSC, FPSC, NTS, board exams, government jobs, scholarships).

Voice: factual, concise, helpful, Pakistani educational-publishing tone. NOT marketing copy. Avoid clichés like ${BANNED_PHRASES.map(p => `"${p}"`).join(', ')}.

Respond with a SINGLE JSON object — no preamble, no markdown fences — with this EXACT shape:

{
  "title": "<=70 chars, includes year/organisation/exam if relevant, ends with '| MCQSAI' optional",
  "slug": "lowercase-hyphenated, <=80 chars",
  "excerpt": "1-2 sentences, <=180 chars",
  "content_markdown": "700-1400 words, ## main sections, ### sub-sections, varied sentence length, no duplicate H2s",
  "category": "ONE OF: ${VALID_CATEGORIES.join(', ')}",
  "tags": ["5-10 Pakistan-focused SEO keywords, slug-safe, deduped, NO generic words like 'article'/'blog'/'education'"],
  "meta_title": "<=60 chars",
  "meta_description": "<=155 chars, natural, action-oriented",
  "og_title": "<=70 chars social-friendly title",
  "twitter_title": "<=70 chars Twitter-card title",
  "highlights": {
    "type": "job|scholarship|guide|generic",
    "items": [{"label":"Last Date","value":"..."}, ...]   // 3-6 items, OMIT field if no factual data
  },
  "tables": [
    {"title": "Eligibility", "headers": ["Field","Value"], "rows": [["Age","18-30"], ...]}
  ],
  "faqs": [{"q":"What is the last date?","a":"..."}, ... 4-6 items],
  "internal_links": [{"anchor":"<from allow-list>","href":"<from allow-list>","context":"why relevant"}],
  "prep_blocks": [{"title":"Practice NTS MCQs","description":"...","href":"<from allow-list>","cta":"Start"}],
  "sources": [{"label":"Official Advertisement","url":"<exact apply_url/document_url from source data>"}],
  "jobposting": {   // ONLY when category==="jobs" AND source has job fields. OMIT entirely otherwise.
    "title":"...", "hiringOrganization":"...", "datePosted":"YYYY-MM-DD",
    "validThrough":"YYYY-MM-DD", "employmentType":"FULL_TIME|PART_TIME|CONTRACTOR|TEMPORARY|INTERN|VOLUNTEER|PER_DIEM|OTHER",
    "jobLocation":{"streetAddress":"","addressLocality":"","addressRegion":"","postalCode":"","addressCountry":"PK"},
    "baseSalary":{"currency":"PKR","value":"...","unitText":"MONTH|YEAR"}
  },
  "schema_type": "Article|JobPosting|HowTo"
}

HARD RULES:
- NEVER invent data. If a field is unknown (dates, salaries, phones, addresses), OMIT it. Empty strings are forbidden.
- internal_links and prep_blocks MUST only use anchors/hrefs from this allow-list:
${allowedList}
- Choose 4-8 internal_links and 2-4 prep_blocks that are genuinely relevant to the article topic.
- sources[].url must come from the source data's apply_url / document_url / official portal. Do NOT fabricate URLs.
- faqs must be specific to THIS article, not generic. 4-6 entries.
- tables: only when content has genuinely tabular data (eligibility, vacancies, important dates, salary tiers, merit formulas).
- Use ## for main sections, ### for sub-sections. No H1 inside content (the page renders the title as H1).
- No "Last Updated: ..." inside markdown — the renderer adds it separately.`;
}

/** Validate, repair, and enforce constraints on the AI draft. */
function sanitiseDraft(parsed: any, fallbackTitle: string, sourceUrl?: string) {
  const title = String(parsed.title || fallbackTitle).substring(0, 120).trim();
  const slug = slugify(String(parsed.slug || title)) || `post-${Date.now()}`;
  const excerpt = String(parsed.excerpt || '').substring(0, 280).trim();
  let content_markdown = String(parsed.content_markdown || '').trim();

  // Strip duplicate H2s
  const seenH2 = new Set<string>();
  content_markdown = content_markdown.split('\n').filter(line => {
    const m = line.match(/^##\s+(.+)$/);
    if (!m) return true;
    const key = m[1].toLowerCase().trim();
    if (seenH2.has(key)) return false;
    seenH2.add(key);
    return true;
  }).join('\n');

  // Strip any in-content "Last updated" lines (renderer handles it)
  content_markdown = content_markdown.replace(/^(?:>\s*)?(?:\*+|_+)?\s*Last [Uu]pdated:.*$/gm, '').replace(/\n{3,}/g, '\n\n');

  // Strip banned phrases (case-insensitive)
  for (const phrase of BANNED_PHRASES) {
    const re = new RegExp(phrase, 'ig');
    content_markdown = content_markdown.replace(re, '');
  }

  // Ensure email links carry a mailto: scheme (never relative internal routes).
  content_markdown = sanitizeEmailLinks(content_markdown);



  let category = String(parsed.category || 'general').toLowerCase().trim();
  if (!VALID_CATEGORIES.includes(category)) category = 'general';

  // Tags: dedupe, drop generic, slug-safe, 5-10
  const rawTags: string[] = Array.isArray(parsed.tags) ? parsed.tags.map((t: any) => String(t).toLowerCase().trim()) : [];
  const tags = Array.from(new Set(
    rawTags
      .map(t => t.replace(/[^a-z0-9\s-]/g, '').trim())
      .filter(t => t && t.length <= 40 && !GENERIC_TAGS.has(t))
      .map(t => t.replace(/\s+/g, '-'))
  )).slice(0, 10);

  let meta_title = String(parsed.meta_title || title).substring(0, 60).trim();
  let meta_description = String(parsed.meta_description || excerpt).substring(0, 160).trim();
  const og_title = String(parsed.og_title || meta_title).substring(0, 80).trim();
  const twitter_title = String(parsed.twitter_title || meta_title).substring(0, 80).trim();

  // Highlights
  let highlights: any = null;
  if (parsed.highlights && Array.isArray(parsed.highlights.items)) {
    const items = parsed.highlights.items
      .filter((i: any) => i && i.label && i.value && String(i.value).trim() !== '')
      .map((i: any) => ({ label: String(i.label).substring(0, 60), value: String(i.value).substring(0, 200) }))
      .slice(0, 8);
    if (items.length) highlights = { type: String(parsed.highlights.type || 'generic'), items };
  }

  // Tables
  const tables = Array.isArray(parsed.tables) ? parsed.tables.filter((t: any) =>
    t && Array.isArray(t.headers) && Array.isArray(t.rows) && t.rows.length > 0
  ).slice(0, 4).map((t: any) => ({
    title: String(t.title || '').substring(0, 120),
    headers: t.headers.map((h: any) => String(h).substring(0, 80)),
    rows: t.rows.slice(0, 30).map((row: any) =>
      Array.isArray(row) ? row.map((c: any) => String(c ?? '').substring(0, 200)) : []
    ),
  })) : [];

  // FAQs
  const faqs = Array.isArray(parsed.faqs) ? parsed.faqs.filter((f: any) => f && f.q && f.a)
    .slice(0, 6).map((f: any) => ({ q: String(f.q).substring(0, 200), a: String(f.a).substring(0, 800) })) : [];

  // Internal links — keep only allow-listed
  const internal_links = Array.isArray(parsed.internal_links) ? parsed.internal_links
    .filter((l: any) => l && l.href && ALL_HREFS.has(l.href))
    .slice(0, 8)
    .map((l: any) => ({
      anchor: String(l.anchor || '').substring(0, 80),
      href: l.href,
      context: String(l.context || '').substring(0, 200),
    })) : [];

  // Prep blocks — keep only allow-listed
  const prep_blocks = Array.isArray(parsed.prep_blocks) ? parsed.prep_blocks
    .filter((b: any) => b && b.href && ALL_HREFS.has(b.href))
    .slice(0, 4)
    .map((b: any) => ({
      title: String(b.title || '').substring(0, 80),
      description: String(b.description || '').substring(0, 200),
      href: b.href,
      cta: String(b.cta || 'Open').substring(0, 40),
    })) : [];

  // Sources — only http(s) URLs, prefer one matching the source row
  const sources = Array.isArray(parsed.sources) ? parsed.sources
    .filter((s: any) => s && s.url && /^https?:\/\//.test(String(s.url)))
    .slice(0, 4)
    .map((s: any) => ({ label: String(s.label || 'Official Source').substring(0, 120), url: String(s.url) })) : [];
  if (sourceUrl && !sources.some(s => s.url === sourceUrl)) {
    sources.unshift({ label: 'Official Source', url: sourceUrl });
  }

  // JobPosting — strip invalid enums, empty fields
  let jobposting: any = null;
  if (category === 'jobs' && parsed.jobposting && typeof parsed.jobposting === 'object') {
    const jp = parsed.jobposting;
    const validEmployment = ['FULL_TIME','PART_TIME','CONTRACTOR','TEMPORARY','INTERN','VOLUNTEER','PER_DIEM','OTHER'];
    const out: any = {
      title: jp.title ? String(jp.title).substring(0, 200) : title,
      hiringOrganization: jp.hiringOrganization ? String(jp.hiringOrganization).substring(0, 200) : undefined,
      datePosted: /^\d{4}-\d{2}-\d{2}$/.test(String(jp.datePosted || '')) ? jp.datePosted : undefined,
      validThrough: /^\d{4}-\d{2}-\d{2}$/.test(String(jp.validThrough || '')) ? jp.validThrough : undefined,
      employmentType: validEmployment.includes(String(jp.employmentType)) ? jp.employmentType : undefined,
    };
    if (jp.jobLocation && typeof jp.jobLocation === 'object') {
      const loc: any = {};
      ['streetAddress','addressLocality','addressRegion','postalCode','addressCountry'].forEach(k => {
        if (jp.jobLocation[k] && String(jp.jobLocation[k]).trim()) loc[k] = String(jp.jobLocation[k]).substring(0, 120);
      });
      if (Object.keys(loc).length) out.jobLocation = loc;
    }
    if (jp.baseSalary && jp.baseSalary.value) {
      out.baseSalary = {
        currency: String(jp.baseSalary.currency || 'PKR').substring(0, 8),
        value: String(jp.baseSalary.value).substring(0, 80),
        unitText: ['HOUR','DAY','WEEK','MONTH','YEAR'].includes(String(jp.baseSalary.unitText)) ? jp.baseSalary.unitText : 'MONTH',
      };
    }
    // Strip undefined
    Object.keys(out).forEach(k => out[k] === undefined && delete out[k]);
    if (out.hiringOrganization) jobposting = out;
  }

  let schema_type = String(parsed.schema_type || 'Article');
  if (!['Article','JobPosting','HowTo'].includes(schema_type)) schema_type = 'Article';
  if (schema_type === 'JobPosting' && !jobposting) schema_type = 'Article';

  const reading_time_minutes = estimateReadingMinutes(content_markdown);
  const last_updated_iso = new Date().toISOString();

  return {
    title, slug, excerpt, content_markdown,
    category, tags, meta_title, meta_description, og_title, twitter_title,
    highlights, tables, faqs, internal_links, prep_blocks, sources,
    jobposting, schema_type, reading_time_minutes, last_updated_iso,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claimsData.claims.sub;

    const { data: adminCheck } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const mode = body.mode as 'from_content' | 'from_prompt';
    const targetLength = body.target_length ?? 1100;

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let userPrompt = '';
    let sourceLabel = '';
    let sourceUrl: string | undefined;
    let categoryHint = 'general';

    if (mode === 'from_content') {
      const sourceTable = body.source_table as 'external_opportunities' | 'content_items';
      const sourceId = body.source_id as string;
      const angle = (body.angle as string | undefined)?.trim();

      if (!sourceTable || !sourceId || !['external_opportunities', 'content_items'].includes(sourceTable)) {
        return new Response(JSON.stringify({ error: 'source_table and source_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: row, error: rowErr } = await adminClient
        .from(sourceTable)
        .select('*')
        .eq('id', sourceId)
        .maybeSingle();

      if (rowErr || !row) {
        return new Response(JSON.stringify({ error: 'Source record not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      sourceLabel = row.title || 'Opportunity';
      sourceUrl = row.apply_url || row.document_url || undefined;
      const srcType = (row.type || row.category || '').toLowerCase();
      categoryHint = srcType === 'scholarship' ? 'scholarships' : srcType === 'job' ? 'jobs' : 'general';

      // Build structured extraction block (only non-empty fields)
      const factualFields: Record<string, any> = {};
      const candidateKeys = [
        'title','organization','department','location','deadline_date','deadline','apply_url','document_url',
        'salary','qualification','experience','positions','eligibility','field_of_study','education_level',
        'scholarship_scope','sector','region','tender_value','source_name','amount','type','category',
        'exam_type','exam_year','government_level','cadre','scholarship_type','institution','subject','topic','difficulty',
      ];
      for (const k of candidateKeys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') factualFields[k] = row[k];
      }
      if (row.metadata && typeof row.metadata === 'object') factualFields._metadata = row.metadata;

      userPrompt = `Rewrite and expand the following ${categoryHint === 'jobs' ? 'job opportunity' : categoryHint === 'scholarships' ? 'scholarship' : 'item'} into an editorial SEO blog post for Pakistani readers.

FACTUAL SOURCE DATA (use ONLY this — do not invent additional facts):
\`\`\`json
${JSON.stringify(factualFields, null, 2).substring(0, 6000)}
\`\`\`

${angle ? `Editorial angle: ${angle}\n\n` : ''}Target length: ~${targetLength} words.
Suggested category: "${categoryHint}".

Populate highlights, tables, FAQs, jobposting (if category=jobs) from the factual data above. Pick internal_links and prep_blocks that fit this opportunity. Add the official source URL (apply_url/document_url) to sources.`;
    } else if (mode === 'from_prompt') {
      const presetTopic = (body.preset_topic as string | undefined)?.trim();
      const customInstructions = (body.custom_instructions as string | undefined)?.trim();

      if (!presetTopic && !customInstructions) {
        return new Response(JSON.stringify({ error: 'preset_topic or custom_instructions required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      sourceLabel = presetTopic?.substring(0, 80) || 'Custom prompt';

      // Heuristic category hint
      const combined = `${presetTopic || ''} ${customInstructions || ''}`.toLowerCase();
      if (/mdcat/.test(combined)) categoryHint = 'mdcat';
      else if (/ecat/.test(combined)) categoryHint = 'ecat';
      else if (/\bcss\b/.test(combined)) categoryHint = 'css';
      else if (/fpsc/.test(combined)) categoryHint = 'fpsc';
      else if (/ppsc/.test(combined)) categoryHint = 'ppsc';
      else if (/\bnts\b/.test(combined)) categoryHint = 'nts';
      else if (/scholarship/.test(combined)) categoryHint = 'scholarships';
      else if (/job|career|recruitment/.test(combined)) categoryHint = 'jobs';
      else if (/9th|10th|matric|board/.test(combined)) categoryHint = 'board-exams';
      else if (/nust|comsats|admission/.test(combined)) categoryHint = 'admissions';
      else categoryHint = 'study-guides';

      userPrompt = `Write an editorial-grade, Pakistan-context SEO blog post for MCQSAI based on this instruction:

${presetTopic || ''}

${customInstructions ? `Additional admin instructions: ${customInstructions}\n\n` : ''}Target length: ~${targetLength} words.
Suggested category: "${categoryHint}" (override only if clearly wrong).

Populate highlights, FAQs, internal_links and prep_blocks relevant to the topic. Skip jobposting unless this is genuinely a job advertisement.`;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid mode. Use from_content or from_prompt.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const allowedLinks = pickLinks(categoryHint, 8);
    const SYSTEM_PROMPT = buildSystemPrompt(allowedLinks);

    console.log(`[generate-blog] mode=${mode} category=${categoryHint} source="${sourceLabel}"`);

    const result = await callAIWithAutoSwitch(SYSTEM_PROMPT, userPrompt, {
      temperature: 0.7,
      maxOutputTokens: 6144,
    }, { supabaseClient: null, sourceType: 'generate-blog' });

    let parsed: any;
    try {
      parsed = extractJson(result.text);
    } catch (e: any) {
      console.error('[generate-blog] JSON parse failed:', e.message, 'raw=', result.text?.substring(0, 400));
      throw new Error('AI returned malformed output. Please retry.');
    }

    const draft = sanitiseDraft(parsed, sourceLabel, sourceUrl);

    await adminClient.from('ai_usage_logs').insert({
      source_type: mode === 'from_content' ? 'blog_from_content' : 'blog_from_prompt',
      ai_provider: result.provider,
      cost_estimate: result.cost,
      questions_requested: 1,
      questions_fetched: 1,
      questions_saved: 0,
      subject: draft.category,
      topic: draft.title.substring(0, 80),
      triggered_by_user_id: userId,
      metadata: {
        mode,
        source_table: body.source_table,
        source_id: body.source_id,
        preset_topic: body.preset_topic ? String(body.preset_topic).substring(0, 120) : undefined,
        word_count: draft.content_markdown.split(/\s+/).length,
        reading_time_minutes: draft.reading_time_minutes,
        faqs: draft.faqs.length,
        tables: draft.tables.length,
        internal_links: draft.internal_links.length,
        schema_type: draft.schema_type,
      },
    });

    console.log(`[generate-blog] ✅ "${draft.title}" cat=${draft.category} tags=${draft.tags.length} faqs=${draft.faqs.length} (${result.provider})`);

    // Backwards-compat: also expose `content` alongside `content_markdown`
    return new Response(JSON.stringify({
      success: true,
      provider: result.provider,
      draft: {
        ...draft,
        content: draft.content_markdown,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('[generate-blog] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
