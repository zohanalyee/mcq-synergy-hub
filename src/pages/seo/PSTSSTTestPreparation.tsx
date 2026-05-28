import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';
import { ExamQuickTestCTA } from '@/components/quick-test/ExamQuickTestCTA';
import { SeoSectionGrid } from '@/components/quick-test/SeoSectionGrid';

const EXAM_NAME = 'PST & SST Test';
const RETURN_PATH = '/pst-sst-test-preparation';

const sections = [
  { title: 'Education & Pedagogy', accent: 'text-purple-700', subject: 'Education & Pedagogy', topics: ['Teaching Methods', 'Child Psychology', 'Classroom Management', 'Curriculum', 'Assessment', 'Special Education'] },
  { title: 'General Knowledge', accent: 'text-blue-700', subject: 'General Knowledge', topics: ['Pakistan Studies', 'Islamic Studies', 'Current Affairs', 'Science GK', 'World Affairs', 'Sports'] },
  { title: 'English', accent: 'text-green-700', subject: 'English', topics: ['Grammar', 'Vocabulary', 'Comprehension', 'Sentence Correction', 'Teaching English', 'Writing Skills'] },
  { title: 'Subject Knowledge (SST)', accent: 'text-orange-700', subject: 'Subject Knowledge', topics: ['Mathematics', 'Biology', 'Chemistry', 'Physics', 'Computer Science', 'Social Studies'] },
];

const ALL_SUBJECTS = sections.map((s) => s.subject);

const PSTSSTTestPreparation = () => (
  <>
    <SEOHead
      title="PST & SST Test Preparation 2026 | Free MCQs | MCQsAI"
      description="Free Primary School Teacher (PST) and Secondary School Teacher (SST) recruitment test preparation. Education, GK, English MCQs."
      keywords="PST test preparation, SST test preparation, teacher recruitment test, educators test Pakistan"
    />
    <ExamPageSchema
      name="PST & SST Teaching Test Preparation"
      description="Free PST and SST teaching test preparation MCQs — pedagogy, education, general knowledge and subject content."
      url="https://mcqsai.com/pst-sst-test-preparation"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: 'PST & SST Test Preparation', url: 'https://mcqsai.com/pst-sst-test-preparation' },
      ]}
      faqs={[
        { question: 'What is the PST test?', answer: 'Primary School Teacher (PST) test is a recruitment exam for primary school teaching posts.' },
        { question: 'What is the SST test?', answer: 'Secondary School Teacher (SST) test recruits teachers for secondary classes; it covers subject mastery plus pedagogy.' },
        { question: 'How can I prepare PST/SST online free?', answer: 'Use MCQsAI to practice subject-wise and pedagogy MCQs free with instant feedback.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">PST & SST Test Preparation 2026 — Free MCQs</h1>
      <p className="text-muted-foreground mb-6">Primary School Teacher (PST) and Secondary School Teacher (SST) recruitment test preparation. NTS-style MCQs.</p>

      <div className="mb-10 flex flex-wrap gap-3">
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} returnPath={RETURN_PATH} />
        <Link to="/custom-syllabus" className="inline-flex items-center px-4 py-2 rounded-md border text-sm hover:bg-muted">Build a custom syllabus</Link>
      </div>

      <section className="mb-8 p-6 bg-purple-50 rounded-xl">
        <h2 className="text-lg font-semibold mb-4">PST vs SST — Key Difference</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 bg-white border rounded-lg">
            <p className="font-semibold text-purple-700">PST (Primary)</p>
            <p className="text-sm text-muted-foreground mt-1">Class 1-5 teachers. Easy level. General subjects.</p>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <p className="font-semibold text-pink-700">SST (Secondary)</p>
            <p className="text-sm text-muted-foreground mt-1">Class 6-10 teachers. Medium level. Subject specialist.</p>
          </div>
        </div>
      </section>

      {sections.map((s) => (
        <SeoSectionGrid key={s.title} {...s} examName={EXAM_NAME} returnPath={RETURN_PATH} />
      ))}

      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start Teacher Test Prep Free</h2>
        <p className="opacity-90 mb-4">AI MCQs for PST & SST recruitment. No signup needed.</p>
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} variant="hero" label="Practice Now →" returnPath={RETURN_PATH} />
      </div>

      <div className="mt-8 p-6 bg-muted/40 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'NTS Test Preparation', url: '/exams/nts' },
            { label: 'PPSC Past Papers', url: '/ppsc-past-papers' },
            { label: 'Educators Test', url: '/exams/educators' },
            { label: 'General Knowledge MCQs', url: '/exams/nts' },
            { label: 'English Grammar MCQs', url: '/subjects' },
          ].map((link) => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-background border rounded-full text-sm hover:bg-primary/5 text-primary">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <RelatedContent entitySlug="pst-sst-test-preparation" title="Continue Preparing" />
    </div>
  </>
);

export default PSTSSTTestPreparation;
