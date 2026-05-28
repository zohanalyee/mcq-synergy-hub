import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';
import { ExamQuickTestCTA } from '@/components/quick-test/ExamQuickTestCTA';
import { SeoSectionGrid } from '@/components/quick-test/SeoSectionGrid';

const EXAM_NAME = 'CSS';
const RETURN_PATH = '/css-mcqs-practice';

const sections = [
  { title: 'Compulsory Subjects', accent: 'text-purple-700', subject: 'Compulsory Subjects', topics: ['English Essay', 'English Precis', 'General Science', 'Current Affairs', 'Pakistan Affairs', 'Islamic Studies', 'Every Day Science', 'Urdu'] },
  { title: 'Optional — Social Sciences', accent: 'text-blue-700', subject: 'Social Sciences', topics: ['Political Science', 'International Relations', 'Sociology', 'History', 'Economics', 'Public Administration'] },
  { title: 'Optional — Sciences', accent: 'text-green-700', subject: 'Sciences', topics: ['Computer Science', 'Physics', 'Chemistry', 'Mathematics', 'Statistics', 'Environmental Science'] },
];

const ALL_SUBJECTS = sections.map((s) => s.subject);

const CSSMCQs = () => (
  <>
    <SEOHead
      title="CSS MCQs Practice Online Free | CSS Exam Preparation | MCQsAI"
      description="Free CSS exam MCQs online. Central Superior Services preparation — General Knowledge, Current Affairs, English, Pakistan Affairs, Islamic Studies MCQs."
      keywords="CSS MCQs, CSS exam preparation, CSS past papers MCQs, Central Superior Services MCQs, CSS test Pakistan"
    />
    <ExamPageSchema
      name="CSS MCQs Practice — Compulsory & Optional"
      description="Free CSS MCQs practice covering compulsory subjects (English, Pakistan Affairs, Islamic Studies, Current Affairs) and optional groups."
      url="https://mcqsai.com/css-mcqs-practice"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: 'CSS MCQs Practice', url: 'https://mcqsai.com/css-mcqs-practice' },
      ]}
      faqs={[
        { question: 'Are CSS MCQs free on MCQsAI?', answer: 'Yes, all CSS MCQs are 100% free.' },
        { question: 'What subjects are covered?', answer: 'Compulsory subjects plus Social Sciences and Science optional groups.' },
        { question: 'Do MCQs include explanations?', answer: 'Yes, with verified answers and detailed explanations.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">CSS MCQs Practice — Free Online</h1>
      <p className="text-muted-foreground mb-6">Central Superior Services (CSS) exam preparation with comprehensive MCQs. All compulsory and optional subjects covered.</p>

      <div className="mb-10 flex flex-wrap gap-3">
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} returnPath={RETURN_PATH} />
        <Link to="/custom-syllabus" className="inline-flex items-center px-4 py-2 rounded-md border text-sm hover:bg-muted">Build a custom syllabus</Link>
      </div>

      {sections.map((s) => (
        <SeoSectionGrid key={s.title} {...s} examName={EXAM_NAME} returnPath={RETURN_PATH} />
      ))}

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start CSS Preparation Free</h2>
        <p className="opacity-90 mb-4">AI-powered CSS MCQs. Thousands of questions. No signup needed.</p>
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} variant="hero" label="Practice CSS MCQs →" returnPath={RETURN_PATH} />
      </div>

      <div className="mt-8 p-6 bg-muted/40 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'FPSC Past Papers', url: '/fpsc-past-papers' },
            { label: 'PMS Preparation', url: '/exams/pms' },
            { label: 'Current Affairs MCQs', url: '/exams/css' },
            { label: 'Pakistan Affairs', url: '/exams/fpsc' },
            { label: 'General Knowledge', url: '/exams/nts' },
          ].map((link) => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-background border rounded-full text-sm hover:bg-primary/5 text-primary">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <RelatedContent entitySlug="css-mcqs-practice" title="Continue Preparing" />
    </div>
  </>
);

export default CSSMCQs;
