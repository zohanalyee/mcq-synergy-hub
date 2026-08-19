import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import { Link } from 'react-router-dom';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { ExamQuickTestCTA } from '@/components/quick-test/ExamQuickTestCTA';
import { SeoSectionGrid } from '@/components/quick-test/SeoSectionGrid';

const EXAM_NAME = 'MDCAT';
const RETURN_PATH = '/mdcat-past-papers';
const ALL_SUBJECTS = ['Biology', 'Chemistry', 'Physics', 'English'];

const years = [
  { year: '2025', total: 200 },
  { year: '2024', total: 200 },
  { year: '2023', total: 200 },
  { year: '2022', total: 200 },
  { year: '2021', total: 180 },
  { year: '2020', total: 180 },
];

/** PM&DC national MDCAT pattern — 200 MCQs in 210 minutes. */
const PATTERN = [
  { subject: 'Biology', mcqs: 68, note: 'Cell Biology, Genetics, Homeostasis and Reproduction repeat most often.' },
  { subject: 'Chemistry', mcqs: 54, note: 'Organic Chemistry, Atomic Structure and Electrochemistry dominate.' },
  { subject: 'Physics', mcqs: 54, note: 'Waves, Electrostatics, Motion & Force and Nuclear Physics recur yearly.' },
  { subject: 'English', mcqs: 18, note: 'Sentence correction, vocabulary and synonyms/antonyms.' },
  { subject: 'Logical Reasoning', mcqs: 6, note: 'Series, logical deduction and critical thinking — quick marks.' },
];


const mostRepeated = [
  'Cell Biology', 'Biological Molecules',
  'Organic Chemistry', 'Atomic Structure',
  'Waves & Oscillations', 'Genetics',
  'Homeostasis', 'Electrochemistry',
  'Sentence Correction', 'Vocabulary',
];

const MDCATPastPapers = () => (
  <>
    <SEOHead
      title="MDCAT Past Papers 2024-2026 | Free MCQ Practice | MCQsAI Pakistan"
      description="Solve MDCAT past papers online free. PMC MDCAT 2024, 2023, 2022 past papers with answers. Biology, Chemistry, Physics, English MCQs from previous years."
      keywords="MDCAT past papers, MDCAT past papers 2024, MDCAT past papers with answers, PMC past papers, MDCAT MCQs Pakistan"
    />
    <ExamPageSchema
      name="MDCAT Past Papers — Free Online Practice"
      description="PMC MDCAT past papers from 2019-2024 with answers and explanations. Free online practice."
      url="https://mcqsai.com/mdcat-past-papers"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: 'MDCAT Past Papers', url: 'https://mcqsai.com/mdcat-past-papers' },
      ]}
      faqs={[
        { question: 'Where can I solve MDCAT past papers?', answer: 'Practice them free on MCQsAI with answers and detailed explanations.' },
        { question: 'Are MDCAT 2024 past papers available?', answer: 'Yes, MDCAT 2024 along with 2019-2023 past papers are available.' },
        { question: 'Is MCQsAI past paper practice free?', answer: 'Yes, all past papers are completely free.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">MDCAT Past Papers — Free Online Practice</h1>
      <p className="text-muted-foreground mb-2">PMC MDCAT past papers from 2019–2024 with answers and explanations.</p>
      <p className="text-sm text-purple-600 font-medium mb-6">4,400+ students search for this every month — practice smarter!</p>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold text-yellow-800">📅 MDCAT 2026 — Rescheduled Test Date</p>
        <p className="text-sm text-yellow-700 mt-1">
          MDCAT 2026 has been rescheduled from 16 August 2026 to <strong>Sunday, 20 September 2026</strong>.
          Confirmed by PM&amp;DC Public Notice No. PF-1-C-PM&amp;DC/Notification/2026/1229 (6 August 2026) and the
          STS press release No. STS/SEC/990/26. Use the remaining weeks to solve past papers subject by subject.
        </p>
        <p className="text-xs text-yellow-700 mt-2">
          Source:{' '}
          <a
            href="https://www.iba-suk.edu.pk/sts/announcements"
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="underline"
          >
            SIBA Testing Services — official announcements
          </a>
        </p>
      </div>

      <div className="mb-10 flex flex-wrap gap-3">
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} returnPath={RETURN_PATH} />
        <Link to="/custom-syllabus" className="inline-flex items-center px-4 py-2 rounded-md border text-sm hover:bg-muted">Build a custom syllabus</Link>
      </div>

      {years.map((paper) => (
        <SeoSectionGrid
          key={paper.year}
          title={`MDCAT ${paper.year} Past Paper (${paper.total} MCQs)`}
          accent="text-purple-700"
          subject={`MDCAT ${paper.year}`}
          topics={['Biology', 'Chemistry', 'Physics', 'English']}
          examName={`MDCAT ${paper.year}`}
          returnPath={RETURN_PATH}
        />
      ))}

      <SeoSectionGrid
        title="Most Repeated MDCAT Topics"
        accent="text-purple-700"
        subject="MDCAT Repeated"
        topics={mostRepeated}
        examName="MDCAT Most Repeated"
        returnPath={RETURN_PATH}
      />

      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Practice MDCAT MCQs Free</h2>
        <p className="opacity-90 mb-4">AI-generated MCQs based on past paper patterns. Instant feedback. No signup needed.</p>
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} variant="hero" label="Start Practice →" returnPath={RETURN_PATH} />
      </div>

      <div className="mt-8 p-6 bg-muted/40 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'MDCAT Syllabus 2026', url: '/mdcat-syllabus' },
            { label: 'MDCAT Aggregate Calculator', url: '/tools/aggregate-calculator' },
            { label: 'ECAT Preparation', url: '/ecat-preparation' },
            { label: 'PPSC Past Papers', url: '/ppsc-past-papers' },
            { label: 'FPSC Past Papers', url: '/fpsc-past-papers' },
            { label: 'MDCAT MCQs Practice', url: '/exams/mdcat' },
            { label: 'NUMS Preparation', url: '/exams/nums' },

          ].map((link) => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-background border rounded-full text-sm hover:bg-primary/5 text-primary">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <RelatedContent entitySlug="mdcat-past-papers" title="Continue your MDCAT prep" />
    </div>
  </>
);

export default MDCATPastPapers;
