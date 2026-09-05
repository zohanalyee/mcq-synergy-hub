import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import { Link } from 'react-router-dom';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { ExamQuickTestCTA } from '@/components/quick-test/ExamQuickTestCTA';
import { SeoSectionGrid } from '@/components/quick-test/SeoSectionGrid';
import { MdcatCountdown, MdcatWeightageTable, MdcatContextualLinks } from '@/components/mdcat/MdcatSprintBlocks';

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
      title="MDCAT Past Papers 2020-2025 | Free MCQ Practice"
      description="Solve MDCAT past papers online free. MDCAT 2025, 2024, 2023 past papers with answers plus the 200-MCQ paper pattern for MDCAT 2026 on 20 September."
      keywords="MDCAT past papers, MDCAT past papers 2025, MDCAT past papers with answers, MDCAT paper pattern, MDCAT MCQs Pakistan"
    />
    <ExamPageSchema
      name="MDCAT Past Papers — Free Online Practice"
      description="MDCAT past papers from 2020-2025 with answers, explanations and the official 200-MCQ paper pattern. Free online practice."
      url="https://mcqsai.com/mdcat-past-papers"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: 'MDCAT Past Papers', url: 'https://mcqsai.com/mdcat-past-papers' },
      ]}
      faqs={[
        { question: 'Where can I solve MDCAT past papers?', answer: 'Practice them free on MCQsAI with answers and detailed explanations, year by year and subject by subject.' },
        { question: 'Are MDCAT 2025 past papers available?', answer: 'Yes. MDCAT 2025 along with the 2020-2024 papers are available for free practice.' },
        { question: 'When will the MDCAT 2026 paper be added?', answer: 'MDCAT 2026 is held on Sunday, 20 September 2026. The 2026 paper will be added after test day; the pattern is unchanged, so the 2025 paper is the closest practice.' },
        { question: 'What is the MDCAT paper pattern?', answer: 'MDCAT has 200 MCQs in 210 minutes: Biology 68, Chemistry 54, Physics 54, English 18 and Logical Reasoning 6. There is no negative marking and the qualifying score is 55%.' },
        { question: 'Is MCQsAI past paper practice free?', answer: 'Yes, all past papers are completely free.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">MDCAT Past Papers — Free Online Practice</h1>
      <p className="text-muted-foreground mb-2">MDCAT past papers from 2020–2025 with answers and explanations.</p>

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

      <MdcatCountdown />

      <div className="mb-10 flex flex-wrap gap-3">
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} returnPath={RETURN_PATH} />
        <Link to="/custom-syllabus" className="inline-flex items-center px-4 py-2 rounded-md border text-sm hover:bg-muted">Build a custom syllabus</Link>
      </div>

      <MdcatWeightageTable />

      <section id="mdcat-paper-pattern" className="mb-10 scroll-mt-24">
        <h2 className="text-xl font-semibold mb-2">MDCAT Past Paper Pattern (200 MCQs / 210 minutes)</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Every recent MDCAT paper follows the same PM&amp;DC distribution. That works out to roughly
          one minute per MCQ, and there is no negative marking — so never leave a blank. The
          qualifying score is 55% (110 out of 200).
        </p>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Subject</th>
                <th className="text-left px-3 py-2 font-semibold">MCQs</th>
                <th className="text-left px-3 py-2 font-semibold">Commonly repeated areas</th>
              </tr>
            </thead>
            <tbody>
              {PATTERN.map((p) => (
                <tr key={p.subject} className="border-t">
                  <td className="px-3 py-2 font-medium">{p.subject}</td>
                  <td className="px-3 py-2">{p.mcqs}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          Full chapter list and time-allocation guidance is on the{' '}
          <Link to="/mdcat-syllabus" className="text-purple-700 underline">
            MDCAT 2026 syllabus page
          </Link>
          .
        </p>
      </section>

      <div className="mb-10 rounded-xl border bg-muted/30 p-4">
        <h2 className="text-base font-semibold mb-1">MDCAT 2026 Paper</h2>
        <p className="text-sm text-muted-foreground">
          MDCAT 2026 is held on Sunday, 20 September 2026. The 2026 paper and its solved MCQs will
          be added here after the test day. Until then, practise the 2025 and 2024 papers below —
          the pattern is unchanged.
        </p>
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

      <MdcatContextualLinks />

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
