/**
 * SEO-friendly slug + UUID URL helpers.
 * Pattern: /opportunity/<slug>-<uuid>
 * The UUID is always the last 36 chars, so old UUID-only links keep working.
 */

export function generateSlug(title: string): string {
  return (title || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

export function generateSlugUrl(title: string, id: string): string {
  const slug = generateSlug(title);
  return slug ? `${slug}-${id}` : id;
}

const GUEST_SESSION_RE = /guest-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function extractIdFromSlug(slugId: string): string {
  if (!slugId) return '';
  const guestMatch = slugId.match(GUEST_SESSION_RE);
  if (guestMatch) return guestMatch[0];
  const match = slugId.match(UUID_RE);
  return match ? match[0] : slugId;
}
