import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';
import { ExamQuickTestCTA } from '@/components/quick-test/ExamQuickTestCTA';
import { SeoSectionGrid } from '@/components/quick-test/SeoSectionGrid';

const EXAM_NAME = 'Forces & Jobs Tests';
const RETURN_PATH = '/forces-jobs-tests';

const forces = [
  { name: 'Pakistan Navy', detail: 'Intelligence + Maths + Physics + English', monthly: '320/mo' },
  { name: 'Rangers (Punjab/Sindh)', detail: 'Intelligence + GK + English + Physical', monthly: '70/mo' },
  { name: 'FIA', detail: 'GK + Current Affairs + Computer + English', monthly: '30/mo' },
  { name: 'Police (Provincial)', detail: 'GK + Pakistan Studies + English + IQ', monthly: '10/mo' },
  { name: 'WAPDA', detail: 'Technical + GK + English + Maths', monthly: '50/mo' },
  { name: 'PIA', detail: 'English + GK + Technical + IQ', monthly: '30/mo' },
  { name: 'ANF', detail: 'Intelligence + GK + English + Physical', monthly: '' },
  { name: 'NAB', detail: 'Law + GK + English + Current Affairs', monthly: '' },
];

const sections = [
  { title: 'Intelligence Test (All Forces)', accent: 'text-purple-700', subject: 'Intelligence', topics: ['Verbal IQ', 'Non-Verbal IQ', 'Logical Reasoning', 'Pattern Recognition', 'Analytical Reasoning', 'Mathematical IQ'] },
  { title: 'General Knowledge', accent: 'text-blue-700', subject: 'General Knowledge', topics: ['Pakistan Studies', 'Current Affairs', 'Islamic Studies', 'World Affairs', 'Geography', 'Science'] },
  { title: 'English', accent: 'text-green-700', subject: 'English', topics: ['Grammar', 'Vocabulary', 'Comprehension', 'Sentence Correction', 'Fill in Blanks', 'Synonyms'] },
  { title: 'Mathematics', accent: 'text-orange-700', subject: 'Mathematics', topics: ['Arithmetic', 'Percentage', 'Ratio', 'Algebra', 'Statistics', 'Geometry'] },
];

const ALL_SUBJECTS = sections.map((s) => s.subject);

const related = [
  { label: 'Pak Army Test', url: '/pak-army-test' },
  { label: 'PAF Test', url: '/paf-test' },
  { label: 'ASF Test', url: '/asf-test' },
  { label: 'FPSC Past Papers', url: '/fpsc-past-papers' },
  { label: 'PPSC Past Papers', url: '/ppsc-past-papers' },
  { label: 'General Knowledge MCQs', url: '/exams/nts' },
];

const ForcesJobsTests = () => (
  <>
    <SEOHead
      title="Pakistan Forces & Government Jobs Tests 2026 | Free MCQs | MCQsAI"
      description="Free preparation for Pakistan Navy, Rangers, FIA, Police, WAPDA, PIA, ANF and NAB recruitment tests. Intelligence, GK, English and Maths MCQs."
      keywords="Pakistan Navy test, Rangers test, FIA test preparation, Police Pakistan test, WAPDA test, PIA test"
    />
    <ExamPageSchema
      name="Pakistan Forces & Government Jobs Tests"
      description="Free MCQ practice for Navy, Rangers, FIA, Police, WAPDA, PIA and other Pakistan government forces recruitment tests."
      url="https://mcqsai.com/forces-jobs-tests"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: 'Forces & Jobs Tests', url: 'https://mcqsai.com/forces-jobs-tests' },
      ]}
      faqs={[
        { question: 'Which forces tests does this cover?', answer: 'Pakistan Navy, Rangers, FIA, Police, WAPDA, PIA, ANF and NAB recruitment tests.' },
        { question: 'What is the common syllabus for forces tests?', answer: 'Intelligence, General Knowledge, English and Mathematics are common across most Pakistan forces and government jobs tests.' },
        { question: 'How can I prepare for forces tests online free?', answer: 'Practice subject-wise MCQs on MCQsAI free with instant feedback and explanations.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Pakistan Forces & Government Jobs Tests 2026</h1>
      <p className="text-muted-foreground mb-6">Complete preparation for Navy, Rangers, FIA, Police, WAPDA, PIA and all government forces recruitment tests.</p>

      <div className="mb-10 flex flex-wrap gap-3">
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} returnPath={RETURN_PATH} />
        <Link to="/custom-syllabus" className="inline-flex items-center px-4 py-2 rounded-md border text-sm hover:bg-muted">Build a custom syllabus</Link>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Forces & Jobs Covered</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {forces.map((f) => (
            <div key={f.name} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{f.name}</p>
                {f.monthly && <span className="text-xs text-muted-foreground">{f.monthly}</span>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{f.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {sections.map((s) => (
        <SeoSectionGrid key={s.title} {...s} examName={EXAM_NAME} returnPath={RETURN_PATH} />
      ))}

      <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start Forces Test Prep Free</h2>
        <p className="opacity-90 mb-4">AI MCQs for all Pakistan forces recruitment tests. No signup needed.</p>
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
      <RelatedContent entitySlug="forces-jobs-tests" title="Continue Preparing" />
    </div>
  </>
);

export default ForcesJobsTests;
