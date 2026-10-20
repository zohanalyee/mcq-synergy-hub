// Snapshot of the admin-managed Featured Exams cards for prerendered HTML.
// Keeps the previous file when the read fails. No sitemap or content writes.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'node:fs';
const out = new URL('../src/generated/featuredCards.json', import.meta.url);
const env = { ...process.env };
try {
  try {
    for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch { /* no .env */ }
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
  if (!key) throw new Error('missing public key');
  const sb = createClient(env.VITE_SUPABASE_URL || 'https://pzhvipkcssxrsxxljbbz.supabase.co', key);
  const [cards, flag] = await Promise.all([
    sb.from('featured_cards').select('id,title,subtitle,badge,href,deadline_date,exam_slug,closed_days,sort_order,is_active,icon,placements').eq('is_active', true).order('sort_order').range(0, 99).abortSignal(AbortSignal.timeout(8000)),
    sb.from('system_settings').select('value').eq('key', 'featured_block_enabled').maybeSingle().abortSignal(AbortSignal.timeout(8000)),
  ]);
  if (cards.error) throw cards.error;
  if (flag.error) throw flag.error;
  const enabled = flag.data ? flag.data.value !== false : true;
  writeFileSync(out, JSON.stringify({ generatedAt: Date.now(), enabled, cards: cards.data ?? [] }, null, 1) + '\n');
  console.log(`[featured-cards] snapshot refreshed (${cards.data?.length ?? 0} cards)`);
} catch (error) {
  console.warn(`[featured-cards] keeping previous snapshot: ${error.message}`);
}
