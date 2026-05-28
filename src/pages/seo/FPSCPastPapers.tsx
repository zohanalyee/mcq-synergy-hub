import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';
import { ExamQuickTestCTA } from '@/components/quick-test/ExamQuickTestCTA';
import { SeoSectionGrid } from '@/components/quick-test/SeoSectionGrid';

const EXAM_NAME = 'FPSC';
const RETURN_PATH = '/fpsc-past-papers';

const sections = [
  { title: 'General Knowledge & Current Affairs', accent: 'text-purple-700', subject: 'General Knowledge', topics: ['Pakistan Affairs', 'World Affairs', 'Science', 'Technology', 'Sports', 'Current Events'] },
  { title: 'English Language', accent: 'text-blue-700', subject: 'English', topics: ['Grammar', 'Vocabulary', 'Comprehension', 'Essay Writing', 'Precis', 'Translation'] },
  { title: 'Pakistan Studies & Islamiat', accent: 'text-green-700', subject: 'Pakistan Studies', topics: ['Pakistan History', 'Quran', 'Hadith', 'Islamic History', 'Constitution', 'Ideology'] },
  { title: 'Quantitative Reasoning', accent: 'text-orange-700', subject: 'Quantitative Reasoning', topics: ['Arithmetic', 'Algebra', 'Statistics', 'Data Interpretation', 'Logical Reasoning', 'Analytical'] },
];

const ALL_SUBJECTS = sections.map((s) => s.subject);

const FPSCPastPapers = () => (
  <>
    <SEOHead
      title="FPSC Past Papers MCQs | Federal PSC Test Prep | MCQsAI Pakistan"
      description="FPSC past papers MCQs online free. Federal Public Service Commission previous papers for CSS, Inspectors, Assistants. General Knowledge, English, Pakistan Studies."
      keywords="FPSC past papers, FPSC MCQs, Federal Public Service Commission papers, FPSC test preparation, FPSC past papers with answers"
    />
    <ExamPageSchema
      name="FPSC Past Papers Practice"
      description="Free FPSC past papers practice MCQs — General Knowledge, English, Pakistan Studies, Islamiat, Quantitative Reasoning."
      url="https://mcqsai.com/fpsc-past-papers"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: 'FPSC Past Papers', url: 'https://mcqsai.com/fpsc-past-papers' },
      ]}
      faqs={[
        { question: 'What does FPSC test cover?', answer: 'FPSC tests typically cover GK, English, Pakistan Studies, Islamiat and quantitative reasoning.' },
        { question: 'Is FPSC past paper practice free?', answer: 'Yes, completely free on MCQsAI.' },
        { question: 'Are explanations included?', answer: 'Yes, every MCQ includes a detailed explanation.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">FPSC Past Papers — Free MCQ Practice</h1>
      <p className="text-muted-foreground mb-6">Federal Public Service Commission past papers for all posts. Practice with AI-powered MCQs.</p>

      <div className="mb-10 flex flex-wrap gap-3">
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} returnPath={RETURN_PATH} />
        <Link to="/custom-syllabus" className="inline-flex items-center px-4 py-2 rounded-md border text-sm hover:bg-muted">Build a custom syllabus</Link>
      </div>

      {sections.map((s) => (
        <SeoSectionGrid key={s.title} {...s} examName={EXAM_NAME} returnPath={RETURN_PATH} />
      ))}

      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Practice FPSC MCQs Free</h2>
        <p className="opacity-90 mb-4">Federal PSC preparation with AI-powered MCQs. No signup needed.</p>
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} variant="hero" label="Start Practice →" returnPath={RETURN_PATH} />
      </div>

      <div className="mt-8 p-6 bg-muted/40 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'PPSC Past Papers', url: '/ppsc-past-papers' },
            { label: 'CSS MCQs Practice', url: '/css-mcqs-practice' },
            { label: 'NTS Test Prep', url: '/exams/nts' },
            { label: 'General Knowledge', url: '/exams/fpsc' },
            { label: 'PMS Preparation', url: '/exams/pms' },
          ].map((link) => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-background border rounded-full text-sm hover:bg-primary/5 text-primary">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <RelatedContent entitySlug="fpsc-past-papers" title="Continue Preparing" />
    </div>
  </>
);

export default FPSCPastPapers;
