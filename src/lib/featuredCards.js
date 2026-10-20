// Featured Exams block rules — shared by browser and build scripts.
// All dates are Pakistan time (UTC+05:00).

export const BADGES = ['APPLY NOW', 'LIVE', 'CLOSING SOON', 'PRACTICE NOW', 'COMING SOON'];
export const ICONS = ['GraduationCap', 'Building2', 'FileText', 'Timer', 'Bell', 'Sparkles'];
export const CLOSING_SOON_DAYS = 7;
export const WHATSAPP_FALLBACK = 'https://whatsapp.com/channel/0029Vb9DgAk8KMqkSpdiWV32';

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];

/** YYYY-MM-DD for the given instant in Pakistan time. */
export function pkToday(nowMs) {
  return new Date(nowMs + 5 * 3600 * 1000).toISOString().slice(0, 10);
}

const dayNum = (iso) => Math.round(Date.parse(`${iso}T00:00:00Z`) / 86400000);
export const daysBetween = (fromIso, toIso) => dayNum(toIso) - dayNum(fromIso);

/** "29 October 2026" → "2026-10-29"; ISO passes through; anything else → null. */
export function parseDateText(text) {
  if (typeof text !== 'string') return null;
  const t = text.trim();
  if (ISO.test(t)) return t;
  const m = t.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const mi = MONTHS.indexOf(m[2].toLowerCase());
  if (mi < 0) return null;
  return `${m[3]}-${String(mi + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

/** Candidate deadlines from exam_pages facts: applyBy text + every closesIso. */
function examDeadlines(facts) {
  const out = [];
  const a = parseDateText(facts?.applyBy);
  if (a) out.push(a);
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) {
        if (k === 'closesIso' && typeof x === 'string' && ISO.test(x)) out.push(x);
        else walk(x);
      }
    }
  };
  walk(facts);
  return out.sort();
}

/** Card's own date wins; else nearest upcoming exam deadline (or latest past one). */
export function resolveDeadline(card, examFactsBySlug, today) {
  if (card.deadline_date && ISO.test(card.deadline_date)) return card.deadline_date;
  if (!card.exam_slug) return null;
  const list = examDeadlines(examFactsBySlug?.[card.exam_slug]);
  if (!list.length) return null;
  return list.find((d) => d >= today) || list[list.length - 1];
}

export function isValidHref(href) {
  return typeof href === 'string' && (href === '/' || /^\/[^/]/.test(href) || /^https:\/\/\S+$/.test(href));
}

/**
 * Returns a view model or null when the card must be hidden.
 * { badge, note, closed, deadline }
 */
export function cardState(card, examFactsBySlug, today) {
  if (!card || !card.is_active || !isValidHref(card.href)) return null;
  const deadline = resolveDeadline(card, examFactsBySlug, today);
  if (!deadline) return { badge: card.badge, note: '', closed: false, deadline: null };
  const left = daysBetween(today, deadline);
  if (left < 0) {
    const closedFor = Math.max(0, Number(card.closed_days) || 0);
    if (-left > closedFor) return null;
    return { badge: 'CLOSED', note: 'Closed', closed: true, deadline };
  }
  const note = left === 0 ? 'Last day' : left === 1 ? '1 day left' : `${left} days left`;
  const badge = left <= CLOSING_SOON_DAYS && card.badge !== 'COMING SOON' ? 'CLOSING SOON' : card.badge;
  return { badge, note, closed: false, deadline };
}

/** Sorted visible cards for one placement. */
export function visibleCards(cards, placement, examFactsBySlug, today, enabled = true) {
  if (!enabled || !Array.isArray(cards)) return [];
  return cards
    .filter((c) => c && (c.placements === 'both' || c.placements === placement))
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((c) => ({ card: c, state: cardState(c, examFactsBySlug, today) }))
    .filter((x) => x.state);
}

export function whatsappAlertUrl(base, source) {
  const u = new URL(base || WHATSAPP_FALLBACK);
  u.searchParams.set('utm_source', source);
  u.searchParams.set('utm_medium', 'featured_card');
  return u.toString();
}
