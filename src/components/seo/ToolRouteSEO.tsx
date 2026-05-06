import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ALL_TOOLS } from '@/data/toolsData';

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

  const canonical = `https://www.mcqsai.com${tool.href}`;
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    description,
    url: canonical,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@type': 'Organization', name: 'MCQsAI', url: 'https://www.mcqsai.com' },
  };

  return (
    <Helmet prioritizeSeoTags>
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
      <meta property="og:site_name" content="MCQsAI" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
};

export default ToolRouteSEO;
