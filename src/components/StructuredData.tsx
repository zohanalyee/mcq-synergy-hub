import { Helmet } from 'react-helmet-async';

interface ExamPageSchemaProps {
  name: string;
  description: string;
  url: string;
  provider?: string;
  breadcrumbs: { name: string; url: string }[];
  faqs?: { question: string; answer: string }[];
}

export const ExamPageSchema: React.FC<ExamPageSchemaProps> = ({
  name,
  description,
  url,
  provider = 'MCQsAI',
  breadcrumbs,
  faqs = [],
}) => {
  const schemas: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name,
      description,
      url,
      provider: {
        '@type': 'Organization',
        name: provider,
        url: 'https://mcqsai.com',
      },
      isAccessibleForFree: true,
      inLanguage: 'en-PK',
      audience: {
        '@type': 'EducationalAudience',
        educationalRole: 'student',
        geographicArea: 'Pakistan',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    },
  ];

  if (faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  return (
    <Helmet>
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

const ORIGIN = 'https://mcqsai.com';
const ORG_ID = `${ORIGIN}/#organization`;
const SITE_ID = `${ORIGIN}/#website`;

const StructuredData = () => {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': ORG_ID,
    name: 'MCQsAI',
    alternateName: ['MCQs AI', 'MCQSAI'],
    url: ORIGIN,
    logo: {
      '@type': 'ImageObject',
      url: `${ORIGIN}/logo.png`,
      width: 512,
      height: 512,
    },
    image: `${ORIGIN}/og-image.png`,
    description:
      'AI-powered MCQ practice platform for MDCAT, ECAT, CSS, PPSC, NTS exam preparation in Pakistan',
    foundingDate: '2024',
    foundingLocation: { '@type': 'Place', name: 'Karachi, Pakistan' },
    areaServed: { '@type': 'Country', name: 'Pakistan' },
    knowsLanguage: ['en', 'ur', 'sd'],
    address: { '@type': 'PostalAddress', addressLocality: 'Karachi', addressRegion: 'Sindh', addressCountry: 'PK' },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'hello@mcqsai.com',
      contactType: 'Customer Service',
      availableLanguage: ['English', 'Urdu', 'Sindhi'],
    },
    publishingPrinciples: `${ORIGIN}/editorial-policy`,
    sameAs: [
      'https://www.facebook.com/mcqsai',
      'https://www.instagram.com/mcqsai',
      'https://twitter.com/mcqsai',
      'https://www.linkedin.com/company/mcqsai',
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: 'MCQsAI',
    url: ORIGIN,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-PK',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${ORIGIN}/subjects?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How many MCQs are available on MCQsAI?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'MCQsAI offers 6000+ high-quality MCQs covering Biology, Chemistry, Physics, English, Mathematics, and other subjects for MDCAT, ECAT, CSS, PPSC, and NTS exams.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is MCQsAI free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, MCQsAI is completely free to use. You can practice unlimited MCQs, take quizzes, and use the AI personal coach without any charges.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does MCQsAI support Urdu language?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, MCQsAI fully supports Urdu and Sindhi languages in addition to English. You can switch languages anytime from the header menu.',
        },
      },
    ],
  };


  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
    </Helmet>
  );
};

export default StructuredData;
