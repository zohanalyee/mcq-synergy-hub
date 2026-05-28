import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';
import { ExamQuickTestCTA } from '@/components/quick-test/ExamQuickTestCTA';
import { SeoSectionGrid } from '@/components/quick-test/SeoSectionGrid';

const EXAM_NAME = 'Engineering Universities Entry Test';
const RETURN_PATH = '/engineering-universities-entry-test';

const universities = [
  { name: 'GIKI', detail: 'Math, Physics, Chemistry, English' },
  { name: 'LUMS', detail: 'SAT-style — Math, English, Reasoning' },
  { name: 'FAST NUCES', detail: 'Math, Physics, English, IQ' },
  { name: 'Bahria University', detail: 'Math, Physics, Chemistry, English' },
  { name: 'Aga Khan University', detail: 'Science, English, Reasoning' },
  { name: 'Air University', detail: 'Math, Physics, English' },
  { name: 'Islamia University', detail: 'Subject + General Knowledge' },
  { name: 'Hamdard University', detail: 'Biology, Chemistry, Physics' },
];

const sections = [
  { title: 'Mathematics', accent: 'text-purple-700', subject: 'Mathematics', topics: ['Calculus', 'Algebra', 'Trigonometry', 'Coordinate Geometry', 'Statistics', 'Probability'] },
  { title: 'Physics', accent: 'text-blue-700', subject: 'Physics', topics: ['Mechanics', 'Waves', 'Electricity', 'Magnetism', 'Thermodynamics', 'Modern Physics'] },
  { title: 'Chemistry', accent: 'text-green-700', subject: 'Chemistry', topics: ['Organic', 'Inorganic', 'Physical', 'Analytical', 'Industrial', 'Environmental'] },
  { title: 'English & Reasoning', accent: 'text-orange-700', subject: 'English & Reasoning', topics: ['Vocabulary', 'Grammar', 'Comprehension', 'Analytical', 'Logical Reasoning', 'IQ'] },
];

const ALL_SUBJECTS = sections.map((s) => s.subject);

const EngineeringUniversitiesEntryTest = () => (
  <>
    <SEOHead
      title="Engineering Universities Entry Test 2026 | GIKI, LUMS, FAST | MCQsAI"
      description="Free entry test preparation for GIKI, LUMS, FAST NUCES, Bahria, Aga Khan, Air University and top engineering universities."
      keywords="GIKI entry test, LUMS entry test, FAST NUCES, Bahria University, engineering university test Pakistan"
    />
    <ExamPageSchema
      name="Engineering Universities Entry Test 2026"
      description="Free entry test preparation for GIKI, LUMS, FAST NUCES, Bahria, Aga Khan, Air University and top engineering universities of Pakistan."
      url="https://mcqsai.com/engineering-universities-entry-test"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: 'Engineering Universities Entry Test', url: 'https://mcqsai.com/engineering-universities-entry-test' },
      ]}
      faqs={[
        { question: 'Which engineering universities are covered?', answer: 'GIKI, LUMS, FAST NUCES, Bahria, Aga Khan, Air University, Islamia University and Hamdard University.' },
        { question: 'What subjects are tested?', answer: 'Mathematics, Physics, Chemistry, English and analytical reasoning.' },
        { question: 'Are these MCQs free?', answer: 'Yes, all engineering university entry test MCQs on MCQsAI are completely free.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Engineering Universities Entry Test 2026 | Pakistan MCQ Practice</h1>
      <p className="text-muted-foreground mb-6">Preparation for GIKI, LUMS, FAST NUCES, Bahria University, Aga Khan, and other top engineering universities.</p>

      <div className="mb-10 flex flex-wrap gap-3">
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} returnPath={RETURN_PATH} />
        <Link to="/custom-syllabus" className="inline-flex items-center px-4 py-2 rounded-md border text-sm hover:bg-muted">Build a custom syllabus</Link>
      </div>

      <section className="mb-8 p-6 bg-blue-50 rounded-xl">
        <h2 className="text-lg font-semibold mb-4">Universities Covered</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {universities.map((uni) => (
            <div key={uni.name} className="p-3 bg-white border rounded-lg">
              <p className="font-medium text-sm">{uni.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{uni.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {sections.map((s) => (
        <SeoSectionGrid key={s.title} {...s} examName={EXAM_NAME} returnPath={RETURN_PATH} />
      ))}

      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start Engineering Test Prep Free</h2>
        <p className="opacity-90 mb-4">AI MCQs for all engineering universities. No signup needed.</p>
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} variant="hero" label="Practice Now →" returnPath={RETURN_PATH} />
      </div>

      <div className="mt-8 p-6 bg-muted/40 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'NUST Entry Test', url: '/nust-entry-test' },
            { label: 'ECAT Preparation', url: '/ecat-preparation' },
            { label: 'COMSATS Entry Test', url: '/comsats-entry-test' },
            { label: 'Punjab University Test', url: '/punjab-university-entry-test' },
            { label: 'FSc Pre-Engineering', url: '/exams/fsc-pre-engineering' },
          ].map((link) => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-background border rounded-full text-sm hover:bg-primary/5 text-primary">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <RelatedContent entitySlug="engineering-universities-entry-test" title="Continue Preparing" />
    </div>
  </>
);

export default EngineeringUniversitiesEntryTest;
