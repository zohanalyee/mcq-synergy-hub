// Refresh only the alerts URL; no sitemap or content writes.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { whatsappChannelUrl } from '../src/lib/growthRules.js';
const out = new URL('../src/data/whatsappChannelSnapshot.json', import.meta.url);
const env = { ...process.env };
try {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
  if (!key) throw new Error('missing public key');
  const sb = createClient(env.VITE_SUPABASE_URL || 'https://pzhvipkcssxrsxxljbbz.supabase.co', key);
  const { data, error } = await sb.from('system_settings').select('value').eq('key', 'whatsapp_channel_url').maybeSingle().abortSignal(AbortSignal.timeout(8000));
  if (error) throw error;
  writeFileSync(out, JSON.stringify(whatsappChannelUrl(data?.value)) + '\n');
  console.log('[whatsapp-channel] snapshot refreshed');
} catch (error) {
  console.warn(`[whatsapp-channel] keeping previous snapshot: ${error.message}`);
}