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
      title="Government Job Tests in Pakistan – Free MCQs & Practice | MCQsAI"
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

      <section className="mb-10 border-y border-border py-6">
        <h2 className="text-xl font-semibold mb-3">Government Job Tests in Pakistan</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Government recruitment tests in Pakistan vary by department and post, but many share a
          core paper of General Knowledge, Pakistan Studies, Current Affairs, English, basic
          Mathematics, Computer Science and analytical reasoning. Technical and uniformed posts
          may add subject knowledge, intelligence or physical screening, so candidates should
          always match their preparation to the official advertisement and syllabus.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: 'Federal recruitment tests', text: 'Prepare for FPSC, FIA, NAB and other federal vacancies with current affairs, English, Pakistan Affairs and post-specific MCQs.', to: '/fpsc-past-papers' },
            { title: 'Provincial recruitment tests', text: 'Build the shared GK and aptitude base used in PPSC, SPSC and provincial police recruitment papers.', to: '/ppsc-past-papers' },
            { title: 'Armed forces tests', text: 'Practise intelligence, English, Mathematics and science for Army, Navy, PAF, Rangers and related entry tests.', to: '/pak-army-test' },
            { title: 'Timed mock practice', text: 'Use full mock tests to improve pace, accuracy and question selection before test day.', to: '/mock-tests' },
          ].map((item) => (
            <div key={item.title} className="border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
              <Link to={item.to} className="mt-3 inline-flex text-sm font-medium text-primary hover:underline">
                View preparation resources
              </Link>
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
