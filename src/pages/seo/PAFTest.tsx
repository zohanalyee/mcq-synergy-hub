import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';
import { ExamQuickTestCTA } from '@/components/quick-test/ExamQuickTestCTA';
import { SeoSectionGrid } from '@/components/quick-test/SeoSectionGrid';

const EXAM_NAME = 'PAF Test';
const RETURN_PATH = '/paf-test';

const sections = [
  { title: 'Intelligence & IQ', accent: 'text-blue-700', subject: 'Intelligence & IQ', topics: ['Verbal Intelligence', 'Non-Verbal IQ', 'Spatial Reasoning', 'Pattern Recognition', 'Analytical Reasoning', 'Mathematical Reasoning', 'Memory Test', 'Logical Sequence'] },
  { title: 'Mathematics', accent: 'text-purple-700', subject: 'Mathematics', topics: ['Algebra', 'Trigonometry', 'Calculus', 'Statistics', 'Geometry', 'Arithmetic', 'Matrices', 'Probability'] },
  { title: 'Physics', accent: 'text-green-700', subject: 'Physics', topics: ['Mechanics', 'Thermodynamics', 'Waves', 'Optics', 'Electricity', 'Magnetism', 'Modern Physics', 'Nuclear Physics'] },
  { title: 'English & GK', accent: 'text-orange-700', subject: 'English & GK', topics: ['Grammar', 'Vocabulary', 'Comprehension', 'Current Affairs', 'Pakistan Studies', 'Islamic Studies'] },
];

const ALL_SUBJECTS = sections.map((s) => s.subject);

const programs = [
  { name: 'GD Pilot', detail: 'FSc Pre-Engineering — Intelligence + Physics' },
  { name: 'Aeronautical Engineer', detail: 'Engineering degree — Technical test' },
  { name: 'Education Branch', detail: 'BA/BSc — English + GK' },
  { name: 'Administration', detail: 'Graduate — General aptitude' },
  { name: 'Airman/Airwoman', detail: 'Matric/FSc — Intelligence + GK' },
  { name: 'Medical Officer', detail: 'MBBS — Medical test' },
];

const related = [
  { label: 'Pak Army Test', url: '/pak-army-test' },
  { label: 'ASF Test', url: '/asf-test' },
  { label: 'Navy Test', url: '/forces-jobs-tests' },
  { label: 'ECAT Preparation', url: '/ecat-preparation' },
  { label: 'Physics MCQs', url: '/subjects' },
  { label: 'Intelligence Test MCQs', url: '/subjects' },
];

const PAFTest = () => (
  <>
    <SEOHead
      title="PAF Test Preparation 2026 | Free MCQs Pakistan | MCQsAI"
      description="Free Pakistan Air Force (PAF) recruitment test preparation for GD Pilot, Aeronautical Engineer, Airman. Intelligence, Maths, Physics, English MCQs."
      keywords="PAF test preparation, Pakistan Air Force test, GD Pilot test, Airman test, PAF intelligence test"
    />
    <ExamPageSchema
      name="PAF Test Preparation"
      description="Free Pakistan Air Force test MCQ practice — Intelligence, Maths, Physics and English for all PAF entry programs."
      url="https://mcqsai.com/paf-test"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: 'PAF Test', url: 'https://mcqsai.com/paf-test' },
      ]}
      faqs={[
        { question: 'What subjects come in the PAF test?', answer: 'Intelligence (verbal/non-verbal), Mathematics, Physics and English are the standard sections; GD Pilot also includes spatial reasoning.' },
        { question: 'Who can apply for PAF GD Pilot?', answer: 'FSc Pre-Engineering candidates within the age limit can apply through PAF registration portal.' },
        { question: 'How to prepare for PAF intelligence test online?', answer: 'Practice verbal and non-verbal IQ MCQs free on MCQsAI with instant explanations.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">PAF Test Preparation 2026 — Free MCQs Pakistan</h1>
      <p className="text-muted-foreground mb-2">Pakistan Air Force recruitment test preparation — all branches and programs.</p>
      <p className="text-xs text-muted-foreground mb-6">480+ students search for this every month — low competition.</p>

      <div className="mb-10 flex flex-wrap gap-3">
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} returnPath={RETURN_PATH} />
        <Link to="/custom-syllabus" className="inline-flex items-center px-4 py-2 rounded-md border text-sm hover:bg-muted">Build a custom syllabus</Link>
      </div>

      {sections.map((s) => (
        <SeoSectionGrid key={s.title} {...s} examName={EXAM_NAME} returnPath={RETURN_PATH} />
      ))}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">PAF Entry Programs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {programs.map((p) => (
            <div key={p.name} className="p-4 border rounded-lg">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-muted-foreground">{p.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start PAF Test Prep Free</h2>
        <p className="opacity-90 mb-4">AI MCQs for Intelligence, Maths, Physics, English. No signup needed.</p>
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
      <RelatedContent entitySlug="paf-test" title="Continue Preparing" />
    </div>
  </>
);

export default PAFTest;
