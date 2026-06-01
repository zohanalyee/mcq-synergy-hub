// Shared content sanitization for scraped / AI-generated markdown (Deno).
// Mirrors src/lib/markdownSanitize.ts — keep both in sync.

const EMAIL = '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}';

/**
 * Rewrite markdown so explicit email links carry a `mailto:` scheme:
 * `[label](hr@x.edu.pk)` → `[label](mailto:hr@x.edu.pk)`.
 * Prevents emails from being resolved as relative internal routes
 * (e.g. /blog/hr@x.edu.pk, /opportunity/hr@x.edu.pk) which 404.
 */
export function sanitizeEmailLinks(markdown: string | null | undefined): string {
  if (!markdown) return markdown ?? '';
  const re = new RegExp(`(\\]\\()\\s*(${EMAIL})\\s*((?:\\"[^\\"]*\\")?\\))`, 'g');
  return markdown.replace(re, (_m, open, email, rest) => `${open}mailto:${email}${rest}`);
}

const FULL_EMAIL = new RegExp(`^${EMAIL}$`);

/** True when value is exactly an email address. */
export function isEmail(value: string | null | undefined): boolean {
  return !!value && FULL_EMAIL.test(value.trim());
}

/** Convert a bare-email apply URL to a mailto: link; pass through real URLs. */
export function mailtoForApplyUrl(url: string | null | undefined): string | null {
  if (!url) return url ?? null;
  const trimmed = url.trim();
  if (/^(mailto:|https?:\/\/)/i.test(trimmed)) return trimmed;
  if (isEmail(trimmed)) return `mailto:${trimmed}`;
  return trimmed;
}
