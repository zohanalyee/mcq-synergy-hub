import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import { Link } from 'react-router-dom';

const forces = [
  { name: 'Pakistan Navy', detail: 'Intelligence + Maths + Physics + English', monthly: '320/mo' },
  { name: 'Rangers (Punjab/Sindh)', detail: 'Intelligence + GK + English + Physical', monthly: '70/mo' },
  { name: 'FIA', detail: 'GK + Current Affairs + Computer + English', monthly: '30/mo' },
  { name: 'Police (Provincial)', detail: 'GK + Pakistan Studies + English + IQ', monthly: '10/mo' },
  { name: 'WAPDA', detail: 'Technical + GK + English + Maths', monthly: '50/mo' },
  { name: 'PIA', detail: 'English + GK + Technical + IQ', monthly: '30/mo' },
  { name: 'ANF', detail: 'Intelligence + GK + English + Physical', monthly: '' },
  { name: 'NAB', detail: 'Law + GK + English + Current Affairs', monthly: '' },
];

const sections = [
  { subject: 'Intelligence Test (All Forces)', color: 'purple', topics: ['Verbal IQ', 'Non-Verbal IQ', 'Logical Reasoning', 'Pattern Recognition', 'Analytical Reasoning', 'Mathematical IQ'] },
  { subject: 'General Knowledge', color: 'blue', topics: ['Pakistan Studies', 'Current Affairs', 'Islamic Studies', 'World Affairs', 'Geography', 'Science'] },
  { subject: 'English', color: 'green', topics: ['Grammar', 'Vocabulary', 'Comprehension', 'Sentence Correction', 'Fill in Blanks', 'Synonyms'] },
  { subject: 'Mathematics', color: 'orange', topics: ['Arithmetic', 'Percentage', 'Ratio', 'Algebra', 'Statistics', 'Geometry'] },
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
  { label: 'ASF Test', url: '/asf-test' },
  { label: 'FPSC Past Papers', url: '/fpsc-past-papers' },
  { label: 'PPSC Past Papers', url: '/ppsc-past-papers' },
  { label: 'General Knowledge MCQs', url: '/exams/nts' },
];

const ForcesJobsTests = () => (
  <>
    <SEOHead
      title="Pakistan Forces & Government Jobs Tests 2026 | Free MCQs | MCQsAI"
      description="Free preparation for Pakistan Navy, Rangers, FIA, Police, WAPDA, PIA, ANF and NAB recruitment tests. Intelligence, GK, English and Maths MCQs."
      keywords="Pakistan Navy test, Rangers test, FIA test preparation, Police Pakistan test, WAPDA test, PIA test"
    />
    <ExamPageSchema
      name="Pakistan Forces & Government Jobs Tests"
      description="Free MCQ practice for Navy, Rangers, FIA, Police, WAPDA, PIA and other Pakistan government forces recruitment tests."
      url="https://mcqsai.com/forces-jobs-tests"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: 'Forces & Jobs Tests', url: 'https://mcqsai.com/forces-jobs-tests' },
      ]}
      faqs={[
        { question: 'Which forces tests does this cover?', answer: 'Pakistan Navy, Rangers, FIA, Police, WAPDA, PIA, ANF and NAB recruitment tests.' },
        { question: 'What is the common syllabus for forces tests?', answer: 'Intelligence, General Knowledge, English and Mathematics are common across most Pakistan forces and government jobs tests.' },
        { question: 'How can I prepare for forces tests online free?', answer: 'Practice subject-wise MCQs on MCQsAI free with instant feedback and explanations.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Pakistan Forces & Government Jobs Tests 2026</h1>
      <p className="text-muted-foreground mb-8">Complete preparation for Navy, Rangers, FIA, Police, WAPDA, PIA and all government forces recruitment tests.</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Forces & Jobs Covered</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {forces.map((f) => (
            <div key={f.name} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{f.name}</p>
                {f.monthly && <span className="text-xs text-muted-foreground">{f.monthly}</span>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{f.detail}</p>
            </div>
          ))}
        </div>
      </section>

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

      <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start Forces Test Prep Free</h2>
        <p className="opacity-90 mb-4">AI MCQs for all Pakistan forces recruitment tests. No signup needed.</p>
        <Link to="/exams/nts" className="bg-white text-slate-800 px-8 py-3 rounded-full font-semibold inline-block">
          Practice Now →
        </Link>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {related.map((link) => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-slate-100 text-slate-800">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  </>
);

export default ForcesJobsTests;
