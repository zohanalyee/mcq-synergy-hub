import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';

const sections = [
  { subject: 'Intelligence & IQ', color: 'green', topics: ['Verbal Intelligence', 'Non-Verbal Intelligence', 'Analytical Reasoning', 'Logical Reasoning', 'Pattern Recognition', 'Mathematical Reasoning', 'Spatial Reasoning', 'Memory Test'] },
  { subject: 'General Knowledge', color: 'blue', topics: ['Pakistan Studies', 'Pakistan Army History', 'Current Affairs', 'Islamic Studies', 'World Affairs', 'Geography', 'Science & Tech', 'Sports'] },
  { subject: 'Mathematics', color: 'purple', topics: ['Arithmetic', 'Algebra', 'Geometry', 'Percentage', 'Ratio & Proportion', 'Time & Work', 'Speed & Distance', 'Statistics'] },
  { subject: 'English', color: 'orange', topics: ['Grammar', 'Vocabulary', 'Comprehension', 'Sentence Correction', 'Synonyms & Antonyms', 'Fill in the Blanks'] },
];

const colorMap: Record<string, { head: string; hover: string; text: string }> = {
  green: { head: 'text-green-700', hover: 'hover:bg-green-50', text: 'text-green-600' },
  blue: { head: 'text-blue-700', hover: 'hover:bg-blue-50', text: 'text-blue-600' },
  purple: { head: 'text-purple-700', hover: 'hover:bg-purple-50', text: 'text-purple-600' },
  orange: { head: 'text-orange-700', hover: 'hover:bg-orange-50', text: 'text-orange-600' },
};

const programs = [
  { name: 'PMA Long Course', detail: 'Officer — ISSB + Academic Test' },
  { name: 'Direct Short Service', detail: 'Officer — Graduate entry' },
  { name: 'Soldier/Sepoy', detail: 'Matric level — Written + Physical' },
  { name: 'Technical Cadet', detail: 'Engineering — NUST based' },
  { name: 'Lady Cadet Course', detail: 'Female Officers — ISSB' },
  { name: 'Army Medical Corps', detail: 'MBBS — AMC entry test' },
];

const related = [
  { label: 'PAF Test Preparation', url: '/paf-test' },
  { label: 'Navy Test Preparation', url: '/forces-jobs-tests' },
  { label: 'ASF Test Preparation', url: '/asf-test' },
  { label: 'ISSB Preparation', url: '/forces-jobs-tests' },
  { label: 'General Knowledge MCQs', url: '/exams/nts' },
  { label: 'Intelligence Test MCQs', url: '/subjects' },
];

const PakArmyTest = () => (
  <>
    <SEOHead
      title="Pak Army Test Preparation 2026 | Free MCQs Pakistan | MCQsAI"
      description="Free Pak Army written test, intelligence test and ISSB preparation. Intelligence, GK, Maths, English MCQs for PMA, Soldier, Technical Cadet."
      keywords="Pak Army test, Pakistan Army test preparation, ISSB preparation, PMA test, Pak Army intelligence test"
    />
    <ExamPageSchema
      name="Pak Army Test Preparation"
      description="Free Pak Army written test and intelligence test MCQ practice — covers Intelligence, GK, Maths and English."
      url="https://mcqsai.com/pak-army-test"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: 'Pak Army Test', url: 'https://mcqsai.com/pak-army-test' },
      ]}
      faqs={[
        { question: 'What subjects come in the Pak Army written test?', answer: 'Intelligence (verbal & non-verbal), General Knowledge, Mathematics and English are the four core sections.' },
        { question: 'How can I prepare for the Pak Army intelligence test free?', answer: 'Practice verbal and non-verbal IQ MCQs on MCQsAI with instant feedback — no signup needed.' },
        { question: 'What is ISSB and who appears for it?', answer: 'Inter-Services Selection Board is the officer-selection process for PMA Long Course, Lady Cadet Course and other officer entries.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Pak Army Test Preparation 2026 — Free MCQs Pakistan</h1>
      <p className="text-muted-foreground mb-2">Complete preparation for Pak Army written test, intelligence test and ISSB.</p>
      <p className="text-xs text-muted-foreground mb-8">590+ students search for this every month.</p>

      {sections.map((section) => {
        const c = colorMap[section.color];
        return (
          <section key={section.subject} className="mb-8">
            <h2 className={`text-xl font-semibold mb-3 ${c.head}`}>{section.subject}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {section.topics.map((topic) => (
                <Link key={topic} to={`/custom-syllabus?subject=${encodeURIComponent(section.subject)}&topic=${encodeURIComponent(topic)}`} className={`p-3 border rounded-lg ${c.hover} text-center`}>
                  <p className="text-sm font-medium">{topic}</p>
                  <p className={`text-xs ${c.text} mt-1`}>Practice →</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Pak Army Entry Programs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {programs.map((p) => (
            <div key={p.name} className="p-4 border rounded-lg">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-muted-foreground">{p.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Start Pak Army Test Prep Free</h2>
        <p className="opacity-90 mb-4">AI MCQs for Intelligence, GK, Maths, English. No signup needed.</p>
        <Link to="/exams/nts" className="bg-white text-green-700 px-8 py-3 rounded-full font-semibold inline-block">
          Practice Now →
        </Link>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {related.map((link) => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-green-50 text-green-700">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <RelatedContent entitySlug="pak-army-test" title="Continue Preparing" />
    </div>
  </>
);

export default PakArmyTest;
