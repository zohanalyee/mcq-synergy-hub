import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';
import { ExamQuickTestCTA } from '@/components/quick-test/ExamQuickTestCTA';
import { SeoSectionGrid } from '@/components/quick-test/SeoSectionGrid';

const EXAM_NAME = 'ASF Test';
const RETURN_PATH = '/asf-test';

const sections = [
  { title: 'Intelligence & IQ', accent: 'text-purple-700', subject: 'Intelligence & IQ', topics: ['Verbal Intelligence', 'Non-Verbal IQ', 'Logical Reasoning', 'Pattern Recognition', 'Analytical Reasoning', 'Mathematical IQ'] },
  { title: 'General Knowledge', accent: 'text-blue-700', subject: 'General Knowledge', topics: ['Pakistan Studies', 'Current Affairs', 'Islamic Studies', 'World Affairs', 'Science GK', 'Geography'] },
  { title: 'English', accent: 'text-green-700', subject: 'English', topics: ['Grammar', 'Vocabulary', 'Comprehension', 'Sentence Correction', 'Fill in Blanks', 'Synonyms'] },
  { title: 'Mathematics', accent: 'text-orange-700', subject: 'Mathematics', topics: ['Arithmetic', 'Percentage', 'Ratio', 'Algebra', 'Geometry', 'Statistics'] },
];

const ALL_SUBJECTS = sections.map((s) => s.subject);

const related = [
  { label: 'Pak Army Test', url: '/pak-army-test' },
  { label: 'PAF Test', url: '/paf-test' },
  { label: 'Forces Jobs Tests', url: '/forces-jobs-tests' },
  { label: 'FIA Test Prep', url: '/forces-jobs-tests' },
  { label: 'General Knowledge MCQs', url: '/exams/nts' },
];

const ASFTest = () => (
  <>
    <SEOHead
      title="ASF Test Preparation 2026 | Free MCQs Pakistan | MCQsAI"
      description="Free Airport Security Force (ASF) recruitment test preparation. Intelligence, GK, English and Maths MCQs for ASF ASI, Corporal and constable."
      keywords="ASF test preparation, Airport Security Force test, ASF MCQs, ASF ASI test"
    />
    <ExamPageSchema
      name="ASF Test Preparation"
      description="Free ASF recruitment test MCQ practice — Intelligence, GK, English and Maths."
      url="https://mcqsai.com/asf-test"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: 'ASF Test', url: 'https://mcqsai.com/asf-test' },
      ]}
      faqs={[
        { question: 'What is the ASF test pattern?', answer: 'Airport Security Force tests cover Intelligence, GK, English and Mathematics, followed by physical and interview.' },
        { question: 'What is the ASF eligibility?', answer: 'Matric to graduate level depending on the post (Corporal, ASI, etc.); age and physical standards apply.' },
        { question: 'How can I prepare for ASF test free?', answer: 'Practice subject-wise MCQs on MCQsAI with instant feedback — no signup needed.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">ASF Test Preparation 2026 — Free MCQs Pakistan</h1>
      <p className="text-muted-foreground mb-2">Airport Security Force recruitment test complete preparation guide.</p>
      <p className="text-xs text-muted-foreground mb-6">390+ students search for this every month.</p>

      <div className="mb-10 flex flex-wrap gap-3">
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} returnPath={RETURN_PATH} />
        <Link to="/custom-syllabus" className="inline-flex items-center px-4 py-2 rounded-md border text-sm hover:bg-muted">Build a custom syllabus</Link>
      </div>

      {sections.map((s) => (
        <SeoSectionGrid key={s.title} {...s} examName={EXAM_NAME} returnPath={RETURN_PATH} />
      ))}

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start ASF Test Prep Free</h2>
        <p className="opacity-90 mb-4">AI MCQs for Intelligence, GK, English, Maths. No signup needed.</p>
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} variant="hero" label="Practice Now →" returnPath={RETURN_PATH} />
      </div>

      <div className="mt-8 p-6 bg-muted/40 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {related.map((link) => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-background border rounded-full text-sm hover:bg-primary/5 text-primary">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <RelatedContent entitySlug="asf-test" title="Continue Preparing" />
    </div>
  </>
);

export default ASFTest;
