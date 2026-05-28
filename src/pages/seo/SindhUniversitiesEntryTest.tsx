import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';
import { ExamQuickTestCTA } from '@/components/quick-test/ExamQuickTestCTA';
import { SeoSectionGrid } from '@/components/quick-test/SeoSectionGrid';

const EXAM_NAME = 'Sindh Universities Entry Test';
const RETURN_PATH = '/sindh-universities-entry-test';

const universities = [
  { name: 'IBA Sukkur', detail: 'Business, CS, Engineering — Aptitude Test' },
  { name: 'MUET Jamshoro', detail: 'Engineering — Math, Physics, Chemistry' },
  { name: 'LUMHS Jamshoro', detail: 'Medical — Biology, Chemistry, Physics' },
  { name: 'University of Sindh', detail: 'All Faculties — GK, English, Subject' },
  { name: 'Mehran UET', detail: 'Engineering — Math, Physics, Chemistry' },
  { name: 'QUEST Nawabshah', detail: 'Engineering & Technology' },
  { name: 'SALU Khairpur', detail: 'Arts, Science, Commerce' },
  { name: 'SZABIST Karachi', detail: 'Business, CS, Media Sciences' },
];

const sections = [
  { title: 'Mathematics', accent: 'text-purple-700', subject: 'Mathematics', topics: ['Algebra', 'Calculus', 'Trigonometry', 'Statistics', 'Geometry', 'Matrices'] },
  { title: 'English & Aptitude', accent: 'text-blue-700', subject: 'English & Aptitude', topics: ['Grammar', 'Vocabulary', 'Comprehension', 'Analytical Reasoning', 'IQ', 'Logical Reasoning'] },
  { title: 'Science Subjects', accent: 'text-green-700', subject: 'Sciences', topics: ['Biology', 'Chemistry', 'Physics', 'Computer Science', 'Statistics', 'Environmental Science'] },
  { title: 'General Knowledge', accent: 'text-orange-700', subject: 'General Knowledge', topics: ['Pakistan Studies', 'Sindh Studies', 'Current Affairs', 'Islamic Studies', 'World GK', 'Science GK'] },
];

const ALL_SUBJECTS = sections.map((s) => s.subject);

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
        { name: 'Sindh Universities Entry Test', url: 'https://mcqsai.com/sindh-universities-entry-test' },
      ]}
      faqs={[
        { question: 'Which Sindh universities does this cover?', answer: 'Coverage includes IBA Sukkur, MUET Jamshoro, LUMHS, University of Sindh and Mehran University.' },
        { question: 'Is Sindh universities entry test online?', answer: 'Most Sindh public universities now offer online and on-campus admission tests.' },
        { question: 'What is the test syllabus?', answer: 'Typically English, Math, Physics, Chemistry and Biology — varies by program.' },
      ]}
    />
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Sindh Universities Entry Test 2026 — Free Preparation</h1>
      <p className="text-muted-foreground mb-6">Complete preparation for IBA Sukkur, MUET, LUMHS, University of Sindh, Mehran UET and all Sindh universities.</p>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold text-yellow-800">📅 MDCAT Sindh 2026 — Important Date</p>
        <p className="text-sm text-yellow-700 mt-1">
          MDCAT Sindh 2026 will be conducted on <strong>August 16, 2026</strong> by <strong>STS (Sindh Testing Service)</strong>.
          For admission to LUMHS, DUHS, SMBBMU and other Sindh medical universities. Start preparation now — only 3 months left!
        </p>
      </div>

      <div className="mb-10 flex flex-wrap gap-3">
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} returnPath={RETURN_PATH} />
        <Link to="/custom-syllabus" className="inline-flex items-center px-4 py-2 rounded-md border text-sm hover:bg-muted">Build a custom syllabus</Link>
      </div>

      <section className="mb-8 p-6 bg-orange-50 rounded-xl">
        <h2 className="text-lg font-semibold mb-4">Sindh Universities Covered</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {universities.map((uni) => (
            <div key={uni.name} className="p-3 bg-white border rounded-lg">
              <p className="font-medium text-sm">{uni.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{uni.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {sections.map((s) => (
        <SeoSectionGrid key={s.title} {...s} examName={EXAM_NAME} returnPath={RETURN_PATH} />
      ))}

      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Sindh Universities Test Practice — Free</h2>
        <p className="opacity-90 mb-4">AI MCQs for all Sindh universities. Available in English and Sindhi. No signup needed.</p>
        <ExamQuickTestCTA examName={EXAM_NAME} subjects={ALL_SUBJECTS} variant="hero" label="Practice Now →" returnPath={RETURN_PATH} />
      </div>

      <div className="mt-8 p-6 bg-muted/40 rounded-xl">
        <h2 className="font-semibold mb-3">Related Resources</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'IBA Sukkur Preparation', url: '/exams/nts' },
            { label: 'SPSC Test Prep', url: '/exams/spsc' },
            { label: 'Sindh Board MCQs', url: '/boards' },
            { label: 'MDCAT Preparation', url: '/exams/mdcat' },
            { label: 'Engineering Entry Tests', url: '/engineering-universities-entry-test' },
          ].map((link) => (
            <Link key={link.url} to={link.url} className="px-4 py-2 bg-background border rounded-full text-sm hover:bg-primary/5 text-primary">
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
