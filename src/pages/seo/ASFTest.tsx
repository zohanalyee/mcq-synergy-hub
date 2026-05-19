import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import { Link } from 'react-router-dom';

const sections = [
  { subject: 'Intelligence & IQ', color: 'purple', topics: ['Verbal Intelligence', 'Non-Verbal IQ', 'Logical Reasoning', 'Pattern Recognition', 'Analytical Reasoning', 'Mathematical IQ'] },
  { subject: 'General Knowledge', color: 'blue', topics: ['Pakistan Studies', 'Current Affairs', 'Islamic Studies', 'World Affairs', 'Science GK', 'Geography'] },
  { subject: 'English', color: 'green', topics: ['Grammar', 'Vocabulary', 'Comprehension', 'Sentence Correction', 'Fill in Blanks', 'Synonyms'] },
  { subject: 'Mathematics', color: 'orange', topics: ['Arithmetic', 'Percentage', 'Ratio', 'Algebra', 'Geometry', 'Statistics'] },
];

const colorMap: Record<string, { head: string; hover: string; text: string }> = {
  green: { head: 'text-green-700', hover: 'hover:bg-green-50', text: 'text-green-600' },
  blue: { head: 'text-blue-700', hover: 'hover:bg-blue-50', text: 'text-blue-600' },
  purple: { head: 'text-purple-700', hover: 'hover:bg-purple-50', text: 'text-purple-600' },
  orange: { head: 'text-orange-700', hover: 'hover:bg-orange-50', text: 'text-orange-600' },
};

const related = [
  { label: 'Pak Army Test', url: '/pak-army-test' },
  { label: 'PAF Test', url: '/paf-test' },
  { label: 'Forces Jobs Tests', url: '/forces-jobs-tests' },
  { label: 'FIA Test Prep', url: '/forces-jobs-tests' },
  { label: 'General Knowledge MCQs', url: '/exams/nts' },
];

const ASFTest = () => (
  <>
    <SEOHead
      title="ASF Test Preparation 2026 | Free MCQs Pakistan | MCQsAI"
      description="Free Airport Security Force (ASF) recruitment test preparation. Intelligence, GK, English and Maths MCQs for ASF ASI, Corporal and constable."
      keywords="ASF test preparation, Airport Security Force test, ASF MCQs, ASF ASI test"
    />
    <ExamPageSchema
      name="ASF Test Preparation"
      description="Free ASF recruitment test MCQ practice — Intelligence, GK, English and Maths."
      url="https://mcqsai.com/asf-test"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: 'ASF Test', url: 'https://mcqsai.com/asf-test' },
      ]}
      faqs={[
        { question: 'What is the ASF test pattern?', answer: 'Airport Security Force tests cover Intelligence, GK, English and Mathematics, followed by physical and interview.' },
        { question: 'What is the ASF eligibility?', answer: 'Matric to graduate level depending on the post (Corporal, ASI, etc.); age and physical standards apply.' },
        { question: 'How can I prepare for ASF test free?', answer: 'Practice subject-wise MCQs on MCQsAI with instant feedback — no signup needed.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">ASF Test Preparation 2026 — Free MCQs Pakistan</h1>
      <p className="text-muted-foreground mb-2">Airport Security Force recruitment test complete preparation guide.</p>
      <p className="text-xs text-muted-foreground mb-8">390+ students search for this every month.</p>

      {sections.map((section) => {
        const c = colorMap[section.color];
        return (
          <section key={section.subject} className="mb-8">
            <h2 className={`text-xl font-semibold mb-3 ${c.head}`}>{section.subject}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {section.topics.map((topic) => (
                <Link key={topic} to="/exams/nts" className={`p-3 border rounded-lg ${c.hover} text-center`}>
                  <p className="text-sm font-medium">{topic}</p>
                  <p className={`text-xs ${c.text} mt-1`}>Practice →</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start ASF Test Prep Free</h2>
        <p className="opacity-90 mb-4">AI MCQs for Intelligence, GK, English, Maths. No signup needed.</p>
        <Link to="/exams/nts" className="bg-white text-purple-700 px-8 py-3 rounded-full font-semibold inline-block">
          Practice Now →
        </Link>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {related.map((link) => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-purple-50 text-purple-700">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  </>
);

export default ASFTest;
