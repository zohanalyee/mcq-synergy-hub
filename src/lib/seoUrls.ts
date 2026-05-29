/**
 * seoUrls — single source of truth for absolute URLs + Open Graph images.
 *
 * WHY THIS EXISTS
 * ---------------
 * Social crawlers (WhatsApp, Facebook, X/Twitter, LinkedIn, Discord) do NOT
 * follow redirects on `og:image` and do NOT execute JavaScript. The live site
 * serves on the APEX `https://mcqsai.com` (HTTP 200); `https://www.mcqsai.com/*`
 * 302-REDIRECTS to apex. Therefore every absolute SEO URL we emit (canonical,
 * og:url, og:image, twitter:image) MUST use the apex origin so the crawler
 * fetches a 200 directly.
 *
 * CHECKLIST FOR NEW PAGES (so social previews keep working)
 * ---------------------------------------------------------
 *  1. Render <SEOHead title=... description=... /> (it emits the full OG +
 *     Twitter tag set automatically, including a fallback image).
 *  2. To use a category banner, pass `image={ogImageForPath(pathname)}` or an
 *     explicit absolute apex URL via the `image` prop.
 *  3. Never hardcode `www.mcqsai.com` in og:image / og:url — use SITE_ORIGIN.
 *  4. Never use a relative path for og:image — always absolute + HTTPS.
 *  5. og:url must equal the canonical (both come from apex automatically).
 *  6. Banner specs: 1200x630, < 5MB, jpg/png/webp. All files live in /public/og.
 *  7. If the route is anonymous + SEO-relevant, add it to PRERENDER_ROUTES in
 *     vite.config.ts so the tags are visible in raw page source (crawler-safe).
 */

/** Apex origin — served with HTTP 200, no redirect. Crawler-safe. */
export const SITE_ORIGIN = 'https://mcqsai.com';

/** Global default banner (ultimate fallback). */
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og/default-og.jpg`;

/** Standard OG image dimensions for all banners in /public/og. */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/**
 * Category banners. Keys are matched against the start of the pathname.
 * Order matters: more specific prefixes must come before generic ones.
 */
const CATEGORY_OG_IMAGES: Array<{ test: (p: string) => boolean; image: string }> = [
  { test: (p) => p.startsWith('/jobs'), image: `${SITE_ORIGIN}/og/jobs-og.jpg` },
  { test: (p) => p.startsWith('/scholarships'), image: `${SITE_ORIGIN}/og/scholarships-og.jpg` },
  { test: (p) => p.startsWith('/blog'), image: `${SITE_ORIGIN}/og/blog-og.jpg` },
  { test: (p) => p.startsWith('/tools'), image: `${SITE_ORIGIN}/og/tools-og.jpg` },
  // Exams + exam-style SEO landing pages
  {
    test: (p) =>
      p.startsWith('/exams') ||
      p.startsWith('/mdcat') ||
      p.startsWith('/ecat') ||
      p.startsWith('/css') ||
      p.includes('entry-test') ||
      p.includes('past-papers') ||
      p.includes('-test') ||
      p.startsWith('/forces-jobs-tests') ||
      p.startsWith('/pst-sst'),
    image: `${SITE_ORIGIN}/og/exams-og.jpg`,
  },
  // Boards + class MCQ pages
  {
    test: (p) =>
      p.startsWith('/boards') ||
      p.startsWith('/board') ||
      p.includes('class-mcqs') ||
      p.startsWith('/9th-class') ||
      p.startsWith('/board-mcqs'),
    image: `${SITE_ORIGIN}/og/boards-og.jpg`,
  },
];

/**
 * Build a clean absolute apex URL from a pathname.
 * - Strips the query string entirely (incl. ?lang=).
 * - Strips trailing slash (except root).
 * - Pass-through if an absolute http(s) URL is already provided.
 */
export function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return `${SITE_ORIGIN}/`;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  let p = pathOrUrl.split('?')[0].split('#')[0];
  if (!p.startsWith('/')) p = `/${p}`;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return `${SITE_ORIGIN}${p}`;
}

/**
 * Resolve the best OG image for a pathname using the fallback hierarchy:
 *   page-specific (passed-in) → category → global default.
 */
export function ogImageForPath(pathname?: string | null): string {
  const p = (pathname || '/').split('?')[0];
  const match = CATEGORY_OG_IMAGES.find((c) => c.test(p));
  return match ? match.image : DEFAULT_OG_IMAGE;
}

/**
 * Dev-only guard: warn if an og:image URL is missing, relative, or non-HTTPS.
 * No-op in production builds.
 */
export function assertOgImage(url?: string | null, context = ''): void {
  if (!import.meta.env || import.meta.env.PROD) return;
  const where = context ? ` (${context})` : '';
  if (!url) {
    // eslint-disable-next-line no-console
    console.warn(`[SEO] Missing og:image${where} — social previews will have no banner.`);
    return;
  }
  if (!/^https:\/\//i.test(url)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[SEO] og:image must be an absolute HTTPS URL${where}. Got: "${url}". ` +
        `Crawlers ignore relative/non-HTTPS images.`,
    );
  }
}
