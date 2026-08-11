import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';
import { ExamQuickTestCTA } from '@/components/quick-test/ExamQuickTestCTA';
import { SeoSectionGrid } from '@/components/quick-test/SeoSectionGrid';

const EXAM_NAME = 'ECAT';
const RETURN_PATH = '/ecat-preparation';

const sections = [
  { title: 'Mathematics (40%)', accent: 'text-purple-700', subject: 'Mathematics', topics: ['Algebra', 'Calculus', 'Trigonometry', 'Coordinate Geometry', 'Statistics', 'Matrices', 'Sequences', 'Permutations'] },
  { title: 'Physics (30%)', accent: 'text-blue-700', subject: 'Physics', topics: ['Mechanics', 'Thermodynamics', 'Waves', 'Optics', 'Electricity', 'Magnetism', 'Modern Physics', 'Nuclear Physics'] },
  { title: 'Chemistry (20%)', accent: 'text-green-700', subject: 'Chemistry', topics: ['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Industrial Chemistry', 'Environmental Chemistry', 'Biochemistry'] },
  { title: 'English (10%)', accent: 'text-orange-700', subject: 'English', topics: ['Grammar', 'Vocabulary', 'Comprehension', 'Sentence Structure'] },
];

const ALL_SUBJECTS = sections.map((s) => s.subject);

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
        { name: 'ECAT Preparation', url: 'https://mcqsai.com/ecat-preparation' },
      ]}
      faqs={[
        { question: 'What is the ECAT pattern?', answer: 'ECAT is roughly 40% Math, 30% Physics, 20% Chemistry and 10% English.' },
        { question: 'Is ECAT preparation free here?', answer: 'Yes, all ECAT MCQs are free on MCQsAI.' },
        { question: 'Are MCQs subject-wise?', answer: 'Yes, MCQs are organized by subject and topic.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">ECAT Preparation 2026 — Free MCQ Practice</h1>
      <p className="text-muted-foreground mb-6">Engineering College Admission Test (ECAT) preparation for UET, NED, NUST and all Pakistani engineering universities.</p>

      <div className="mb-10 flex flex-wrap gap-3">
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} returnPath={RETURN_PATH} />
        <Link to="/custom-syllabus" className="inline-flex items-center px-4 py-2 rounded-md border text-sm hover:bg-muted">Build a custom syllabus</Link>
      </div>

      {sections.map((s) => (
        <SeoSectionGrid key={s.title} {...s} examName={EXAM_NAME} returnPath={RETURN_PATH} />
      ))}

      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start ECAT Practice Free</h2>
        <p className="opacity-90 mb-4">AI-powered ECAT MCQs for UET, NED, NUST. No signup needed.</p>
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} variant="hero" label="Practice ECAT MCQs →" returnPath={RETURN_PATH} />
      </div>

      <div className="mt-8 p-6 bg-muted/40 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'MDCAT Preparation', url: '/exams/mdcat' },
            { label: 'MDCAT Past Papers', url: '/mdcat-past-papers' },
            { label: 'FSc Pre-Engineering', url: '/exams/fsc-pre-engineering' },
            { label: 'NTS NAT', url: '/exams/nts-nat' },
            { label: 'ECAT Aggregate Calculator', url: '/tools/aggregate-calculator' },
            { label: 'Mathematics MCQs', url: '/subjects' },

          ].map((link) => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-background border rounded-full text-sm hover:bg-primary/5 text-primary">
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
