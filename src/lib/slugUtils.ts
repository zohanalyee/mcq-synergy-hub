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
