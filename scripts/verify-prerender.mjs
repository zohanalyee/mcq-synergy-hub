#!/usr/bin/env node
// Verifies prerendered HTML output contains crawler-visible SEO essentials and
// exactly one single-value OG/Twitter/canonical tag per page.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist');
if (!existsSync(DIST)) {
  console.log('[verify-prerender] skipped (no dist/)');
  process.exit(0);
}

const checks = [
  { name: 'title',       re: /<title\b[^>]*>[^<]+<\/title>/i },
  { name: 'description', re: /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{40,}/i },
  { name: 'canonical',   re: /<link[^>]+rel=["']canonical["']/i },
  { name: 'og:title',    re: /<meta[^>]+property=["']og:title["']/i },
  { name: 'og:desc',     re: /<meta[^>]+property=["']og:description["']/i },
  { name: 'h1',          re: /<h1[\s>]/i },
  { name: 'json-ld',     re: /<script[^>]+type=["']application\/ld\+json["']/i },
  { name: 'internal-a',  re: /<a[^>]+href=["']\/[^"'#]+["']/i },
];

const requiredRouteFiles = [
  'index.html',
  'jobs/index.html',
  'scholarships/index.html',
  'blog/index.html',
  'tools/index.html',
  'mdcat-syllabus/index.html',
];

const singletonMetaProps = [
  'og:image', 'og:image:secure_url', 'og:image:type', 'og:image:width',
  'og:image:height', 'og:image:alt', 'og:url', 'og:title', 'og:description',
  'og:type', 'og:site_name', 'og:locale',
];
const singletonMetaNames = [
  'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt',
  'twitter:card', 'twitter:url', 'twitter:site', 'description', 'keywords',
  'robots', 'author',
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countMeta(html, attr, value) {
  const re = new RegExp(`<meta\\b(?=[^>]*\\b${attr}=["']${escapeRegExp(value)}["'])[^>]*>`, 'gi');
  return (html.match(re) || []).length;
}

function contentOf(html, attr, value) {
  const re = new RegExp(`<meta\\b(?=[^>]*\\b${attr}=["']${escapeRegExp(value)}["'])[^>]*\\bcontent=["']([^"']+)["'][^>]*>`, 'i');
  return html.match(re)?.[1] || '';
}

function expectedOgImage(file) {
  const route = file.replace(DIST, '').replace(/\/index\.html$/, '') || '/';
  // Job/scholarship detail pages live under /opportunity/* and may use either
  // the jobs/scholarships banner (injected) or the default — accept all three.
  if (route.startsWith('/opportunity')) return [
    'https://mcqsai.com/og/jobs-og.jpg',
    'https://mcqsai.com/og/scholarships-og.jpg',
    'https://mcqsai.com/og/default-og.jpg',
  ];
  if (route.startsWith('/jobs')) return 'https://mcqsai.com/og/jobs-og.jpg';
  if (route.startsWith('/scholarships')) return 'https://mcqsai.com/og/scholarships-og.jpg';
  if (route.startsWith('/blog')) return 'https://mcqsai.com/og/blog-og.jpg';
  if (route.startsWith('/tools')) return 'https://mcqsai.com/og/tools-og.jpg';
  if (route.startsWith('/boards') || route.includes('class-mcqs') || route.startsWith('/9th-class') || route.startsWith('/board-mcqs')) return 'https://mcqsai.com/og/boards-og.jpg';
  if (route.startsWith('/exams') || route.startsWith('/mdcat') || route.startsWith('/ecat') || route.startsWith('/css') || route.includes('entry-test') || route.includes('past-papers') || route.includes('-test') || route.startsWith('/forces-jobs-tests') || route.startsWith('/pst-sst')) return 'https://mcqsai.com/og/exams-og.jpg';
  return 'https://mcqsai.com/og/default-og.jpg';
}


function walk(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (f === 'index.html') out.push(p);
  }
  return out;
}

const files = walk(DIST);
let failed = 0;
for (const routeFile of requiredRouteFiles) {
  if (!existsSync(join(DIST, routeFile))) {
    console.warn(`⚠️  /${routeFile} — missing required prerendered HTML`);
    failed++;
  }
}
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  const issues = checks.filter(c => !c.re.test(html)).map(c => `missing ${c.name}`);
  for (const prop of singletonMetaProps) {
    const count = countMeta(html, 'property', prop);
    if (count !== 1) issues.push(`${prop} count=${count}`);
  }
  for (const name of singletonMetaNames) {
    const count = countMeta(html, 'name', name);
    if (count !== 1) issues.push(`${name} count=${count}`);
  }
  const ogImageTag = html.match(/<meta\b(?=[^>]*\bproperty=["']og:image["'])[^>]*>/i)?.[0] || '';
  // Require whitespace before `content=` so the dev component-tagger's
  // `data-component-content="..."` attribute is never mistaken for the real one.
  const ogImage = ogImageTag.match(/(?:^|\s)content=["']([^"']+)["']/i)?.[1] || '';
  const expected = expectedOgImage(f);
  const expectedList = Array.isArray(expected) ? expected : [expected];
  if (!expectedList.includes(ogImage)) issues.push(`og:image=${ogImage || 'missing'} expected=${expectedList.join('|')}`);
  const titleCount = (html.match(/<title\b[^>]*>[\s\S]*?<\/title>/gi) || []).length;
  if (titleCount !== 1) issues.push(`title count=${titleCount}`);
  if (issues.length) {
    console.warn(`⚠️  ${f.replace(DIST, '')} — ${issues.join(', ')}`);
    failed++;
  } else {
    console.log(`✅ ${f.replace(DIST, '')}`);
  }
}

// ---- Per-page-type assertions -------------------------------------------
// Guarantee each dynamic page type actually got prerendered/injected AND that
// its <title> + canonical are UNIQUE (not the homepage shell). This is what
// caught the original "every dynamic route returns the homepage" regression.
function metaContent(html, attr, value) {
  const re = new RegExp(`<meta\\b(?=[^>]*\\b${attr}=["']${escapeRegExp(value)}["'])[^>]*\\bcontent=["']([^"']+)["']`, 'i');
  return html.match(re)?.[1] || '';
}
function titleOf(html) { return (html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim(); }
function canonicalOf(html) { return html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["']/i)?.[1] || ''; }

const homeHtml = readFileSync(join(DIST, 'index.html'), 'utf8');
const homeTitle = titleOf(homeHtml);
const homeDesc = contentOf(homeHtml, 'name', 'description');

const pageTypeChecks = [
  { type: 'tools',           prefix: '/tools/' },
  { type: 'programmatic /p', prefix: '/p/' },
  { type: 'subject-content', prefix: '/subject-content/' },
  { type: 'mock-tests',      prefix: '/mock-tests/' },
  { type: 'opportunity',     prefix: '/opportunity/' },
  { type: 'blog',            prefix: '/blog/', minExtraSegments: 1 },
  { type: 'board topics',    prefix: '/boards/', minExtraSegments: 4 },
];

let typeFailed = 0;
for (const { type, prefix, minExtraSegments = 1 } of pageTypeChecks) {
  const matches = files.filter((f) => {
    const route = f.replace(DIST, '').replace(/\/index\.html$/, '');
    if (!route.startsWith(prefix)) return false;
    return route.slice(prefix.length).split('/').filter(Boolean).length >= minExtraSegments;
  });
  if (matches.length === 0) {
    console.warn(`❌ [type:${type}] no prerendered/injected pages found under ${prefix}`);
    typeFailed++;
    continue;
  }
  const sample = matches[0];
  const html = readFileSync(sample, 'utf8');
  const t = titleOf(html);
  const canon = canonicalOf(html);
  const desc = contentOf(html, 'name', 'description');
  const route = sample.replace(DIST, '').replace(/\/index\.html$/, '');
  const problems = [];
  if (!t || t === homeTitle) problems.push(`title not unique ("${t}")`);
  if (desc && desc === homeDesc) problems.push('description matches homepage');
  if (!canon || !canon.endsWith(route)) problems.push(`canonical not self-referencing ("${canon}")`);
  if (problems.length) {
    console.warn(`❌ [type:${type}] ${route} — ${problems.join(', ')}`);
    typeFailed++;
  } else {
    console.log(`✅ [type:${type}] ${matches.length} pages (sample ${route})`);
  }
}

// ---- Exact required dynamic routes ---------------------------------------
// High-value SEO URLs that MUST ship their own (non-homepage) head in raw HTML.
// This is the guard that catches "live URL returns the homepage shell".
const BASE_URL = 'https://mcqsai.com';
const requiredDynamicRoutes = [
  '/mock-tests/sindh-teaching-license-exam-secondary-school-teacher-sst',
  '/subject-content/physics',
];
let requiredFailed = 0;
for (const route of requiredDynamicRoutes) {
  const file = join(DIST, route.replace(/^\//, ''), 'index.html');
  if (!existsSync(file)) {
    console.warn(`❌ [required] ${route} — file not generated (dist${route}/index.html missing)`);
    requiredFailed++;
    continue;
  }
  const html = readFileSync(file, 'utf8');
  const t = titleOf(html);
  const canon = canonicalOf(html);
  const desc = contentOf(html, 'name', 'description');
  const problems = [];
  if (!t || t === homeTitle) problems.push(`title not unique ("${t}")`);
  if (desc && desc === homeDesc) problems.push('description matches homepage');
  if (canon !== `${BASE_URL}${route}`) problems.push(`canonical not self-referencing ("${canon}")`);
  if (problems.length) {
    console.warn(`❌ [required] ${route} — ${problems.join(', ')}`);
    requiredFailed++;
  } else {
    console.log(`✅ [required] ${route}`);
  }
}

// ---- static.xml ⇄ prerender parity guard --------------------------------
// Every URL advertised in sitemaps/static.xml must ship its OWN prerendered
// head. Without this, a hub route missing from PRERENDER_ROUTES silently serves
// the homepage shell — including canonical → "/" — telling Google to drop it.
let staticFailed = 0;
const staticSitemap = ['dist/sitemaps/static.xml', 'public/sitemaps/static.xml']
  .map((p) => join(process.cwd(), p))
  .find((p) => existsSync(p));
if (!staticSitemap) {
  console.warn('❌ [static-parity] sitemaps/static.xml not found — cannot verify hub prerendering');
  staticFailed++;
} else {
  const xml = readFileSync(staticSitemap, 'utf8');
  const routes = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
    .map((m) => m[1].replace(BASE_URL, ''))
    .map((r) => (r === '' ? '/' : r));
  const bad = [];
  for (const route of routes) {
    const file = route === '/' ? join(DIST, 'index.html') : join(DIST, route.replace(/^\//, ''), 'index.html');
    if (!existsSync(file)) { bad.push(`${route} (not prerendered)`); continue; }
    if (route === '/') continue;
    const html = readFileSync(file, 'utf8');
    const canon = canonicalOf(html);
    if (canon !== `${BASE_URL}${route}`) bad.push(`${route} (canonical "${canon}")`);
    else if (titleOf(html) === homeTitle) bad.push(`${route} (homepage title)`);
  }
  if (bad.length) {
    console.warn(`❌ [static-parity] ${bad.length}/${routes.length} sitemap hubs not self-canonical:\n   - ${bad.join('\n   - ')}`);
    staticFailed++;
  } else {
    console.log(`✅ [static-parity] all ${routes.length} static.xml hubs prerendered + self-canonical`);
  }
}


// ---- Topic CONTENT assertion (D2c/D3.5) ---------------------------------
// At least one indexable /boards/.../topic page must ship, in RAW HTML, real
// MCQ content + Quiz + FAQPage JSON-LD (not just a corrected head). This guards
// the non-JS AI-crawler visibility goal. Non-fatal if NO topic pages exist at
// all (e.g. empty DB in a dev build), but fatal if topic pages exist yet none
// carry content — that means the content-injection step silently regressed.
let contentFailed = 0;
const topicFiles = files.filter((f) => {
  const route = f.replace(DIST, '').replace(/\/index\.html$/, '');
  return route.startsWith('/boards/') && route.slice('/boards/'.length).split('/').filter(Boolean).length >= 4;
});
if (topicFiles.length > 0) {
  const withContent = topicFiles.filter((f) => {
    const html = readFileSync(f, 'utf8');
    return /"@type":"Quiz"/.test(html) && /"@type":"FAQPage"/.test(html) &&
      /<article>[\s\S]*?<h3>Q1\./.test(html);
  });
  if (withContent.length === 0) {
    console.warn(`❌ [topic-content] ${topicFiles.length} topic pages found but NONE carry raw MCQ + Quiz + FAQPage content`);
    contentFailed++;
  } else {
    const sample = withContent[0].replace(DIST, '').replace(/\/index\.html$/, '');
    console.log(`✅ [topic-content] ${withContent.length}/${topicFiles.length} topic pages ship raw MCQ + Quiz + FAQPage content (sample ${sample})`);
  }
}

// ---- Indexable tool BODY assertion --------------------------------------
// Every path in src/config/toolsSeo.ts INDEXABLE_TOOL_PATHS must prerender real
// body content. A lazy()/Suspense route ships an empty #root, so crawlers that
// do not run JS see nothing. This guard catches that regression per tool.
let toolFailed = 0;
const toolsSeoSrc = join(process.cwd(), 'src/config/toolsSeo.ts');
if (!existsSync(toolsSeoSrc)) {
  console.warn('❌ [tool-body] src/config/toolsSeo.ts not found');
  toolFailed++;
} else {
  const src = readFileSync(toolsSeoSrc, 'utf8');
  const block = src.split(/export const INDEXABLE_TOOL_PATHS[^=]*=/)[1] || '';
  const toolPaths = [...block.matchAll(/'(\/tools\/[a-z0-9-]+)'/g)].map((m) => m[1]);
  const bad = [];
  for (const route of toolPaths) {
    const file = join(DIST, route.replace(/^\//, ''), 'index.html');
    if (!existsSync(file)) { bad.push(`${route} (not prerendered)`); continue; }
    const html = readFileSync(file, 'utf8');
    const rootStart = html.search(/<div id=["']root["'][^>]*>/i);
    const root = rootStart === -1 ? '' : html.slice(rootStart).split(/<\/body>/i)[0];
    const text = root.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ').trim();
    if (text.length < 400) bad.push(`${route} (body text ${text.length} chars — Suspense shell?)`);
    else if (!/<h1[\s>]/i.test(root)) bad.push(`${route} (no h1 in body)`);
  }
  if (bad.length) {
    console.warn(`❌ [tool-body] ${bad.length}/${toolPaths.length} indexable tools have empty/thin prerendered body:\n   - ${bad.join('\n   - ')}`);
    toolFailed++;
  } else {
    console.log(`✅ [tool-body] all ${toolPaths.length} indexable tools ship real prerendered body content`);
  }
}

// ---- Mock-test BODY assertion (JOA traffic sprint) ----------------------
// Allow-listed mock-test pages must ship real body content (syllabus table +
// question preview) in RAW HTML, not the homepage shell. Keep this list in sync
// with MOCK_TEST_CONTENT_SLUGS in scripts/inject-meta.mjs.
let mockBodyFailed = 0;
const MOCK_TEST_CONTENT_ROUTES = ['/mock-tests/junior-office-associate-bps-13'];
{
  const bad = [];
  for (const route of MOCK_TEST_CONTENT_ROUTES) {
    const file = join(DIST, route.replace(/^\//, ''), 'index.html');
    if (!existsSync(file)) { bad.push(`${route} (not generated)`); continue; }
    const html = readFileSync(file, 'utf8');
    const rootStart = html.search(/<div id=["']root["'][^>]*>/i);
    const root = rootStart === -1 ? '' : html.slice(rootStart).split(/<\/body>/i)[0];
    if (!/Official Syllabus/i.test(root)) bad.push(`${route} (no syllabus section in body)`);
    else if (!/Past Papers Pattern/i.test(root)) bad.push(`${route} (no past-paper pattern in body)`);
    else if (!/<h1[\s>]/i.test(root)) bad.push(`${route} (no h1 in body)`);
  }
  if (bad.length) {
    console.warn(`❌ [mock-test-body] ${bad.length}/${MOCK_TEST_CONTENT_ROUTES.length} allow-listed mock tests lack raw body content:\n   - ${bad.join('\n   - ')}`);
    mockBodyFailed++;
  } else {
    console.log(`✅ [mock-test-body] all ${MOCK_TEST_CONTENT_ROUTES.length} allow-listed mock-test pages ship raw syllabus + preview content`);
  }
}

console.log(`\n[verify-prerender] ${files.length - failed}/${files.length} pages OK; ${pageTypeChecks.length - typeFailed}/${pageTypeChecks.length} page types OK; ${requiredDynamicRoutes.length - requiredFailed}/${requiredDynamicRoutes.length} required routes OK; static-parity ${staticFailed ? "FAILED" : "OK"}; topic-content ${contentFailed ? 'FAILED' : 'OK'}; tool-body ${toolFailed ? 'FAILED' : 'OK'}; mock-test-body ${mockBodyFailed ? 'FAILED' : 'OK'}`);
process.exit(failed || typeFailed || requiredFailed || staticFailed || contentFailed || toolFailed || mockBodyFailed ? 1 : 0);

