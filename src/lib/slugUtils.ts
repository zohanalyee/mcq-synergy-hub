/**
 * Convert a display name to a URL-friendly slug
 * "Sindh Board" → "sindh-board"
 */
export const toSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

/**
 * Convert a slug back to a display-friendly name (title case)
 * "sindh-board" → "Sindh Board"
 */
export const fromSlug = (slug: string): string => {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Find the best matching item from a list by comparing slug representations.
 * Converts each item's name to a slug and compares against the target slug.
 * Falls back to word-overlap scoring for fuzzy matches.
 */
export const findBestMatch = <T extends { name: string }>(
  items: T[],
  targetSlug: string
): T | null => {
  if (!items.length) return null;

  // 1. Exact slug match
  const exact = items.find(item => toSlug(item.name) === targetSlug);
  if (exact) return exact;

  // 2. Word overlap scoring
  const slugWords = targetSlug.split('-').filter(w => w.length > 1);
  let bestScore = 0;
  let bestItem: T | null = null;

  for (const item of items) {
    const nameWords = item.name.toLowerCase().split(/\s+/);
    let score = 0;
    for (const sw of slugWords) {
      for (const nw of nameWords) {
        if (nw === sw) { score += 2; break; }
        if (nw.includes(sw) || sw.includes(nw)) { score += 1; break; }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  // Require at least some match
  return bestScore >= 2 ? bestItem : null;
};

export const normalizeClassNumber = (value: string): string => {
  const trimmed = value.toLowerCase().trim();
  const digits = trimmed.match(/\d+/)?.[0];

  if (digits) return digits;

  return trimmed
    .replace(/^class[-\s]*/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export const findMatchingLevel = <T extends { name: string }>(
  items: T[],
  targetClass: string
): T | null => {
  if (!items.length) return null;

  const normalizedTarget = normalizeClassNumber(targetClass);
  if (!normalizedTarget) return null;

  const exact = items.find((item) => normalizeClassNumber(item.name) === normalizedTarget);
  if (exact) return exact;

  return (
    findBestMatch(items, targetClass) ||
    findBestMatch(items, `class-${normalizedTarget}`) ||
    findBestMatch(items, normalizedTarget)
  );
};
