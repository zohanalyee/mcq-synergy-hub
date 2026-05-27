import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';
import { ExamQuickTestCTA } from '@/components/quick-test/ExamQuickTestCTA';
import { QuickTestChip } from '@/components/quick-test/QuickTestChip';

const EXAM_NAME = 'NUST Entry Test';
const ALL_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'English'];

const Section = ({
  title,
  accent,
  subject,
  topics,
}: {
  title: string;
  accent: string;
  subject: string;
  topics: string[];
}) => (
  <section className="mb-8">
    <h2 className={`text-xl font-semibold mb-3 ${accent}`}>{title}</h2>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {topics.map((t) => (
        <QuickTestChip
          key={t}
          topicName={t}
          subjects={[subject]}
          examName={EXAM_NAME}
          returnPath="/nust-entry-test"
        />
      ))}
    </div>
  </section>
);

const NUSTEntryTest = () => (
  <>
    <SEOHead
      title="NUST Entry Test (NET) 2026 | Free Preparation | MCQsAI"
      description="Free NUST Entry Test (NET) 2026 preparation. Mathematics, Physics, Chemistry, English MCQs for National University of Sciences & Technology."
      keywords="NUST entry test, NET 2026, NUST preparation, NUST MCQs, National University Sciences Technology"
    />
    <ExamPageSchema
      name="NUST Entry Test (NET) Preparation"
      description="Free NUST entry test (NET) preparation with Math, Physics, Chemistry, English MCQs."
      url="https://mcqsai.com/nust-entry-test"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: 'NUST Entry Test', url: 'https://mcqsai.com/nust-entry-test' },
      ]}
      faqs={[
        { question: 'What is the NUST entry test?', answer: 'NUST Entry Test (NET) is the admission test for the National University of Sciences and Technology covering Math, Physics, Chemistry and English.' },
        { question: 'How can I prepare for NUST NET for free?', answer: 'Use MCQsAI to practice subject-wise NUST NET MCQs free of cost with instant feedback and AI explanations.' },
        { question: 'What is the NUST NET passing score?', answer: 'NUST typically requires a competitive aggregate score; merit varies by program and year, usually 60%+ for engineering.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">NUST Entry Test (NET) 2026 — Free Preparation</h1>
      <p className="text-muted-foreground mb-2">National University of Sciences & Technology admission test preparation.</p>
      <p className="text-sm text-purple-600 font-medium mb-6">9,900+ students search for this every month!</p>

      {/* Primary CTA — top */}
      <div className="mb-10 flex flex-wrap gap-3">
        <ExamQuickTestCTA
          examName={EXAM_NAME}
          subjects={ALL_SUBJECTS}
          returnPath="/nust-entry-test"
        />
        <Link
          to="/custom-syllabus"
          className="inline-flex items-center px-4 py-2 rounded-md border text-sm hover:bg-muted"
        >
          Build a custom syllabus
        </Link>
      </div>

      <Section
        title="Mathematics (40%)"
        accent="text-purple-700"
        subject="Mathematics"
        topics={['Algebra', 'Calculus', 'Trigonometry', 'Coordinate Geometry', 'Statistics', 'Matrices', 'Vectors', 'Sequences & Series']}
      />
      <Section
        title="Physics (30%)"
        accent="text-blue-700"
        subject="Physics"
        topics={['Mechanics', 'Thermodynamics', 'Waves', 'Optics', 'Electricity', 'Magnetism', 'Modern Physics', 'Nuclear Physics']}
      />
      <Section
        title="Chemistry (15%)"
        accent="text-green-700"
        subject="Chemistry"
        topics={['Physical Chemistry', 'Organic Chemistry', 'Inorganic Chemistry', 'Industrial Chemistry']}
      />
      <Section
        title="English & Intelligence (15%)"
        accent="text-orange-700"
        subject="English"
        topics={['Vocabulary', 'Grammar', 'Comprehension', 'Analytical Reasoning', 'IQ Questions', 'Logical Reasoning']}
      />

      {/* Primary CTA — bottom */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start NUST Preparation Free</h2>
        <p className="opacity-90 mb-4">AI-powered MCQs for NET. Physics, Maths, Chemistry practice. No signup needed.</p>
        <ExamQuickTestCTA
          examName={EXAM_NAME}
          subjects={ALL_SUBJECTS}
          variant="hero"
          label="Practice Now →"
          returnPath="/nust-entry-test"
        />
      </div>

      <div className="mt-8 p-6 bg-muted/40 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'ECAT Preparation', url: '/ecat-preparation' },
            { label: 'GIKI Entry Test', url: '/engineering-universities-entry-test' },
            { label: 'COMSATS Entry Test', url: '/comsats-entry-test' },
            { label: 'Physics MCQs', url: '/subjects' },
            { label: 'Mathematics MCQs', url: '/subjects' },
          ].map((link) => (
            <Link
              key={link.url}
              to={link.url}
              className="px-4 py-2 bg-background border rounded-full text-sm hover:bg-primary/5 text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <RelatedContent entitySlug="nust-entry-test" title="Continue Preparing" />
    </div>
  </>
);

export default NUSTEntryTest;
