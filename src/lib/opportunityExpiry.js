/**
 * Single source of truth for when a job/scholarship listing stops being
 * indexable. Used by OpportunityDetail (browser), scripts/inject-meta.mjs
 * (prerendered HTML) and scripts/generate-sitemaps.mjs (jobs/scholarships.xml).
 *
 * Rule (Pakistan time):
 *  - With a deadline: expired when deadline + 30 days < today.
 *  - Without a deadline: expired when created_at + 90 days < today.
 * Listings are never deleted — the page stays reachable, just noindex,follow.
 */
export const EXPIRED_GRACE_DAYS = 30;
export const NO_DEADLINE_MAX_AGE_DAYS = 90;

export function pakistanToday(now = new Date()) {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
}

function addDays(dateStr, days) {
  const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** created_at is a UTC timestamp; convert to its Pakistan calendar date first. */
function pkDate(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return pakistanToday(d);
}

export function isListingExpired({ deadline, created_at } = {}, today = pakistanToday()) {
  if (deadline) {
    const until = addDays(deadline, EXPIRED_GRACE_DAYS);
    if (until) return until < today;
  }
  if (created_at) {
    const base = pkDate(created_at);
    const until = base && addDays(base, NO_DEADLINE_MAX_AGE_DAYS);
    if (until) return until < today;
  }
  return false;
}
