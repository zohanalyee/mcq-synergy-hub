import { safeJsonLd } from '@/lib/jsonLd';
/**
 * Phase 2D — EEAT Schema Emitters
 * Reusable JSON-LD components. All entity references use the apex domain
 * https://mcqsai.com to stay consistent with og:url/canonical (Phase 2A).
 */
import { Helmet } from 'react-helmet-async';

const ORIGIN = 'https://mcqsai.com';
const ORG_ID = `${ORIGIN}/#organization`;
const SITE_ID = `${ORIGIN}/#website`;
const PUBLISHER_LOGO = `${ORIGIN}/logo.png`;

const Json = ({ data }: { data: Record<string, unknown> }) => (
  <Helmet>
    <script type="application/ld+json">{JSON.stringify(data)}</script>
  </Helmet>
);

/* ----------------------------- Quiz ----------------------------- */
interface QuizSchemaProps {
  name: string;
  description: string;
  url: string;
  numQuestions?: number;
  educationalLevel?: string;
  about?: string;
  inLanguage?: string;
}
export const QuizSchema = ({
  name, description, url, numQuestions, educationalLevel, about, inLanguage = 'en-PK',
}: QuizSchemaProps) => (
  <Json data={{
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name,
    description,
    url,
    inLanguage,
    educationalLevel,
    about: about ? { '@type': 'Thing', name: about } : undefined,
    numberOfQuestions: numQuestions,
    isAccessibleForFree: true,
    learningResourceType: 'Multiple Choice Quiz',
    provider: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
  }} />
);

/* ---------------------------- Article --------------------------- */
interface ArticleSchemaProps {
  headline: string;
  description?: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  keywords?: string[];
  articleSection?: string;
}
export const ArticleSchema = ({
  headline, description, url, image, datePublished, dateModified,
  authorName = 'MCQsAI Editorial Team', keywords, articleSection,
}: ArticleSchemaProps) => (
  <Json data={{
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: image || `${ORIGIN}/og-image.png`,
    datePublished,
    dateModified: dateModified || datePublished,
    author: { '@type': 'Person', name: authorName, url: `${ORIGIN}/about` },
    publisher: { '@id': ORG_ID },
    articleSection,
    keywords: keywords?.join(', '),
    inLanguage: 'en-PK',
  }} />
);

/* ---------------------------- Person ---------------------------- */
interface PersonSchemaProps {
  name: string;
  url?: string;
  jobTitle?: string;
  worksFor?: string;
  sameAs?: string[];
  image?: string;
}
export const PersonSchema = ({
  name, url, jobTitle, worksFor = 'MCQsAI', sameAs, image,
}: PersonSchemaProps) => (
  <Json data={{
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url,
    image,
    jobTitle,
    worksFor: { '@type': 'EducationalOrganization', name: worksFor, '@id': ORG_ID },
    sameAs,
  }} />
);

/* ---------------------- Aggregate Review ----------------------- */
interface AggregateReviewSchemaProps {
  itemName: string;
  url: string;
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
}
export const AggregateReviewSchema = ({
  itemName, url, ratingValue, reviewCount, bestRating = 5,
}: AggregateReviewSchemaProps) => (
  <Json data={{
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: itemName,
    url,
    brand: { '@id': ORG_ID },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue,
      reviewCount,
      bestRating,
      worstRating: 1,
    },
  }} />
);

/* -------- Individual Reviews (rendered up to 10 best) ---------- */
interface IndividualReview {
  author: string;
  rating: number;
  body?: string;
  datePublished?: string;
}
interface ReviewListSchemaProps {
  itemName: string;
  reviews: IndividualReview[];
}
export const ReviewListSchema = ({ itemName, reviews }: ReviewListSchemaProps) => (
  <Helmet>
    {reviews.slice(0, 10).map((r, i) => (
      <script key={i} type="application/ld+json">{JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Review',
        itemReviewed: { '@type': 'Product', name: itemName, brand: { '@id': ORG_ID } },
        reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
        author: { '@type': 'Person', name: r.author },
        reviewBody: r.body || undefined,
        datePublished: r.datePublished,
      })}</script>
    ))}
  </Helmet>
);

export { ORIGIN, ORG_ID, SITE_ID, PUBLISHER_LOGO };
