// Warning-only report: database-stored links (featured cards, exam pages, blog posts)
// that point to a /mock-tests/ or /exams/ page missing from the sitemaps. Never fails.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const env = { ...process.env };
try {
  for (const line of readFileSync(new URL('.env', root), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch { /* no .env */ }

try {
  const dir = new URL('public/sitemaps/', root);
  const known = new Set(readdirSync(dir).filter((f) => f.endsWith('.xml')).flatMap((f) =>
    [...readFileSync(new URL(f, dir), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/\/$/, ''))));
  // Real, intentionally unlisted pages (prerendered but outside sitemaps).
  for (const p of ['/exams/karachi-university', '/exams/sindh-university', '/exams/nat']) known.add(p);
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
  if (!key) throw new Error('missing public key');
  const sb = createClient(env.VITE_SUPABASE_URL || 'https://pzhvipkcssxrsxxljbbz.supabase.co', key);

  async function all(table, cols) {
    const rows = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb.from(table).select(cols).range(from, from + 999).abortSignal(AbortSignal.timeout(10000));
      if (error) throw new Error(`${table}: ${error.message}`);
      rows.push(...(data || []));
      if (!data || data.length < 1000) return rows;
    }
  }
  const sources = [
    ['featured_cards', 'id,title,href'],
    ['exam_pages', 'slug,data'],
    ['blog_posts', 'slug,content'],
  ];
  const found = [];
  for (const [table, cols] of sources) {
    let rows = [];
    try { rows = await all(table, cols); } catch (e) { console.warn(`[db-links] skipped ${e.message}`); continue; }
    for (const r of rows) {
      const text = JSON.stringify(r);
      for (const m of text.matchAll(/(?:https?:\/\/(?:www\.)?mcqsai\.com)?(\/(?:mock-tests|exams)\/[a-z0-9-]+)/gi)) {
        const path = m[1].toLowerCase();
        if (!known.has(path)) found.push(`${table}:${r.slug || r.id} → ${path}`);
      }
    }
  }
  const uniq = [...new Set(found)];
  if (uniq.length) console.warn(`[db-links] ${uniq.length} link(s) to pages not in sitemaps:\n  ` + uniq.join('\n  '));
  else console.log('[db-links] no database links to missing mock-test or exam pages');
} catch (e) {
  console.warn(`[db-links] check skipped: ${e.message}`);
}
