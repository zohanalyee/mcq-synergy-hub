/**
 * SEO-friendly slug + UUID URL helpers.
 * Pattern: /opportunity/<slug>-<uuid>
 * The UUID is always the last 36 chars, so old UUID-only links keep working.
 */

/**
 * Detects values that are contact info (an email address or a bare domain/URL)
 * rather than a real human-readable title. Job ads often carry an "Apply via"
 * field (e.g. "hr@psg.edu.pk", "www.ppsc.gop.pk") and we must NEVER let that
 * leak into a page slug.
 */
export function isContactInfoTitle(value: string): boolean {
  const v = (value || '').trim().toLowerCase();
  if (!v) return false;
  // Email address anywhere in the value
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(v)) return true;
  // Starts with a protocol or www.
  if (/^(https?:\/\/|www\.)/.test(v)) return true;
  // Looks like a bare domain (no spaces, contains a dot + TLD-ish ending)
  if (!/\s/.test(v) && /\.[a-z]{2,}(\.[a-z]{2,})?(\/.*)?$/.test(v)) return true;
  return false;
}

import { toSlug } from '@/lib/slugUtils';

export function generateSlug(title: string): string {
  // Reject contact-info values outright so they never become a slug.
  if (isContactInfoTitle(title)) return '';

  // Reuse the canonical slug primitive, then apply opportunity-specific
  // 60-char cap and bare-domain safety net.
  const slug = toSlug(title || '').slice(0, 60).replace(/-+$/g, '');

  if (!slug || /^(www|hr|info|contact|admin)[a-z]*(pk|com|org|net|edu|gov)+$/.test(slug)) {
    return '';
  }
  return slug;
}

export function generateSlugUrl(title: string, id: string): string {
  const slug = generateSlug(title);
  // Fall back to a generic, content-free slug rather than ever exposing
  // contact info or an empty/garbage slug.
  return slug ? `${slug}-${id}` : `job-opportunity-${id}`;
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
