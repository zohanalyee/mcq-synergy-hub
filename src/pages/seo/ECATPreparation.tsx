import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';

const sections = [
  {
    subject: 'Mathematics (40%)',
    headingClass: 'text-purple-700',
    cardHover: 'hover:bg-purple-50',
    linkClass: 'text-purple-600',
    topics: ['Algebra', 'Calculus', 'Trigonometry', 'Coordinate Geometry', 'Statistics', 'Matrices', 'Sequences', 'Permutations']
  },
  {
    subject: 'Physics (30%)',
    headingClass: 'text-blue-700',
    cardHover: 'hover:bg-blue-50',
    linkClass: 'text-blue-600',
    topics: ['Mechanics', 'Thermodynamics', 'Waves', 'Optics', 'Electricity', 'Magnetism', 'Modern Physics', 'Nuclear Physics']
  },
  {
    subject: 'Chemistry (20%)',
    headingClass: 'text-green-700',
    cardHover: 'hover:bg-green-50',
    linkClass: 'text-green-600',
    topics: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Industrial Chemistry', 'Environmental Chemistry', 'Biochemistry']
  },
  {
    subject: 'English (10%)',
    headingClass: 'text-orange-700',
    cardHover: 'hover:bg-orange-50',
    linkClass: 'text-orange-600',
    topics: ['Grammar', 'Vocabulary', 'Comprehension', 'Sentence Structure']
  },
];

const ECATPreparation = () => (
  <>
    <SEOHead
      title="ECAT Preparation 2026 | Free MCQ Practice | MCQsAI Pakistan"
      description="Free ECAT preparation MCQs. Engineering College Admission Test — Mathematics, Physics, Chemistry, English. UET, NED, NUST entry test practice."
      keywords="ECAT preparation, ECAT MCQs, ECAT 2026 Pakistan, engineering entry test, UET entry test, NUST entry test MCQs"
    />
    <ExamPageSchema
      name="ECAT Preparation — Free Online Practice"
      description="Free ECAT preparation MCQs — Mathematics 40%, Physics 30%, Chemistry 20%, English 10%."
      url="https://mcqsai.com/ecat-preparation"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: "ECAT Preparation", url: "https://mcqsai.com/ecat-preparation" },
      ]}
      faqs={[
        { question: "What is the ECAT pattern?", answer: "ECAT is roughly 40% Math, 30% Physics, 20% Chemistry and 10% English." },
        { question: "Is ECAT preparation free here?", answer: "Yes, all ECAT MCQs are free on MCQsAI." },
        { question: "Are MCQs subject-wise?", answer: "Yes, MCQs are organized by subject and topic." },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">
        ECAT Preparation 2026 — Free MCQ Practice
      </h1>
      <p className="text-muted-foreground mb-8">
        Engineering College Admission Test (ECAT) preparation for UET, NED, NUST and all Pakistani engineering universities.
      </p>

      {sections.map(section => (
        <section key={section.subject} className="mb-8">
          <h2 className={`text-xl font-semibold mb-3 ${section.headingClass}`}>
            {section.subject}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {section.topics.map(topic => (
              <Link key={topic} to="/exams/ecat"
                className={`p-3 border rounded-lg ${section.cardHover} text-center`}>
                <p className="text-sm font-medium">{topic}</p>
                <p className={`text-xs ${section.linkClass} mt-1`}>Practice →</p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start ECAT Practice Free</h2>
        <p className="opacity-90 mb-4">AI-powered ECAT MCQs for UET, NED, NUST. No signup needed.</p>
        <Link to="/exams/ecat"
          className="bg-white text-blue-700 px-8 py-3 rounded-full font-semibold inline-block">
          Practice ECAT MCQs →
        </Link>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'MDCAT Preparation', url: '/exams/mdcat' },
            { label: 'MDCAT Past Papers', url: '/mdcat-past-papers' },
            { label: 'FSc Pre-Engineering', url: '/exams/fsc-pre-engineering' },
            { label: 'NTS NAT', url: '/exams/nts-nat' },
            { label: 'Mathematics MCQs', url: '/subjects' },
          ].map(link => (
            <Link key={link.url} to={link.url}
              className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-blue-50 text-blue-700">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <RelatedContent entitySlug="ecat-preparation" title="Continue Preparing" />
    </div>
  </>
);

export default ECATPreparation;
