#!/usr/bin/env node
// Verifies prerendered HTML output contains the SEO essentials.
// Skips silently when PRERENDER is not enabled (no snapshots produced).
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist');
if (!existsSync(DIST)) {
  console.log('[verify-prerender] skipped (no dist/)');
  process.exit(0);
}

const checks = [
  { name: 'title',       re: /<title>[^<]+<\/title>/i },
  { name: 'description', re: /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{40,}/i },
  { name: 'canonical',   re: /<link[^>]+rel=["']canonical["']/i },
  { name: 'og:title',    re: /<meta[^>]+property=["']og:title["']/i },
  { name: 'og:desc',     re: /<meta[^>]+property=["']og:description["']/i },
  { name: 'h1',          re: /<h1[\s>]/i },
  { name: 'json-ld',     re: /<script[^>]+type=["']application\/ld\+json["']/i },
  { name: 'internal-a',  re: /<a[^>]+href=["']\/[^"'#]+["']/i },
];

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
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  const missing = checks.filter(c => !c.re.test(html)).map(c => c.name);
  if (missing.length) {
    console.warn(`⚠️  ${f.replace(DIST, '')} — missing: ${missing.join(', ')}`);
    failed++;
  } else {
    console.log(`✅ ${f.replace(DIST, '')}`);
  }
}
console.log(`\n[verify-prerender] ${files.length - failed}/${files.length} pages OK`);
// Soft-fail: warnings only, don't break the build during initial rollout.
process.exit(0);
