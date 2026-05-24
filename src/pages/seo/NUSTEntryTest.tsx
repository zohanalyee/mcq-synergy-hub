import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';

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
        { name: "NUST Entry Test", url: "https://mcqsai.com/nust-entry-test" },
      ]}
      faqs={[
        { question: "What is the NUST entry test?", answer: "NUST Entry Test (NET) is the admission test for the National University of Sciences and Technology covering Math, Physics, Chemistry and English." },
        { question: "How can I prepare for NUST NET for free?", answer: "Use MCQsAI to practice subject-wise NUST NET MCQs free of cost with instant feedback and AI explanations." },
        { question: "What is the NUST NET passing score?", answer: "NUST typically requires a competitive aggregate score; merit varies by program and year, usually 60%+ for engineering." },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">NUST Entry Test (NET) 2026 — Free Preparation</h1>
      <p className="text-muted-foreground mb-2">National University of Sciences & Technology admission test preparation.</p>
      <p className="text-sm text-purple-600 font-medium mb-8">9,900+ students search for this every month!</p>



      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-purple-700">Mathematics (40%)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Algebra" to="/exams/nust" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Algebra</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Calculus" to="/exams/nust" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Calculus</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Trigonometry" to="/exams/nust" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Trigonometry</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Coordinate Geometry" to="/exams/nust" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Coordinate Geometry</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Statistics" to="/exams/nust" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Statistics</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Matrices" to="/exams/nust" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Matrices</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Vectors" to="/exams/nust" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Vectors</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Sequences & Series" to="/exams/nust" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Sequences & Series</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-blue-700">Physics (30%)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Mechanics" to="/exams/nust" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Mechanics</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Thermodynamics" to="/exams/nust" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Thermodynamics</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Waves" to="/exams/nust" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Waves</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Optics" to="/exams/nust" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Optics</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Electricity" to="/exams/nust" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Electricity</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Magnetism" to="/exams/nust" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Magnetism</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Modern Physics" to="/exams/nust" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Modern Physics</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Nuclear Physics" to="/exams/nust" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Nuclear Physics</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-green-700">Chemistry (15%)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Physical Chemistry" to="/exams/nust" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Physical Chemistry</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Organic Chemistry" to="/exams/nust" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Organic Chemistry</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Inorganic Chemistry" to="/exams/nust" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Inorganic Chemistry</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Industrial Chemistry" to="/exams/nust" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Industrial Chemistry</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-orange-700">English & Intelligence (15%)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Vocabulary" to="/exams/nust" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Vocabulary</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Grammar" to="/exams/nust" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Grammar</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Comprehension" to="/exams/nust" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Comprehension</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Analytical Reasoning" to="/exams/nust" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Analytical Reasoning</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="IQ Questions" to="/exams/nust" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">IQ Questions</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Logical Reasoning" to="/exams/nust" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Logical Reasoning</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>



      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start NUST Preparation Free</h2>
        <p className="opacity-90 mb-4">AI-powered MCQs for NET. Physics, Maths, Chemistry practice. No signup needed.</p>
        <Link to="/exams/nust" className="bg-white text-purple-700 px-8 py-3 rounded-full font-semibold inline-block">
          Practice Now →
        </Link>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'ECAT Preparation', url: '/ecat-preparation' },
            { label: 'GIKI Entry Test', url: '/engineering-universities-entry-test' },
            { label: 'COMSATS Entry Test', url: '/comsats-entry-test' },
            { label: 'FSc Pre-Engineering', url: '/exams/fsc-pre-engineering' },
            { label: 'Physics MCQs', url: '/subjects' },
            { label: 'Mathematics MCQs', url: '/subjects' }
          ].map(link => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-purple-50 text-purple-700">
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
