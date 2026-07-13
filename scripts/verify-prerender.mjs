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

console.log(`\n[verify-prerender] ${files.length - failed}/${files.length} pages OK; ${pageTypeChecks.length - typeFailed}/${pageTypeChecks.length} page types OK; ${requiredDynamicRoutes.length - requiredFailed}/${requiredDynamicRoutes.length} required routes OK; topic-content ${contentFailed ? 'FAILED' : 'OK'}`);
process.exit(failed || typeFailed || requiredFailed || contentFailed ? 1 : 0);

