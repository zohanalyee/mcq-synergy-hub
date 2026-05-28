import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';
import { ExamQuickTestCTA } from '@/components/quick-test/ExamQuickTestCTA';
import { SeoSectionGrid } from '@/components/quick-test/SeoSectionGrid';

const EXAM_NAME = 'Punjab University Entry Test';
const RETURN_PATH = '/punjab-university-entry-test';

const sections = [
  { title: 'English', accent: 'text-purple-700', subject: 'English', topics: ['Grammar', 'Vocabulary', 'Comprehension', 'Sentence Correction', 'Synonyms', 'Antonyms'] },
  { title: 'General Knowledge', accent: 'text-blue-700', subject: 'General Knowledge', topics: ['Pakistan Affairs', 'Current Affairs', 'Islamic Studies', 'World GK', 'Science', 'History'] },
  { title: 'Science & Mathematics', accent: 'text-green-700', subject: 'Science & Mathematics', topics: ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'Computer Science', 'Statistics'] },
  { title: 'Social Sciences', accent: 'text-orange-700', subject: 'Social Sciences', topics: ['Economics', 'Political Science', 'Sociology', 'Psychology', 'History', 'Geography'] },
];

const ALL_SUBJECTS = sections.map((s) => s.subject);

const PunjabUniversityEntryTest = () => (
  <>
    <SEOHead
      title="Punjab University Entry Test 2026 | Free MCQs | MCQsAI"
      description="Free Punjab University (PU) entry test preparation 2026. English, GK, Science, Social Sciences MCQs for all PU programs."
      keywords="Punjab University entry test, PU admission test, Punjab University MCQs, PU entry test 2026"
    />
    <ExamPageSchema
      name="Punjab University Entry Test Preparation"
      description="Free Punjab University (PU) entry test preparation MCQs for admission across faculties."
      url="https://mcqsai.com/punjab-university-entry-test"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: 'Punjab University Entry Test', url: 'https://mcqsai.com/punjab-university-entry-test' },
      ]}
      faqs={[
        { question: 'What subjects are in the PU entry test?', answer: 'Punjab University entry tests cover English, General Knowledge, Mathematics and subject-specific MCQs depending on the program.' },
        { question: 'Is the PU entry test free to practice online?', answer: 'Yes, MCQsAI offers fully free Punjab University entry test MCQ practice.' },
        { question: 'When is the Punjab University admission test held?', answer: 'PU admission tests are typically held between July and September each year.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Punjab University Entry Test 2026 — Free MCQ Practice</h1>
      <p className="text-muted-foreground mb-6">University of Punjab (PU) admission test preparation for all faculties and programs.</p>

      <div className="mb-10 flex flex-wrap gap-3">
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} returnPath={RETURN_PATH} />
        <Link to="/custom-syllabus" className="inline-flex items-center px-4 py-2 rounded-md border text-sm hover:bg-muted">Build a custom syllabus</Link>
      </div>

      {sections.map((s) => (
        <SeoSectionGrid key={s.title} {...s} examName={EXAM_NAME} returnPath={RETURN_PATH} />
      ))}

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start PU Test Preparation Free</h2>
        <p className="opacity-90 mb-4">AI MCQs for Punjab University admission. No signup needed.</p>
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} variant="hero" label="Practice Now →" returnPath={RETURN_PATH} />
      </div>

      <div className="mt-8 p-6 bg-muted/40 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'NUST Entry Test', url: '/nust-entry-test' },
            { label: 'COMSATS Entry Test', url: '/comsats-entry-test' },
            { label: 'NTS NAT Test', url: '/exams/nts-nat' },
            { label: 'English MCQs', url: '/subjects' },
            { label: 'General Knowledge', url: '/exams/nts' },
          ].map((link) => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-background border rounded-full text-sm hover:bg-primary/5 text-primary">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <RelatedContent entitySlug="punjab-university-entry-test" title="Continue Preparing" />
    </div>
  </>
);

export default PunjabUniversityEntryTest;
