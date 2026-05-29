/**
 * Shared, stable ordering logic for opportunities (jobs, scholarships, tenders).
 *
 * Ordering priority:
 *   1. Featured items (metadata.featured === true) — future-ready, optional
 *   2. Active items (deadline today or in the future, or no deadline)
 *        a. nearest application deadline first
 *        b. dated deadlines before "no deadline" items
 *        c. then newest created_at
 *   3. Expired items last (most recently expired first, then newest created_at)
 *
 * Timezone-safe: deadlines are date-only strings, so we compare against
 * "today" computed in the Pakistan timezone (Asia/Karachi, UTC+5).
 */

const PK_TZ = "Asia/Karachi";

/** Minimal shape required for sorting; works for external_opportunities rows. */
export interface SortableOpportunity {
  deadline_date?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Returns YYYY-MM-DD for "today" in Pakistan time. */
export function getPakistanToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Normalize a deadline value to a YYYY-MM-DD string, or null if absent/invalid. */
function normalizeDeadline(value?: string | null): string | null {
  if (!value) return null;
  // Already a date-only string
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** True when an opportunity's deadline has passed (in Pakistan time). */
export function isExpired(opp: SortableOpportunity, today = getPakistanToday()): boolean {
  const dl = normalizeDeadline(opp.deadline_date);
  if (!dl) return false; // no deadline => treated as active/evergreen
  return dl < today;
}

function isFeatured(opp: SortableOpportunity): boolean {
  return opp.metadata?.featured === true;
}

/**
 * Stable sort: returns a new array ordered by the global priority rules.
 */
export function sortOpportunities<T extends SortableOpportunity>(items: T[]): T[] {
  const today = getPakistanToday();

  // Decorate with original index for stable tie-breaking.
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const A = a.item;
      const B = b.item;

      // 1. Featured first
      const fa = isFeatured(A) ? 0 : 1;
      const fb = isFeatured(B) ? 0 : 1;
      if (fa !== fb) return fa - fb;

      // 2. Active before expired
      const ea = isExpired(A, today) ? 1 : 0;
      const eb = isExpired(B, today) ? 1 : 0;
      if (ea !== eb) return ea - eb;

      const dlA = normalizeDeadline(A.deadline_date);
      const dlB = normalizeDeadline(B.deadline_date);

      if (ea === 0) {
        // Both active: dated deadlines before no-deadline items
        if (dlA && dlB) {
          if (dlA !== dlB) return dlA < dlB ? -1 : 1; // nearest first
        } else if (dlA && !dlB) {
          return -1;
        } else if (!dlA && dlB) {
          return 1;
        }
      } else {
        // Both expired: most recently expired first
        if (dlA && dlB && dlA !== dlB) return dlA < dlB ? 1 : -1;
      }

      // 3. Newest created_at
      const ca = A.created_at ? new Date(A.created_at).getTime() : 0;
      const cb = B.created_at ? new Date(B.created_at).getTime() : 0;
      if (ca !== cb) return cb - ca;

      // Stable fallback
      return a.index - b.index;
    })
    .map((d) => d.item);
}

/** Convenience: partition into active and expired buckets (each already sorted). */
export function partitionOpportunities<T extends SortableOpportunity>(items: T[]) {
  const today = getPakistanToday();
  const sorted = sortOpportunities(items);
  return {
    active: sorted.filter((o) => !isExpired(o, today)),
    expired: sorted.filter((o) => isExpired(o, today)),
  };
}
