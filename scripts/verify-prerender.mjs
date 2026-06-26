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
  if (ogImage !== expected) issues.push(`og:image=${ogImage || 'missing'} expected=${expected}`);
  const titleCount = (html.match(/<title\b[^>]*>[\s\S]*?<\/title>/gi) || []).length;
  if (titleCount !== 1) issues.push(`title count=${titleCount}`);
  if (issues.length) {
    console.warn(`⚠️  ${f.replace(DIST, '')} — ${issues.join(', ')}`);
    failed++;
  } else {
    console.log(`✅ ${f.replace(DIST, '')}`);
  }
}
console.log(`\n[verify-prerender] ${files.length - failed}/${files.length} pages OK`);
process.exit(failed ? 1 : 0);
