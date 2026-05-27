import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';

const COMSATSEntryTest = () => (
  <>
    <SEOHead
      title="COMSATS Entry Test 2026 | Free Preparation | MCQsAI"
      description="Free COMSATS University Islamabad (CUI) entry test preparation. Math, Physics, CS, English MCQs."
      keywords="COMSATS entry test, CUI admission, COMSATS MCQs, COMSATS preparation 2026"
    />
    <ExamPageSchema
      name="COMSATS Entry Test (NTS NAT) Preparation"
      description="Free COMSATS University Islamabad (CUI) entry test preparation. Math, Physics, CS, English MCQs."
      url="https://mcqsai.com/comsats-entry-test"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: "COMSATS Entry Test", url: "https://mcqsai.com/comsats-entry-test" },
      ]}
      faqs={[
        { question: "What is the COMSATS entry test format?", answer: "COMSATS uses NTS NAT-style MCQs covering Math, Physics, English and analytical reasoning." },
        { question: "Is COMSATS entry test difficult?", answer: "It is moderate difficulty; consistent MCQ practice on MCQsAI helps clear the merit comfortably." },
        { question: "How many MCQs in the COMSATS test?", answer: "NTS NAT for COMSATS usually has 90 MCQs to be solved in 120 minutes." },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">COMSATS Entry Test 2026 — Free Preparation</h1>
      <p className="text-muted-foreground mb-8">COMSATS University Islamabad (CUI) admission test preparation for Engineering, CS, and Science programs.</p>
      



      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-purple-700">Mathematics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Algebra" to={`/custom-syllabus?topic=Algebra`} className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Algebra</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Calculus" to={`/custom-syllabus?topic=Calculus`} className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Calculus</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Trigonometry" to={`/custom-syllabus?topic=Trigonometry`} className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Trigonometry</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Statistics" to={`/custom-syllabus?topic=Statistics`} className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Statistics</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Matrices" to={`/custom-syllabus?topic=Matrices`} className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Matrices</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Probability" to={`/custom-syllabus?topic=Probability`} className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Probability</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-blue-700">Physics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Mechanics" to={`/custom-syllabus?topic=Mechanics`} className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Mechanics</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Electricity" to={`/custom-syllabus?topic=Electricity`} className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Electricity</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Waves" to={`/custom-syllabus?topic=Waves`} className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Waves</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Thermodynamics" to={`/custom-syllabus?topic=Thermodynamics`} className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Thermodynamics</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Modern Physics" to={`/custom-syllabus?topic=Modern%20Physics`} className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Modern Physics</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Optics" to={`/custom-syllabus?topic=Optics`} className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Optics</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-green-700">Computer Science</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Programming Basics" to={`/custom-syllabus?topic=Programming%20Basics`} className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Programming Basics</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Data Structures" to={`/custom-syllabus?topic=Data%20Structures`} className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Data Structures</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Algorithms" to={`/custom-syllabus?topic=Algorithms`} className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Algorithms</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Database" to={`/custom-syllabus?topic=Database`} className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Database</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Networking" to={`/custom-syllabus?topic=Networking`} className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Networking</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="OOP" to={`/custom-syllabus?topic=OOP`} className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">OOP</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-orange-700">English</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Grammar" to={`/custom-syllabus?topic=Grammar`} className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Grammar</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Vocabulary" to={`/custom-syllabus?topic=Vocabulary`} className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Vocabulary</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Comprehension" to={`/custom-syllabus?topic=Comprehension`} className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Comprehension</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Analytical Reasoning" to={`/custom-syllabus?topic=Analytical%20Reasoning`} className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Analytical Reasoning</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>



      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start COMSATS Preparation Free</h2>
        <p className="opacity-90 mb-4">AI MCQs for CUI admission test. No signup needed.</p>
        <Link to="/exams/nts" className="bg-white text-green-700 px-8 py-3 rounded-full font-semibold inline-block">
          Practice Now →
        </Link>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'NUST Entry Test', url: '/nust-entry-test' },
            { label: 'ECAT Preparation', url: '/ecat-preparation' },
            { label: 'FAST NUCES Test', url: '/engineering-universities-entry-test' },
            { label: 'Physics MCQs', url: '/subjects' },
            { label: 'Mathematics MCQs', url: '/subjects' }
          ].map(link => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-purple-50 text-purple-700">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <RelatedContent entitySlug="comsats-entry-test" title="Continue Preparing" />
    </div>
  </>
);

export default COMSATSEntryTest;
