/**
 * Email / link sanitization for user- & AI-generated markdown.
 *
 * Problem: AI/scraped content sometimes emits explicit markdown links whose
 * URL is a bare email address with no scheme, e.g. `[hr@x.edu.pk](hr@x.edu.pk)`.
 * react-markdown keeps that href as a *relative* path, so the browser/Googlebot
 * resolves it against the current route → `/blog/hr@x.edu.pk`, `/opportunity/...`
 * which 404 and pollute Google Search Console.
 *
 * These helpers guarantee an email can never become an internal site route:
 *  - `mailtoForEmailHref` fixes a single href at render time.
 *  - `sanitizeEmailLinks` rewrites markdown before rendering.
 */

// Reasonably strict single-email matcher (no surrounding text).
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** True when `value` is exactly an email address. */
export function isEmail(value: string | null | undefined): boolean {
  if (!value) return false;
  return EMAIL_RE.test(value.trim());
}

/**
 * Normalize an anchor href so an email never becomes a relative site route.
 * - `mailto:` / `http(s):` / `tel:` / `#` / absolute → returned unchanged.
 * - bare email (`hr@x.com`) → `mailto:hr@x.com`.
 * - relative href that contains `@` and looks like an email → `mailto:`.
 */
export function mailtoForEmailHref(href: string | null | undefined): string {
  if (!href) return '#';
  const trimmed = href.trim();
  if (/^(mailto:|tel:|https?:\/\/|\/|#|data:)/i.test(trimmed)) return trimmed;
  // Strip an accidental "mailto:" duplication guarded above; here no scheme.
  if (isEmail(trimmed)) return `mailto:${trimmed}`;
  return trimmed;
}

/** True if an href is unsafe to treat as an internal link (bare email). */
export function isBareEmailHref(href: string | null | undefined): boolean {
  if (!href) return false;
  const trimmed = href.trim();
  if (/^(mailto:|tel:|https?:\/\/|\/|#|data:)/i.test(trimmed)) return false;
  return isEmail(trimmed);
}

/**
 * Rewrite markdown so explicit email links carry a `mailto:` scheme.
 * Targets `[label](email)` and `[label](email "title")` where the URL is a
 * bare email. Leaves real URLs and already-mailto links untouched.
 */
export function sanitizeEmailLinks(markdown: string | null | undefined): string {
  if (!markdown) return markdown ?? '';
  return markdown.replace(
    /(\]\()\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*((?:"[^"]*")?\))/g,
    (_m, open: string, email: string, rest: string) => `${open}mailto:${email}${rest}`,
  );
}
