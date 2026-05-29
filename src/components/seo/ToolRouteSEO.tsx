import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ALL_TOOLS } from '@/data/toolsData';
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH, ogImageForPath } from '@/lib/seoUrls';

/**
 * Global SEO injector for /tools/* routes.
 *
 * Why a global component (not per-page edits):
 *   - There are 65+ tool pages, none of which currently render <SEOHead>.
 *   - Editing each file risks layout regressions and creates a long tail
 *     of "did we add it everywhere" bugs.
 *   - This component sits at app root, watches the URL, and emits a
 *     unique <title>, <meta description>, <link rel="canonical"> and a
 *     WebApplication JSON-LD block for the matched tool — solving the
 *     "all tools share index.html metadata → Google treats as duplicates"
 *     issue reported in Google Search Console.
 *
 * Specificity: Helmet de-duplicates by tag name (title) / `name`+`property`
 * for meta, and `rel`+`href` for link. Because this component renders LATER
 * in the tree than the page-level <SEOHead>, its tags WIN on tool pages —
 * which is exactly what we want, since per-tool data is more specific.
 */
const ToolRouteSEO = () => {
  const { pathname } = useLocation();

  // Only act on /tools/<slug> — never /tools (index has its own SEOHead).
  if (!pathname.startsWith('/tools/')) return null;

  const tool = ALL_TOOLS.find((t) => t.href === pathname);
  if (!tool) return null;

  const canonical = `${SITE_ORIGIN}${tool.href}`;
  const title = `${tool.name} — Free Online Tool | MCQsAI`;
  const description =
    tool.seoDescription ||
    `${tool.description}. Free online ${tool.name.toLowerCase()} from MCQsAI — no signup, instant results.`;
  const keywords = [
    tool.name,
    `${tool.name.toLowerCase()} online`,
    `free ${tool.name.toLowerCase()}`,
    `${tool.category.toLowerCase()} tool`,
    'MCQsAI',
    'Pakistan student tools',
  ].join(', ');

  // Tools category banner (absolute HTTPS apex URL — crawler-safe).
  const ogImage = ogImageForPath('/tools');

  // NOTE: WebApplication / BreadcrumbList / FAQPage / HowTo JSON-LD is emitted
  // by <ToolWrapper> on every tool page. We intentionally do NOT re-emit it here
  // — duplicate structured data triggers Google Search Console warnings.
  return (
    <Helmet>
{/* prioritizeSeoTags removed — broken in react-helmet-async@2.0.4 (drops link+script). */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index,follow" />
      {/* Canonical is emitted globally by <GlobalCanonical />. */}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:secure_url" content={ogImage} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
      <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="MCQsAI" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default ToolRouteSEO;
