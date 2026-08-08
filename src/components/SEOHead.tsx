import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DEFAULT_OG_IMAGE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  absoluteUrl,
  assertOgImage,
  ogImageForPath,
} from '@/lib/seoUrls';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  /** Absolute HTTPS apex URL. When omitted, a category banner is auto-selected. */
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

const SEOHead = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  noindex = false,
}: SEOHeadProps) => {
  const { language } = useLanguage();
  const { pathname } = useLocation();

  const defaultTitle = 'MCQsAI – AI-Powered Exam Prep';
  const defaultDescription =
    'Prepare for MDCAT, ECAT, CSS, PPSC, NTS with 6000+ MCQs. AI-powered study coach, Urdu support, and personalized learning.';
  const defaultKeywords =
    'MDCAT MCQs, ECAT preparation, CSS test, PPSC MCQs, NTS practice, Pakistan exam preparation, اردو میں MCQs, MCQSAI';

  // Pages sometimes already end with a brand suffix ("… | MCQSAI"/"… | MCQsAI").
  // Strip it before appending so we never emit "MCQSAI | MCQsAI".
  const brandStripped = title
    ? title.replace(/\s*[|\-–—]\s*MCQ?s?AI\s*$/i, '').trim()
    : '';
  const finalTitle = brandStripped ? `${brandStripped} | MCQsAI` : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalKeywords = keywords || defaultKeywords;

  // OG image fallback hierarchy: explicit prop → category banner → global default.
  // Always an absolute HTTPS apex URL so WhatsApp/FB/X/LinkedIn/Discord can fetch
  // it without following a redirect (www.* 302-redirects to apex).
  const finalImage = image
    ? absoluteUrl(image)
    : ogImageForPath(pathname) || DEFAULT_OG_IMAGE;
  assertOgImage(finalImage, `SEOHead @ ${pathname}`);

  // Canonical + og:url are emitted globally by <GlobalCanonical /> in App.tsx.
  // This component intentionally does NOT render a canonical tag to avoid
  // multiple conflicting canonicals on the same page.
  const finalLocale = language === 'ur' ? 'ur_PK' : language === 'sd' ? 'sd_PK' : 'en_US';

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />

      {/* Open Graph (og:url is emitted by GlobalCanonical) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:image:secure_url" content={finalImage} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
      <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
      <meta property="og:image:alt" content={finalTitle} />
      <meta property="og:locale" content={finalLocale} />
      <meta property="og:site_name" content="MCQsAI" />

      {/* Twitter (twitter:url is emitted by GlobalCanonical) */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      <meta name="twitter:image:alt" content={finalTitle} />

      <meta name="author" content="MCQsAI" />
    </Helmet>
  );
};

export default SEOHead;
