import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';
import { ExamQuickTestCTA } from '@/components/quick-test/ExamQuickTestCTA';
import { SeoSectionGrid } from '@/components/quick-test/SeoSectionGrid';

const EXAM_NAME = 'PPSC';
const RETURN_PATH = '/ppsc-past-papers';

const sections = [
  { title: 'General Knowledge MCQs', accent: 'text-purple-700', subject: 'General Knowledge', topics: ['Pakistan History', 'Geography', 'Current Affairs', 'Islamic Studies', 'World GK', 'Science & Tech'] },
  { title: 'English MCQs', accent: 'text-blue-700', subject: 'English', topics: ['Grammar', 'Vocabulary', 'Sentence Correction', 'Comprehension', 'Synonyms', 'Antonyms'] },
  { title: 'Pakistan Studies MCQs', accent: 'text-green-700', subject: 'Pakistan Studies', topics: ['Pakistan History', 'Constitution', 'Geography', 'Economy', 'Foreign Policy', 'Current Affairs'] },
  { title: 'Mathematics MCQs', accent: 'text-orange-700', subject: 'Mathematics', topics: ['Basic Arithmetic', 'Algebra', 'Geometry', 'Percentage', 'Ratio', 'Profit & Loss'] },
];

const ALL_SUBJECTS = sections.map((s) => s.subject);

const PPSCPastPapers = () => (
  <>
    <SEOHead
      title="PPSC Past Papers MCQs | Free Online Practice | MCQsAI Pakistan"
      description="Solve PPSC past papers MCQs online free. Punjab Public Service Commission previous year papers with answers for all posts. General Knowledge, English, Pakistan Studies."
      keywords="PPSC past papers, PPSC MCQs, PPSC test preparation, Punjab Public Service Commission papers, PPSC past papers with answers"
    />
    <ExamPageSchema
      name="PPSC Past Papers Practice"
      description="Free PPSC past papers practice with MCQs from previous years — General Knowledge, English, Current Affairs and subject papers."
      url="https://mcqsai.com/ppsc-past-papers"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: 'PPSC Past Papers', url: 'https://mcqsai.com/ppsc-past-papers' },
      ]}
      faqs={[
        { question: 'Are PPSC past papers free?', answer: 'Yes, PPSC past paper MCQ practice on MCQsAI is fully free.' },
        { question: 'Which posts are covered?', answer: 'Coverage includes Lecturer, Inspector, ASI, Naib Tehsildar and other common PPSC posts.' },
        { question: 'Are answers verified?', answer: 'Yes, answers are reviewed and explanations are added.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">PPSC Past Papers — Free MCQ Practice</h1>
      <p className="text-muted-foreground mb-6">Punjab Public Service Commission past papers with answers. Practice for all PPSC posts.</p>

      <div className="mb-10 flex flex-wrap gap-3">
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} returnPath={RETURN_PATH} />
        <Link to="/custom-syllabus" className="inline-flex items-center px-4 py-2 rounded-md border text-sm hover:bg-muted">Build a custom syllabus</Link>
      </div>

      {sections.map((s) => (
        <SeoSectionGrid key={s.title} {...s} examName={EXAM_NAME} returnPath={RETURN_PATH} />
      ))}

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Practice PPSC MCQs Free</h2>
        <p className="opacity-90 mb-4">AI-powered PPSC preparation. 1000+ MCQs. No signup needed.</p>
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} variant="hero" label="Start Practice →" returnPath={RETURN_PATH} />
      </div>

      <div className="mt-8 p-6 bg-muted/40 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'FPSC Past Papers', url: '/fpsc-past-papers' },
            { label: 'NTS MCQs', url: '/exams/nts' },
            { label: 'CSS MCQs', url: '/css-mcqs-practice' },
            { label: 'SPSC Past Papers', url: '/exams/spsc' },
            { label: 'General Knowledge MCQs', url: '/exams/ppsc' },
          ].map((link) => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-background border rounded-full text-sm hover:bg-primary/5 text-primary">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <RelatedContent entitySlug="ppsc-past-papers" title="Continue Preparing" />
    </div>
  </>
);

export default PPSCPastPapers;
