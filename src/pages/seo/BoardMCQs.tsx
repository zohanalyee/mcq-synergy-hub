import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';
import { ExamQuickTestCTA } from '@/components/quick-test/ExamQuickTestCTA';
import { SeoSectionGrid } from '@/components/quick-test/SeoSectionGrid';

const RETURN_PATH = '/board-mcqs';

const classes = [
  { title: 'Class 9 — Matric Part 1', accent: 'text-purple-700', examName: 'Class 9 Matric', subjects: ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'English', 'Urdu', 'Pakistan Studies', 'Computer Science'] },
  { title: 'Class 10 — Matric Part 2', accent: 'text-blue-700', examName: 'Class 10 Matric', subjects: ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'English', 'Urdu', 'Pakistan Studies', 'Computer Science'] },
  { title: 'Class 11 — FSc/FA Part 1', accent: 'text-green-700', examName: 'Class 11 FSc/FA', subjects: ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'English', 'Urdu', 'Pakistan Studies', 'Economics'] },
  { title: 'Class 12 — FSc/FA Part 2', accent: 'text-orange-700', examName: 'Class 12 FSc/FA', subjects: ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'English', 'Urdu', 'Pakistan Studies', 'Economics'] },
];

const HERO_EXAM = 'Board Exams (Class 9-12)';
const HERO_SUBJECTS = ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'English', 'Urdu', 'Pakistan Studies', 'Computer Science'];

const BoardMCQs = () => (
  <>
    <SEOHead
      title="Board Exam MCQs | Class 9-12 Pakistan | Free Practice | MCQsAI"
      description="Free board exam MCQs for Matric (9th-10th) and FSc/FA (11th-12th). All Pakistani boards — Sindh, Punjab, Federal, KPK covered."
      keywords="board mcqs Pakistan, matric MCQs, FSc MCQs, intermediate MCQs, 10th class MCQs, 11th 12th class MCQs"
    />
    <ExamPageSchema
      name="Board Exam MCQs — Class 9-12 Pakistan"
      description="Free board exam MCQs for Matric (9-10) and FSc/FA (11-12). All Pakistani boards — Sindh, Punjab, Federal, KPK."
      url="https://mcqsai.com/board-mcqs"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: 'Board MCQs', url: 'https://mcqsai.com/board-mcqs' },
      ]}
      faqs={[
        { question: 'Which classes are covered?', answer: '9th, 10th, 11th and 12th class for all major Pakistani boards.' },
        { question: 'Are board MCQs free?', answer: 'Yes, every board MCQ on MCQsAI is free to practice.' },
        { question: 'Are answer explanations provided?', answer: 'Yes, every question includes a detailed answer explanation.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Board Exam MCQs — Class 9 to 12 Pakistan</h1>
      <p className="text-muted-foreground mb-6">Complete MCQ practice for Matric (9th-10th) and FSc/FA (11th-12th). All Pakistani boards covered.</p>

      <div className="mb-10 flex flex-wrap gap-3">
        <ExamQuickTestCTA examName={HERO_EXAM} subjects={HERO_SUBJECTS} returnPath={RETURN_PATH} />
        <Link to="/custom-syllabus" className="inline-flex items-center px-4 py-2 rounded-md border text-sm hover:bg-muted">Build a custom syllabus</Link>
      </div>

      {classes.map((c) => (
        <SeoSectionGrid
          key={c.title}
          title={c.title}
          accent={c.accent}
          subject={c.examName}
          topics={c.subjects}
          examName={c.examName}
          returnPath={RETURN_PATH}
        />
      ))}

      <section className="mb-8 p-6 bg-purple-50 rounded-xl">
        <h2 className="text-lg font-semibold mb-4">All Pakistani Boards Covered</h2>
        <div className="flex flex-wrap gap-2">
          {['Sindh Board', 'Punjab Board', 'Federal Board', 'KPK Board', 'AJK Board', 'Balochistan Board', 'BISE Lahore', 'BISE Karachi'].map((board) => (
            <span key={board} className="px-3 py-1.5 bg-white border border-purple-200 rounded-full text-sm">{board}</span>
          ))}
        </div>
      </section>

      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Practice Board MCQs Free</h2>
        <p className="opacity-90 mb-4">AI MCQs for Matric & FSc. All subjects, all boards. No signup needed.</p>
        <ExamQuickTestCTA examName={HERO_EXAM} subjects={HERO_SUBJECTS} variant="hero" label="Start Practice →" returnPath={RETURN_PATH} />
      </div>

      <div className="mt-8 p-6 bg-muted/40 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '9th Class MCQs', url: '/9th-class-mcqs' },
            { label: 'MDCAT Preparation', url: '/exams/mdcat' },
            { label: 'ECAT Preparation', url: '/ecat-preparation' },
            { label: 'FSc Pre-Medical', url: '/exams/fsc-pre-medical' },
            { label: 'FSc Pre-Engineering', url: '/exams/fsc-pre-engineering' },
            { label: 'Past Papers', url: '/mdcat-past-papers' },
          ].map((link) => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-background border rounded-full text-sm hover:bg-primary/5 text-primary">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <RelatedContent entitySlug="board-mcqs" title="Continue Preparing" />
    </div>
  </>
);

export default BoardMCQs;
