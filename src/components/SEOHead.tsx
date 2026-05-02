import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

const SEOHead = ({
  title,
  description,
  keywords,
  image = 'https://mcqsai.com/og-image.png',
  url,
  type = 'website',
  noindex = false,
}: SEOHeadProps) => {
  const { language } = useLanguage();

  const defaultTitle = 'MCQsAI – AI-Powered Exam Prep';
  const defaultDescription =
    'Prepare for MDCAT, ECAT, CSS, PPSC, NTS with 6000+ MCQs. AI-powered study coach, Urdu support, and personalized learning.';
  const defaultKeywords =
    'MDCAT MCQs, ECAT preparation, CSS test, PPSC MCQs, NTS practice, Pakistan exam preparation, اردو میں MCQs, MCQSAI';

  const finalTitle = title ? `${title} | MCQsAI` : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalKeywords = keywords || defaultKeywords;
  const rawPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  // Strip trailing slash (except root) so /tools and /tools/ don't both index.
  const pathname = rawPath.length > 1 && rawPath.endsWith('/') ? rawPath.slice(0, -1) : rawPath;

  // Canonical hardening: always force apex (non-www), https, drop ?lang= query.
  // Prevents GSC "Alternative page with proper canonical tag" + "Page with redirect"
  // errors caused by www. duplicates and ?lang=ur hreflang variants.
  const normalizeCanonical = (raw: string): string => {
    try {
      const u = new URL(raw, 'https://mcqsai.com');
      u.protocol = 'https:';
      u.hostname = u.hostname.replace(/^www\./i, '') || 'mcqsai.com';
      u.searchParams.delete('lang');
      // Strip trailing slash for non-root.
      let p = u.pathname;
      if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
      return `https://${u.hostname}${p}${u.search}`;
    } catch {
      return `https://mcqsai.com${pathname}`;
    }
  };
  const canonicalUrl = normalizeCanonical(url || `https://mcqsai.com${pathname}`);
  const finalLocale = language === 'ur' ? 'ur_PK' : language === 'sd' ? 'sd_PK' : 'en_US';

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content={finalLocale} />
      <meta property="og:site_name" content="MCQsAI" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={image} />

      {/* Hreflang — single x-default self-canonical until per-language URLs
          are actually distinct rendered pages. Emitting ?lang=ur variants
          previously caused GSC "Page with redirect" errors because the
          app strips the param on render. */}
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />

      <meta name="author" content="MCQsAI" />
    </Helmet>
  );
};

export default SEOHead;
