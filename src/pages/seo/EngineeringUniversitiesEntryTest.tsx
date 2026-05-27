import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';

const EngineeringUniversitiesEntryTest = () => (
  <>
    <SEOHead
      title="Engineering Universities Entry Test 2026 | GIKI, LUMS, FAST | MCQsAI"
      description="Free entry test preparation for GIKI, LUMS, FAST NUCES, Bahria, Aga Khan, Air University and top engineering universities."
      keywords="GIKI entry test, LUMS entry test, FAST NUCES, Bahria University, engineering university test Pakistan"
    />
    <ExamPageSchema
      name="Engineering Universities Entry Test 2026"
      description="Free entry test preparation for GIKI, LUMS, FAST NUCES, Bahria, Aga Khan, Air University and top engineering universities of Pakistan."
      url="https://mcqsai.com/engineering-universities-entry-test"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: "Engineering Universities Entry Test", url: "https://mcqsai.com/engineering-universities-entry-test" },
      ]}
      faqs={[
        { question: "Which engineering universities are covered?", answer: "GIKI, LUMS, FAST NUCES, Bahria, Aga Khan, Air University, Islamia University and Hamdard University." },
        { question: "What subjects are tested?", answer: "Mathematics, Physics, Chemistry, English and analytical reasoning." },
        { question: "Are these MCQs free?", answer: "Yes, all engineering university entry test MCQs on MCQsAI are completely free." },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Engineering Universities Entry Test 2026 | Pakistan MCQ Practice</h1>
      <p className="text-muted-foreground mb-8">Preparation for GIKI, LUMS, FAST NUCES, Bahria University, Aga Khan, and other top engineering universities.</p>
      

      <section className="mb-8 p-6 bg-blue-50 rounded-xl">
        <h2 className="text-lg font-semibold mb-4">Universities Covered</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'GIKI', detail: 'Math, Physics, Chemistry, English' },
            { name: 'LUMS', detail: 'SAT-style — Math, English, Reasoning' },
            { name: 'FAST NUCES', detail: 'Math, Physics, English, IQ' },
            { name: 'Bahria University', detail: 'Math, Physics, Chemistry, English' },
            { name: 'Aga Khan University', detail: 'Science, English, Reasoning' },
            { name: 'Air University', detail: 'Math, Physics, English' },
            { name: 'Islamia University', detail: 'Subject + General Knowledge' },
            { name: 'Hamdard University', detail: 'Biology, Chemistry, Physics' },
          ].map(uni => (
            <div key={uni.name} className="p-3 bg-white border rounded-lg">
              <p className="font-medium text-sm">{uni.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{uni.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-purple-700">Mathematics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Calculus" to={`/custom-syllabus?topic=Calculus`} className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Calculus</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Algebra" to={`/custom-syllabus?topic=Algebra`} className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Algebra</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Trigonometry" to={`/custom-syllabus?topic=Trigonometry`} className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Trigonometry</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Coordinate Geometry" to={`/custom-syllabus?topic=Coordinate%20Geometry`} className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Coordinate Geometry</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Statistics" to={`/custom-syllabus?topic=Statistics`} className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Statistics</p>
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
          <Link key="Waves" to={`/custom-syllabus?topic=Waves`} className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Waves</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Electricity" to={`/custom-syllabus?topic=Electricity`} className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Electricity</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Magnetism" to={`/custom-syllabus?topic=Magnetism`} className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Magnetism</p>
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
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-green-700">Chemistry</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Organic" to={`/custom-syllabus?topic=Organic`} className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Organic</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Inorganic" to={`/custom-syllabus?topic=Inorganic`} className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Inorganic</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Physical" to={`/custom-syllabus?topic=Physical`} className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Physical</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Analytical" to={`/custom-syllabus?topic=Analytical`} className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Analytical</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Industrial" to={`/custom-syllabus?topic=Industrial`} className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Industrial</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Environmental" to={`/custom-syllabus?topic=Environmental`} className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Environmental</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-orange-700">English & Reasoning</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Vocabulary" to={`/custom-syllabus?topic=Vocabulary`} className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Vocabulary</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Grammar" to={`/custom-syllabus?topic=Grammar`} className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Grammar</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Comprehension" to={`/custom-syllabus?topic=Comprehension`} className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Comprehension</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Analytical" to={`/custom-syllabus?topic=Analytical`} className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Analytical</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Logical Reasoning" to={`/custom-syllabus?topic=Logical%20Reasoning`} className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Logical Reasoning</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="IQ" to={`/custom-syllabus?topic=IQ`} className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">IQ</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>



      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start Engineering Test Prep Free</h2>
        <p className="opacity-90 mb-4">AI MCQs for all engineering universities. No signup needed.</p>
        <Link to="/exams/ecat" className="bg-white text-blue-700 px-8 py-3 rounded-full font-semibold inline-block">
          Practice Now →
        </Link>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'NUST Entry Test', url: '/nust-entry-test' },
            { label: 'ECAT Preparation', url: '/ecat-preparation' },
            { label: 'COMSATS Entry Test', url: '/comsats-entry-test' },
            { label: 'Punjab University Test', url: '/punjab-university-entry-test' },
            { label: 'FSc Pre-Engineering', url: '/exams/fsc-pre-engineering' }
          ].map(link => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-purple-50 text-purple-700">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <RelatedContent entitySlug="engineering-universities-entry-test" title="Continue Preparing" />
    </div>
  </>
);

export default EngineeringUniversitiesEntryTest;
