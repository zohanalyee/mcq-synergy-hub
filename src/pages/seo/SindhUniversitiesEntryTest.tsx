import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';

const SindhUniversitiesEntryTest = () => (
  <>
    <SEOHead
      title="Sindh Universities Entry Test 2026 | IBA, MUET, LUMHS | MCQsAI"
      description="Complete preparation for IBA Sukkur, MUET, LUMHS, DUHS, SMBBMU, University of Sindh, Mehran UET. MDCAT Sindh 2026 on August 16 by STS."
      keywords="Sindh university entry test, IBA Sukkur, MUET, LUMHS, DUHS, SMBBMU, MDCAT Sindh 2026 date, STS MDCAT 2026, MDCAT August 16 2026, LUMHS DUHS SMBBMU admission test 2026"
    />
    <ExamPageSchema
      name="Sindh Universities Entry Test Preparation"
      description="Free entry test preparation for IBA Sukkur, MUET, LUMHS, University of Sindh and Mehran University."
      url="https://mcqsai.com/sindh-universities-entry-test"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: "Sindh Universities Entry Test", url: "https://mcqsai.com/sindh-universities-entry-test" },
      ]}
      faqs={[
        { question: "Which Sindh universities does this cover?", answer: "Coverage includes IBA Sukkur, MUET Jamshoro, LUMHS, University of Sindh and Mehran University." },
        { question: "Is Sindh universities entry test online?", answer: "Most Sindh public universities now offer online and on-campus admission tests." },
        { question: "What is the test syllabus?", answer: "Typically English, Math, Physics, Chemistry and Biology — varies by program." },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Sindh Universities Entry Test 2026 — Free Preparation</h1>
      <p className="text-muted-foreground mb-6">Complete preparation for IBA Sukkur, MUET, LUMHS, University of Sindh, Mehran UET and all Sindh universities.</p>

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


      

      <section className="mb-8 p-6 bg-orange-50 rounded-xl">
        <h2 className="text-lg font-semibold mb-4">Sindh Universities Covered</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'IBA Sukkur', detail: 'Business, CS, Engineering — Aptitude Test' },
            { name: 'MUET Jamshoro', detail: 'Engineering — Math, Physics, Chemistry' },
            { name: 'LUMHS Jamshoro', detail: 'Medical — Biology, Chemistry, Physics' },
            { name: 'University of Sindh', detail: 'All Faculties — GK, English, Subject' },
            { name: 'Mehran UET', detail: 'Engineering — Math, Physics, Chemistry' },
            { name: 'QUEST Nawabshah', detail: 'Engineering & Technology' },
            { name: 'SALU Khairpur', detail: 'Arts, Science, Commerce' },
            { name: 'SZABIST Karachi', detail: 'Business, CS, Media Sciences' },
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
          <Link key="Geometry" to={`/custom-syllabus?topic=Geometry`} className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Geometry</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Matrices" to={`/custom-syllabus?topic=Matrices`} className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Matrices</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-blue-700">English & Aptitude</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Grammar" to={`/custom-syllabus?topic=Grammar`} className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Grammar</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Vocabulary" to={`/custom-syllabus?topic=Vocabulary`} className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Vocabulary</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Comprehension" to={`/custom-syllabus?topic=Comprehension`} className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Comprehension</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Analytical Reasoning" to={`/custom-syllabus?topic=Analytical%20Reasoning`} className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Analytical Reasoning</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="IQ" to={`/custom-syllabus?topic=IQ`} className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">IQ</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Logical Reasoning" to={`/custom-syllabus?topic=Logical%20Reasoning`} className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Logical Reasoning</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-green-700">Science Subjects</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Biology" to={`/custom-syllabus?topic=Biology`} className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Biology</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Chemistry" to={`/custom-syllabus?topic=Chemistry`} className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Chemistry</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Physics" to={`/custom-syllabus?topic=Physics`} className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Physics</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Computer Science" to={`/custom-syllabus?topic=Computer%20Science`} className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Computer Science</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Statistics" to={`/custom-syllabus?topic=Statistics`} className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Statistics</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Environmental Science" to={`/custom-syllabus?topic=Environmental%20Science`} className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Environmental Science</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-orange-700">General Knowledge</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Pakistan Studies" to={`/custom-syllabus?topic=Pakistan%20Studies`} className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Pakistan Studies</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Sindh Studies" to={`/custom-syllabus?topic=Sindh%20Studies`} className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Sindh Studies</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Current Affairs" to={`/custom-syllabus?topic=Current%20Affairs`} className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Current Affairs</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Islamic Studies" to={`/custom-syllabus?topic=Islamic%20Studies`} className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Islamic Studies</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="World GK" to={`/custom-syllabus?topic=World%20GK`} className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">World GK</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Science GK" to={`/custom-syllabus?topic=Science%20GK`} className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Science GK</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>



      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Sindh Universities Test Practice — Free</h2>
        <p className="opacity-90 mb-4">AI MCQs for all Sindh universities. Available in English and Sindhi. No signup needed.</p>
        <Link to="/exams/nts" className="bg-white text-orange-700 px-8 py-3 rounded-full font-semibold inline-block">
          Practice Now →
        </Link>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'IBA Sukkur Preparation', url: '/exams/nts' },
            { label: 'SPSC Test Prep', url: '/exams/spsc' },
            { label: 'Sindh Board MCQs', url: '/boards' },
            { label: 'MDCAT Preparation', url: '/exams/mdcat' },
            { label: 'Engineering Entry Tests', url: '/engineering-universities-entry-test' }
          ].map(link => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-purple-50 text-purple-700">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <RelatedContent entitySlug="sindh-universities-entry-test" title="Continue Preparing" />
    </div>
  </>
);

export default SindhUniversitiesEntryTest;
