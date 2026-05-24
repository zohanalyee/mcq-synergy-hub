import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import { Link } from 'react-router-dom';
import RelatedContent from '@/components/seo/related/RelatedContent';

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
        { name: "MDCAT Past Papers", url: "https://mcqsai.com/mdcat-past-papers" },
      ]}
      faqs={[
        { question: "Where can I solve MDCAT past papers?", answer: "Practice them free on MCQsAI with answers and detailed explanations." },
        { question: "Are MDCAT 2024 past papers available?", answer: "Yes, MDCAT 2024 along with 2019-2023 past papers are available." },
        { question: "Is MCQsAI past paper practice free?", answer: "Yes, all past papers are completely free." },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">
        MDCAT Past Papers — Free Online Practice
      </h1>
      <p className="text-muted-foreground mb-2">
        PMC MDCAT past papers from 2019–2024 with answers and explanations.
      </p>
      <p className="text-sm text-purple-600 font-medium mb-6">
        4,400+ students search for this every month — practice smarter!
      </p>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold text-yellow-800">
          📅 MDCAT Sindh 2026 — Important Date
        </p>
        <p className="text-sm text-yellow-700 mt-1">
          MDCAT Sindh 2026 will be conducted on{' '}
          <strong>August 16, 2026</strong> by{' '}
          <strong>STS (Sindh Testing Service)</strong>.
          For admission to LUMHS, DUHS, SMBBMU and other Sindh medical universities.
          Start preparation now — only 3 months left!
        </p>
      </div>

      {[
        { year: '2024', topics: ['Biology', 'Chemistry', 'Physics', 'English'], total: 200 },
        { year: '2023', topics: ['Biology', 'Chemistry', 'Physics', 'English'], total: 200 },
        { year: '2022', topics: ['Biology', 'Chemistry', 'Physics', 'English'], total: 200 },
        { year: '2021', topics: ['Biology', 'Chemistry', 'Physics', 'English'], total: 180 },
        { year: '2020', topics: ['Biology', 'Chemistry', 'Physics', 'English'], total: 180 },
      ].map(paper => (
        <section key={paper.year} className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-purple-700">
            MDCAT {paper.year} Past Paper ({paper.total} MCQs)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {paper.topics.map(topic => (
              <Link
                key={topic}
                to="/exams/mdcat"
                className="p-3 border rounded-lg hover:bg-purple-50 text-center"
              >
                <p className="text-sm font-medium">{topic}</p>
                <p className="text-xs text-purple-600 mt-1">Practice →</p>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="mb-8 p-6 bg-purple-50 rounded-xl">
        <h2 className="text-lg font-semibold mb-4">
          Most Repeated MDCAT Topics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            'Cell Biology', 'Biological Molecules',
            'Organic Chemistry', 'Atomic Structure',
            'Waves & Oscillations', 'Genetics',
            'Homeostasis', 'Electrochemistry',
            'Sentence Correction', 'Vocabulary'
          ].map(topic => (
            <Link
              key={topic}
              to="/exams/mdcat"
              className="p-2 bg-white border border-purple-200 rounded-lg text-sm hover:bg-purple-100 text-center"
            >
              {topic}
            </Link>
          ))}
        </div>
      </section>

      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Practice MDCAT MCQs Free</h2>
        <p className="opacity-90 mb-4">
          AI-generated MCQs based on past paper patterns. Instant feedback. No signup needed.
        </p>
        <Link to="/exams/mdcat"
          className="bg-white text-purple-700 px-8 py-3 rounded-full font-semibold hover:bg-purple-50 inline-block">
          Start Practice →
        </Link>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'MDCAT Syllabus 2026', url: '/mdcat-syllabus' },
            { label: 'ECAT Preparation', url: '/ecat-preparation' },
            { label: 'PPSC Past Papers', url: '/ppsc-past-papers' },
            { label: 'FPSC Past Papers', url: '/fpsc-past-papers' },
            { label: 'MDCAT MCQs Practice', url: '/exams/mdcat' },
            { label: 'NUMS Preparation', url: '/exams/nums' },
          ].map(link => (
            <Link key={link.url} to={link.url}
              className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-purple-50 text-purple-700">
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
