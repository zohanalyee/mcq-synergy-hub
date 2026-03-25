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
  const finalUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://mcqsai.com');
  const finalLocale = language === 'ur' ? 'ur_PK' : language === 'sd' ? 'sd_PK' : 'en_US';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />
      <link rel="canonical" href={finalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content={finalLocale} />
      <meta property="og:site_name" content="MCQsAI" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={finalUrl} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={image} />

      {/* Hreflang */}
      <link rel="alternate" hrefLang="en" href={`https://mcqsai.com${pathname}`} />
      <link rel="alternate" hrefLang="ur" href={`https://mcqsai.com${pathname}?lang=ur`} />
      <link rel="alternate" hrefLang="sd" href={`https://mcqsai.com${pathname}?lang=sd`} />

      <meta name="author" content="MCQsAI" />
    </Helmet>
  );
};

export default SEOHead;
