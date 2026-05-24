import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';

const PunjabUniversityEntryTest = () => (
  <>
    <SEOHead
      title="Punjab University Entry Test 2026 | Free MCQs | MCQsAI"
      description="Free Punjab University (PU) entry test preparation 2026. English, GK, Science, Social Sciences MCQs for all PU programs."
      keywords="Punjab University entry test, PU admission test, Punjab University MCQs, PU entry test 2026"
    />
    <ExamPageSchema
      name="Punjab University Entry Test Preparation"
      description="Free Punjab University (PU) entry test preparation MCQs for admission across faculties."
      url="https://mcqsai.com/punjab-university-entry-test"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: "Punjab University Entry Test", url: "https://mcqsai.com/punjab-university-entry-test" },
      ]}
      faqs={[
        { question: "What subjects are in the PU entry test?", answer: "Punjab University entry tests cover English, General Knowledge, Mathematics and subject-specific MCQs depending on the program." },
        { question: "Is the PU entry test free to practice online?", answer: "Yes, MCQsAI offers fully free Punjab University entry test MCQ practice." },
        { question: "When is the Punjab University admission test held?", answer: "PU admission tests are typically held between July and September each year." },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Punjab University Entry Test 2026 — Free MCQ Practice</h1>
      <p className="text-muted-foreground mb-8">University of Punjab (PU) admission test preparation for all faculties and programs.</p>
      



      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-purple-700">English</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Grammar" to="/exams/nts" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Grammar</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Vocabulary" to="/exams/nts" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Vocabulary</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Comprehension" to="/exams/nts" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Comprehension</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Sentence Correction" to="/exams/nts" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Sentence Correction</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Synonyms" to="/exams/nts" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Synonyms</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Antonyms" to="/exams/nts" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Antonyms</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-blue-700">General Knowledge</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Pakistan Affairs" to="/exams/nts" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Pakistan Affairs</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Current Affairs" to="/exams/nts" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Current Affairs</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Islamic Studies" to="/exams/nts" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Islamic Studies</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="World GK" to="/exams/nts" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">World GK</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Science" to="/exams/nts" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Science</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="History" to="/exams/nts" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">History</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-green-700">Science & Mathematics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Biology" to="/exams/nts" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Biology</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Chemistry" to="/exams/nts" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Chemistry</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Physics" to="/exams/nts" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Physics</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Mathematics" to="/exams/nts" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Mathematics</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Computer Science" to="/exams/nts" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Computer Science</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Statistics" to="/exams/nts" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Statistics</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-orange-700">Social Sciences</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Economics" to="/exams/nts" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Economics</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Political Science" to="/exams/nts" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Political Science</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Sociology" to="/exams/nts" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Sociology</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Psychology" to="/exams/nts" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Psychology</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="History" to="/exams/nts" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">History</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Geography" to="/exams/nts" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Geography</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>



      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start PU Test Preparation Free</h2>
        <p className="opacity-90 mb-4">AI MCQs for Punjab University admission. No signup needed.</p>
        <Link to="/exams/nts" className="bg-white text-blue-700 px-8 py-3 rounded-full font-semibold inline-block">
          Practice Now →
        </Link>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'NUST Entry Test', url: '/nust-entry-test' },
            { label: 'COMSATS Entry Test', url: '/comsats-entry-test' },
            { label: 'NTS NAT Test', url: '/exams/nts-nat' },
            { label: 'English MCQs', url: '/subjects' },
            { label: 'General Knowledge', url: '/exams/nts' }
          ].map(link => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-purple-50 text-purple-700">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <RelatedContent entitySlug="punjab-university-entry-test" title="Continue Preparing" />
    </div>
  </>
);

export default PunjabUniversityEntryTest;
