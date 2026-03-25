import { Helmet } from 'react-helmet-async';

const StructuredData = () => {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'MCQsAI',
    alternateName: 'MCQs AI',
    url: 'https://mcqsai.com',
    logo: 'https://mcqsai.com/logo.png',
    description:
      'AI-powered MCQ practice platform for MDCAT, ECAT, CSS, PPSC, NTS exam preparation in Pakistan',
    address: { '@type': 'PostalAddress', addressCountry: 'PK' },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'hello@mcqsai.com',
      contactType: 'Customer Service',
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MCQsAI',
    url: 'https://mcqsai.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://mcqsai.com/subjects?q={search_term_string}',
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
