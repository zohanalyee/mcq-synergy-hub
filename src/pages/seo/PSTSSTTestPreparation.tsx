import SEOHead from '@/components/SEOHead';
import { Link } from 'react-router-dom';

const PSTSSTTestPreparation = () => (
  <>
    <SEOHead
      title="PST & SST Test Preparation 2026 | Free MCQs | MCQsAI"
      description="Free Primary School Teacher (PST) and Secondary School Teacher (SST) recruitment test preparation. Education, GK, English MCQs."
      keywords="PST test preparation, SST test preparation, teacher recruitment test, educators test Pakistan"
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">PST & SST Test Preparation 2026 — Free MCQs</h1>
      <p className="text-muted-foreground mb-8">Primary School Teacher (PST) and Secondary School Teacher (SST) recruitment test preparation. NTS-style MCQs.</p>
      

      <section className="mb-8 p-6 bg-purple-50 rounded-xl">
        <h2 className="text-lg font-semibold mb-4">PST vs SST — Key Difference</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 bg-white border rounded-lg">
            <p className="font-semibold text-purple-700">PST (Primary)</p>
            <p className="text-sm text-muted-foreground mt-1">Class 1-5 teachers. Easy level. General subjects.</p>
          </div>
          <div className="p-4 bg-white border rounded-lg">
            <p className="font-semibold text-pink-700">SST (Secondary)</p>
            <p className="text-sm text-muted-foreground mt-1">Class 6-10 teachers. Medium level. Subject specialist.</p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-purple-700">Education & Pedagogy</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Teaching Methods" to="/exams/educators" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Teaching Methods</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Child Psychology" to="/exams/educators" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Child Psychology</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Classroom Management" to="/exams/educators" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Classroom Management</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Curriculum" to="/exams/educators" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Curriculum</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Assessment" to="/exams/educators" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Assessment</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Special Education" to="/exams/educators" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Special Education</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-blue-700">General Knowledge</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Pakistan Studies" to="/exams/educators" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Pakistan Studies</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Islamic Studies" to="/exams/educators" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Islamic Studies</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Current Affairs" to="/exams/educators" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Current Affairs</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Science GK" to="/exams/educators" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Science GK</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="World Affairs" to="/exams/educators" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">World Affairs</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Sports" to="/exams/educators" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Sports</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-green-700">English</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Grammar" to="/exams/educators" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Grammar</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Vocabulary" to="/exams/educators" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Vocabulary</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Comprehension" to="/exams/educators" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Comprehension</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Sentence Correction" to="/exams/educators" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Sentence Correction</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Teaching English" to="/exams/educators" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Teaching English</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Writing Skills" to="/exams/educators" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Writing Skills</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-orange-700">Subject Knowledge (SST)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Mathematics" to="/exams/educators" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Mathematics</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Biology" to="/exams/educators" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Biology</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Chemistry" to="/exams/educators" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Chemistry</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Physics" to="/exams/educators" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Physics</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Computer Science" to="/exams/educators" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Computer Science</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Social Studies" to="/exams/educators" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Social Studies</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>



      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start Teacher Test Prep Free</h2>
        <p className="opacity-90 mb-4">AI MCQs for PST & SST recruitment. No signup needed.</p>
        <Link to="/exams/educators" className="bg-white text-purple-700 px-8 py-3 rounded-full font-semibold inline-block">
          Practice Now →
        </Link>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'NTS Test Preparation', url: '/exams/nts' },
            { label: 'PPSC Past Papers', url: '/ppsc-past-papers' },
            { label: 'Educators Test', url: '/exams/educators' },
            { label: 'General Knowledge MCQs', url: '/exams/nts' },
            { label: 'English Grammar MCQs', url: '/subjects' }
          ].map(link => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-purple-50 text-purple-700">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  </>
);

export default PSTSSTTestPreparation;
