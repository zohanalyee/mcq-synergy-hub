import SEOHead from '@/components/SEOHead';
import { Link } from 'react-router-dom';

const BoardMCQs = () => (
  <>
    <SEOHead
      title="Board Exam MCQs | Class 9-12 Pakistan | Free Practice | MCQsAI"
      description="Free board exam MCQs for Matric (9th-10th) and FSc/FA (11th-12th). All Pakistani boards — Sindh, Punjab, Federal, KPK covered."
      keywords="board mcqs Pakistan, matric MCQs, FSc MCQs, intermediate MCQs, 10th class MCQs, 11th 12th class MCQs"
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Board Exam MCQs — Class 9 to 12 Pakistan</h1>
      <p className="text-muted-foreground mb-8">Complete MCQ practice for Matric (9th-10th) and FSc/FA (11th-12th). All Pakistani boards covered.</p>
      



      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-purple-700">Class 9 — Matric Part 1</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Biology" to="/boards" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Biology</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Chemistry" to="/boards" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Chemistry</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Physics" to="/boards" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Physics</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Mathematics" to="/boards" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Mathematics</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="English" to="/boards" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">English</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Urdu" to="/boards" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Urdu</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Pakistan Studies" to="/boards" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Pakistan Studies</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Computer Science" to="/boards" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Computer Science</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-blue-700">Class 10 — Matric Part 2</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Biology" to="/boards" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Biology</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Chemistry" to="/boards" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Chemistry</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Physics" to="/boards" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Physics</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Mathematics" to="/boards" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Mathematics</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="English" to="/boards" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">English</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Urdu" to="/boards" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Urdu</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Pakistan Studies" to="/boards" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Pakistan Studies</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Computer Science" to="/boards" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Computer Science</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-green-700">Class 11 — FSc/FA Part 1</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Biology" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Biology</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Chemistry" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Chemistry</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Physics" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Physics</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Mathematics" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Mathematics</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="English" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">English</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Urdu" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Urdu</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Pakistan Studies" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Pakistan Studies</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Economics" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Economics</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-orange-700">Class 12 — FSc/FA Part 2</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Biology" to="/boards" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Biology</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Chemistry" to="/boards" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Chemistry</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Physics" to="/boards" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Physics</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Mathematics" to="/boards" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Mathematics</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="English" to="/boards" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">English</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Urdu" to="/boards" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Urdu</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Pakistan Studies" to="/boards" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Pakistan Studies</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Economics" to="/boards" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Economics</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8 p-6 bg-purple-50 rounded-xl">
        <h2 className="text-lg font-semibold mb-4">All Pakistani Boards Covered</h2>
        <div className="flex flex-wrap gap-2">
          {['Sindh Board', 'Punjab Board', 'Federal Board', 'KPK Board', 'AJK Board', 'Balochistan Board', 'BISE Lahore', 'BISE Karachi'].map(board => (
            <span key={board} className="px-3 py-1.5 bg-white border border-purple-200 rounded-full text-sm">{board}</span>
          ))}
        </div>
      </section>

      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Practice Board MCQs Free</h2>
        <p className="opacity-90 mb-4">AI MCQs for Matric & FSc. All subjects, all boards. No signup needed.</p>
        <Link to="/boards" className="bg-white text-purple-700 px-8 py-3 rounded-full font-semibold inline-block">
          Browse by Board →
        </Link>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '9th Class MCQs', url: '/9th-class-mcqs' },
            { label: 'MDCAT Preparation', url: '/exams/mdcat' },
            { label: 'ECAT Preparation', url: '/ecat-preparation' },
            { label: 'FSc Pre-Medical', url: '/exams/fsc-pre-medical' },
            { label: 'FSc Pre-Engineering', url: '/exams/fsc-pre-engineering' },
            { label: 'Past Papers', url: '/mdcat-past-papers' }
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

export default BoardMCQs;
