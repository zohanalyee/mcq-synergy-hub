#!/usr/bin/env node
/**
 * dedupe-og — collapse duplicate single-value social/canonical head tags in prerendered HTML.
 *
 * WHY: index.html ships static default OG/Twitter/canonical tags (the fallback
 * for CSR-only detail pages). The prerender plugin APPENDS route-specific Helmet
 * tags AFTER those static defaults, so prerendered routes end up with TWO
 * og:image tags — the homepage default FIRST. WhatsApp/Facebook/X read the FIRST
 * occurrence, so they always showed the homepage banner.
 *
 * FIX: for each prerendered index.html, keep only the LAST occurrence of every
 * single-value tag below (the route-specific one Helmet injected). If a route
 * had no Helmet override, the static default is the only one and is preserved.
 *
 * Safe + idempotent. Runs after every production build; route HTML is expected
 * to exist because package.json builds with PRERENDER=true.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist');
if (!existsSync(DIST)) {
  console.log('[dedupe-og] skipped (no dist/)');
  process.exit(0);
}

// Tags that must appear at most once. Keyed by a stable identity.
const META_PROPS = [
  'og:image', 'og:image:secure_url', 'og:image:type', 'og:image:width',
  'og:image:height', 'og:image:alt', 'og:url', 'og:title', 'og:description',
  'og:type', 'og:site_name', 'og:locale',
];
const META_NAMES = [
  'twitter:image', 'twitter:image:alt', 'twitter:url', 'twitter:title',
  'twitter:description', 'twitter:card', 'twitter:site', 'description',
  'keywords', 'robots', 'author',
];

function dedupeAttr(html, attr, value) {
  // Match any <meta ... attr="value" ...> tag (attribute order-independent).
  const re = new RegExp(
    `<meta\\b[^>]*\\b${attr}=["']${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`,
    'gi',
  );
  const matches = html.match(re);
  if (!matches || matches.length <= 1) return html;
  // Keep the LAST occurrence (route-specific Helmet tag), drop earlier ones.
  let count = 0;
  const total = matches.length;
  return html.replace(re, (m) => (++count < total ? '' : m));
}

function dedupeCanonical(html) {
  const re = /<link\b[^>]*\brel=["']canonical["'][^>]*>/gi;
  const matches = html.match(re);
  if (!matches || matches.length <= 1) return html;
  let count = 0;
  const total = matches.length;
  return html.replace(re, (m) => (++count < total ? '' : m));
}

function dedupeTitle(html) {
  const re = /<title\b[^>]*>[\s\S]*?<\/title>/gi;
  const matches = html.match(re);
  if (!matches || matches.length <= 1) return html;
  let count = 0;
  const total = matches.length;
  return html.replace(re, (m) => (++count < total ? '' : m));
}

function processFile(p) {
  let html = readFileSync(p, 'utf8');
  const before = html;
  for (const prop of META_PROPS) html = dedupeAttr(html, 'property', prop);
  for (const name of META_NAMES) html = dedupeAttr(html, 'name', name);
  html = dedupeCanonical(html);
  html = dedupeTitle(html);
  if (html !== before) {
    writeFileSync(p, html);
    return true;
  }
  return false;
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
let changed = 0;
for (const f of files) if (processFile(f)) changed++;
console.log(`[dedupe-og] cleaned ${changed}/${files.length} prerendered HTML files`);
process.exit(0);
