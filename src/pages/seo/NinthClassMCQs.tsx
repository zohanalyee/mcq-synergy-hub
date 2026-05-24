import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';

const NinthClassMCQs = () => (
  <>
    <SEOHead
      title="9th Class MCQs | All Subjects Pakistan | Free Practice | MCQsAI"
      description="Free 9th class MCQs practice for Biology, Chemistry, Physics, Mathematics, English. All Pakistani boards — Sindh, Punjab, Federal, KPK."
      keywords="9th class mcqs, class 9 MCQs Pakistan, matric part 1 MCQs, 9th class biology chemistry physics"
    />
    <ExamPageSchema
      name="9th Class MCQs — Matric Part 1"
      description="Free 9th class (Matric Part 1) MCQs for all Pakistani boards covering Biology, Chemistry, Physics, Math, English and more."
      url="https://mcqsai.com/9th-class-mcqs"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: "9th Class MCQs", url: "https://mcqsai.com/9th-class-mcqs" },
      ]}
      faqs={[
        { question: "Are 9th class MCQs free here?", answer: "Yes, all 9th class MCQs on MCQsAI are 100% free with instant explanations." },
        { question: "Which boards are covered?", answer: "All Pakistani boards: Punjab, Sindh, Federal, KPK, Balochistan and AJK." },
        { question: "Do MCQs follow the new syllabus?", answer: "Yes, MCQs follow the latest board-aligned syllabus." },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">9th Class MCQs — All Subjects Pakistan</h1>
      <p className="text-muted-foreground mb-2">Complete MCQ practice for Class 9 — all subjects, all Pakistani boards (Sindh, Punjab, Federal, KPK).</p>
      <p className="text-sm text-purple-600 font-medium mb-8">140+ students search for this every month!</p>



      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-green-700">Biology — Class 9</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Introduction to Biology" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Introduction to Biology</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Solving a Biological Problem" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Solving a Biological Problem</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Biodiversity" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Biodiversity</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Cells" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Cells</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Cell Cycle" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Cell Cycle</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Enzymes" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Enzymes</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Bioenergetics" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Bioenergetics</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Nutrition" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Nutrition</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Transport" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Transport</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Gaseous Exchange" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Gaseous Exchange</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Homeostasis" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Homeostasis</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
          <Link key="Support & Movement" to="/boards" className="p-3 border rounded-lg hover:bg-green-50 text-center">
            <p className="text-sm font-medium">Support & Movement</p>
            <p className="text-xs text-green-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-blue-700">Chemistry — Class 9</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Introduction to Chemistry" to="/boards" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Introduction to Chemistry</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Structure of Atoms" to="/boards" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Structure of Atoms</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Periodic Table" to="/boards" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Periodic Table</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Structure of Molecules" to="/boards" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Structure of Molecules</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Physical States of Matter" to="/boards" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Physical States of Matter</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Solutions" to="/boards" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Solutions</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Electrochemistry" to="/boards" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Electrochemistry</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
          <Link key="Chemical Reactivity" to="/boards" className="p-3 border rounded-lg hover:bg-blue-50 text-center">
            <p className="text-sm font-medium">Chemical Reactivity</p>
            <p className="text-xs text-blue-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-purple-700">Physics — Class 9</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Physical Quantities" to="/boards" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Physical Quantities</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Kinematics" to="/boards" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Kinematics</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Dynamics" to="/boards" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Dynamics</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Turning Effect" to="/boards" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Turning Effect</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Gravitation" to="/boards" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Gravitation</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Work & Energy" to="/boards" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Work & Energy</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Properties of Matter" to="/boards" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Properties of Matter</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Thermal Properties" to="/boards" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Thermal Properties</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
          <Link key="Transfer of Heat" to="/boards" className="p-3 border rounded-lg hover:bg-purple-50 text-center">
            <p className="text-sm font-medium">Transfer of Heat</p>
            <p className="text-xs text-purple-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-orange-700">Mathematics — Class 9</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="Matrices" to="/boards" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Matrices</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Real Numbers" to="/boards" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Real Numbers</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Logarithms" to="/boards" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Logarithms</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Algebraic Expressions" to="/boards" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Algebraic Expressions</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Factorization" to="/boards" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Factorization</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Algebraic Manipulation" to="/boards" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Algebraic Manipulation</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Linear Equations" to="/boards" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Linear Equations</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Linear Inequalities" to="/boards" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Linear Inequalities</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Trigonometry" to="/boards" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Trigonometry</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
          <Link key="Congruent Triangles" to="/boards" className="p-3 border rounded-lg hover:bg-orange-50 text-center">
            <p className="text-sm font-medium">Congruent Triangles</p>
            <p className="text-xs text-orange-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-pink-700">English & Other Subjects — Class 9</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link key="English Grammar" to="/boards" className="p-3 border rounded-lg hover:bg-pink-50 text-center">
            <p className="text-sm font-medium">English Grammar</p>
            <p className="text-xs text-pink-600 mt-1">Practice →</p>
          </Link>
          <Link key="Comprehension" to="/boards" className="p-3 border rounded-lg hover:bg-pink-50 text-center">
            <p className="text-sm font-medium">Comprehension</p>
            <p className="text-xs text-pink-600 mt-1">Practice →</p>
          </Link>
          <Link key="Urdu" to="/boards" className="p-3 border rounded-lg hover:bg-pink-50 text-center">
            <p className="text-sm font-medium">Urdu</p>
            <p className="text-xs text-pink-600 mt-1">Practice →</p>
          </Link>
          <Link key="Pakistan Studies" to="/boards" className="p-3 border rounded-lg hover:bg-pink-50 text-center">
            <p className="text-sm font-medium">Pakistan Studies</p>
            <p className="text-xs text-pink-600 mt-1">Practice →</p>
          </Link>
          <Link key="Islamiyat" to="/boards" className="p-3 border rounded-lg hover:bg-pink-50 text-center">
            <p className="text-sm font-medium">Islamiyat</p>
            <p className="text-xs text-pink-600 mt-1">Practice →</p>
          </Link>
          <Link key="Computer Science" to="/boards" className="p-3 border rounded-lg hover:bg-pink-50 text-center">
            <p className="text-sm font-medium">Computer Science</p>
            <p className="text-xs text-pink-600 mt-1">Practice →</p>
          </Link>
          <Link key="General Science" to="/boards" className="p-3 border rounded-lg hover:bg-pink-50 text-center">
            <p className="text-sm font-medium">General Science</p>
            <p className="text-xs text-pink-600 mt-1">Practice →</p>
          </Link>
          <Link key="Home Economics" to="/boards" className="p-3 border rounded-lg hover:bg-pink-50 text-center">
            <p className="text-sm font-medium">Home Economics</p>
            <p className="text-xs text-pink-600 mt-1">Practice →</p>
          </Link>
        </div>
      </section>



      <div className="bg-gradient-to-r from-green-600 to-purple-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Practice 9th Class MCQs Free</h2>
        <p className="opacity-90 mb-4">AI-generated MCQs for all 9th class subjects. Instant feedback. No signup needed.</p>
        <Link to="/boards" className="bg-white text-green-700 px-8 py-3 rounded-full font-semibold inline-block">
          Start Practice →
        </Link>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '10th Class MCQs', url: '/board-mcqs' },
            { label: 'Matric Past Papers', url: '/exams/matric' },
            { label: 'FSc Pre-Medical', url: '/exams/fsc-pre-medical' },
            { label: 'FSc Pre-Engineering', url: '/exams/fsc-pre-engineering' },
            { label: 'Biology MCQs', url: '/boards' },
            { label: 'Chemistry MCQs', url: '/boards' }
          ].map(link => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-purple-50 text-purple-700">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <RelatedContent entitySlug="9th-class-mcqs" title="Continue Preparing" />
    </div>
  </>
);

export default NinthClassMCQs;
