import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';
import { ExamQuickTestCTA } from '@/components/quick-test/ExamQuickTestCTA';
import { SeoSectionGrid } from '@/components/quick-test/SeoSectionGrid';

const EXAM_NAME = 'COMSATS Entry Test';
const RETURN_PATH = '/comsats-entry-test';

const sections = [
  { title: 'Mathematics', accent: 'text-purple-700', subject: 'Mathematics', topics: ['Algebra', 'Calculus', 'Trigonometry', 'Statistics', 'Matrices', 'Probability'] },
  { title: 'Physics', accent: 'text-blue-700', subject: 'Physics', topics: ['Mechanics', 'Electricity', 'Waves', 'Thermodynamics', 'Modern Physics', 'Optics'] },
  { title: 'Computer Science', accent: 'text-green-700', subject: 'Computer Science', topics: ['Programming Basics', 'Data Structures', 'Algorithms', 'Database', 'Networking', 'OOP'] },
  { title: 'English', accent: 'text-orange-700', subject: 'English', topics: ['Grammar', 'Vocabulary', 'Comprehension', 'Analytical Reasoning'] },
];

const ALL_SUBJECTS = sections.map((s) => s.subject);

const COMSATSEntryTest = () => (
  <>
    <SEOHead
      title="COMSATS Entry Test 2026 | Free Preparation | MCQsAI"
      description="Free COMSATS University Islamabad (CUI) entry test preparation. Math, Physics, CS, English MCQs."
      keywords="COMSATS entry test, CUI admission, COMSATS MCQs, COMSATS preparation 2026"
    />
    <ExamPageSchema
      name="COMSATS Entry Test (NTS NAT) Preparation"
      description="Free COMSATS University Islamabad (CUI) entry test preparation. Math, Physics, CS, English MCQs."
      url="https://mcqsai.com/comsats-entry-test"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: 'COMSATS Entry Test', url: 'https://mcqsai.com/comsats-entry-test' },
      ]}
      faqs={[
        { question: 'What is the COMSATS entry test format?', answer: 'COMSATS uses NTS NAT-style MCQs covering Math, Physics, English and analytical reasoning.' },
        { question: 'Is COMSATS entry test difficult?', answer: 'It is moderate difficulty; consistent MCQ practice on MCQsAI helps clear the merit comfortably.' },
        { question: 'How many MCQs in the COMSATS test?', answer: 'NTS NAT for COMSATS usually has 90 MCQs to be solved in 120 minutes.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">COMSATS Entry Test 2026 — Free Preparation</h1>
      <p className="text-muted-foreground mb-6">COMSATS University Islamabad (CUI) admission test preparation for Engineering, CS, and Science programs.</p>

      <div className="mb-10 flex flex-wrap gap-3">
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} returnPath={RETURN_PATH} />
        <Link to="/custom-syllabus" className="inline-flex items-center px-4 py-2 rounded-md border text-sm hover:bg-muted">Build a custom syllabus</Link>
      </div>

      {sections.map((s) => (
        <SeoSectionGrid key={s.title} {...s} examName={EXAM_NAME} returnPath={RETURN_PATH} />
      ))}

      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start COMSATS Preparation Free</h2>
        <p className="opacity-90 mb-4">AI MCQs for CUI admission test. No signup needed.</p>
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} variant="hero" label="Practice Now →" returnPath={RETURN_PATH} />
      </div>

      <div className="mt-8 p-6 bg-muted/40 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'NUST Entry Test', url: '/nust-entry-test' },
            { label: 'ECAT Preparation', url: '/ecat-preparation' },
            { label: 'FAST NUCES Test', url: '/engineering-universities-entry-test' },
            { label: 'Physics MCQs', url: '/subjects' },
            { label: 'Mathematics MCQs', url: '/subjects' },
          ].map((link) => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-background border rounded-full text-sm hover:bg-primary/5 text-primary">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <RelatedContent entitySlug="comsats-entry-test" title="Continue Preparing" />
    </div>
  </>
);

export default COMSATSEntryTest;
