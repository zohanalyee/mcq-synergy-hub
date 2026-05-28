import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';
import { ExamQuickTestCTA } from '@/components/quick-test/ExamQuickTestCTA';
import { SeoSectionGrid } from '@/components/quick-test/SeoSectionGrid';

const EXAM_NAME = '9th Class (Matric Part 1)';
const RETURN_PATH = '/9th-class-mcqs';

const sections = [
  { title: 'Biology — Class 9', accent: 'text-green-700', subject: 'Biology', topics: ['Introduction to Biology', 'Solving a Biological Problem', 'Biodiversity', 'Cells', 'Cell Cycle', 'Enzymes', 'Bioenergetics', 'Nutrition', 'Transport', 'Gaseous Exchange', 'Homeostasis', 'Support & Movement'] },
  { title: 'Chemistry — Class 9', accent: 'text-blue-700', subject: 'Chemistry', topics: ['Introduction to Chemistry', 'Structure of Atoms', 'Periodic Table', 'Structure of Molecules', 'Physical States of Matter', 'Solutions', 'Electrochemistry', 'Chemical Reactivity'] },
  { title: 'Physics — Class 9', accent: 'text-purple-700', subject: 'Physics', topics: ['Physical Quantities', 'Kinematics', 'Dynamics', 'Turning Effect', 'Gravitation', 'Work & Energy', 'Properties of Matter', 'Thermal Properties', 'Transfer of Heat'] },
  { title: 'Mathematics — Class 9', accent: 'text-orange-700', subject: 'Mathematics', topics: ['Matrices', 'Real Numbers', 'Logarithms', 'Algebraic Expressions', 'Factorization', 'Algebraic Manipulation', 'Linear Equations', 'Linear Inequalities', 'Trigonometry', 'Congruent Triangles'] },
  { title: 'English & Other Subjects — Class 9', accent: 'text-pink-700', subject: 'English & Others', topics: ['English Grammar', 'Comprehension', 'Urdu', 'Pakistan Studies', 'Islamiyat', 'Computer Science', 'General Science', 'Home Economics'] },
];

const ALL_SUBJECTS = sections.map((s) => s.subject);

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
        { name: '9th Class MCQs', url: 'https://mcqsai.com/9th-class-mcqs' },
      ]}
      faqs={[
        { question: 'Are 9th class MCQs free here?', answer: 'Yes, all 9th class MCQs on MCQsAI are 100% free with instant explanations.' },
        { question: 'Which boards are covered?', answer: 'All Pakistani boards: Punjab, Sindh, Federal, KPK, Balochistan and AJK.' },
        { question: 'Do MCQs follow the new syllabus?', answer: 'Yes, MCQs follow the latest board-aligned syllabus.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">9th Class MCQs — All Subjects Pakistan</h1>
      <p className="text-muted-foreground mb-2">Complete MCQ practice for Class 9 — all subjects, all Pakistani boards (Sindh, Punjab, Federal, KPK).</p>
      <p className="text-sm text-purple-600 font-medium mb-6">140+ students search for this every month!</p>

      <div className="mb-10 flex flex-wrap gap-3">
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} returnPath={RETURN_PATH} />
        <Link to="/custom-syllabus" className="inline-flex items-center px-4 py-2 rounded-md border text-sm hover:bg-muted">Build a custom syllabus</Link>
      </div>

      {sections.map((s) => (
        <SeoSectionGrid key={s.title} {...s} examName={EXAM_NAME} returnPath={RETURN_PATH} />
      ))}

      <div className="bg-gradient-to-r from-green-600 to-purple-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Practice 9th Class MCQs Free</h2>
        <p className="opacity-90 mb-4">AI-generated MCQs for all 9th class subjects. Instant feedback. No signup needed.</p>
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} variant="hero" label="Start Practice →" returnPath={RETURN_PATH} />
      </div>

      <div className="mt-8 p-6 bg-muted/40 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '10th Class MCQs', url: '/board-mcqs' },
            { label: 'Matric Past Papers', url: '/exams/matric' },
            { label: 'FSc Pre-Medical', url: '/exams/fsc-pre-medical' },
            { label: 'FSc Pre-Engineering', url: '/exams/fsc-pre-engineering' },
            { label: 'Biology MCQs', url: '/boards' },
            { label: 'Chemistry MCQs', url: '/boards' },
          ].map((link) => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-background border rounded-full text-sm hover:bg-primary/5 text-primary">
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
