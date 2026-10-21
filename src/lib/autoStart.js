// ?start=1 on /mock-tests/{slug} (used by PDF QR codes): real visitors go straight into the test.
// Bots and prerender never auto-start, so the indexable intro page stays unchanged for Google.
const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|lighthouse|headless|prerender|google-inspectiontool|mediapartners/i;

export function isBotAgent(ua) { return BOT_RE.test(String(ua || '')); }

export function shouldAutoStart(search, ua, isPrerender) {
  if (isPrerender || isBotAgent(ua)) return false;
  return new URLSearchParams(search || '').get('start') === '1';
}

/** Same URL without the start flag (UTM tags kept) — so a refresh or share never re-starts. */
export function withoutStartParam(pathname, search, hash = '') {
  const p = new URLSearchParams(search || '');
  p.delete('start');
  const q = p.toString();
  return `${pathname}${q ? `?${q}` : ''}${hash || ''}`;
}
