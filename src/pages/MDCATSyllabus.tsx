import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';

/** Official rescheduled MDCAT 2026 test date (PM&DC notice + STS press release). */
const MDCAT_DATE = new Date('2026-09-20T00:00:00+05:00');

const daysUntilMdcat = () => {
  const now = new Date();
  const diff = Math.ceil((MDCAT_DATE.getTime() - now.getTime()) / 86400000);
  return diff;
};

/** PM&DC national MDCAT pattern — 200 MCQs total. */
const WEIGHTAGE = [
  { subject: 'Biology', mcqs: 68, pct: '34%', time: '~34 min' },
  { subject: 'Chemistry', mcqs: 54, pct: '27%', time: '~27 min' },
  { subject: 'Physics', mcqs: 54, pct: '27%', time: '~27 min' },
  { subject: 'English', mcqs: 18, pct: '9%', time: '~9 min' },
  { subject: 'Logical Reasoning', mcqs: 6, pct: '3%', time: '~3 min' },
];

const MDCATSyllabus = () => {
  const daysLeft = daysUntilMdcat();

  return (
    <>
      <SEOHead
        title="MDCAT Syllabus 2026 Pakistan | Complete Guide | MCQsAI"
        description="Complete MDCAT 2026 syllabus for Pakistan. Biology, Chemistry, Physics, English topics with free MCQ practice. PMC official syllabus breakdown."
        keywords="MDCAT syllabus 2026, MDCAT topics, PMC MDCAT syllabus, MDCAT preparation Pakistan, MDCAT biology chemistry physics"
      />
    <ExamPageSchema
      name="MDCAT Syllabus 2026 — Complete Guide"
      description="Complete MDCAT 2026 syllabus with chapter-wise breakdown for Biology, Chemistry, Physics and English."
      url="https://mcqsai.com/mdcat-syllabus"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: "MDCAT Syllabus 2026", url: "https://mcqsai.com/mdcat-syllabus" },
      ]}
      faqs={[
        { question: "When is MDCAT 2026?", answer: "MDCAT 2026 is scheduled for Sunday, 20 September 2026. It was rescheduled from the original date of 16 August 2026 by PM&DC notice and the STS press release." },
        { question: "Why was MDCAT 2026 rescheduled?", answer: "PM&DC issued a public notice (No. PF-1-C-PM&DC/Notification/2026/1229, dated 6 August 2026) moving MDCAT 2026 from 16 August to Sunday, 20 September 2026; SIBA Testing Services confirmed the new date in press release No. STS/SEC/990/26." },
        { question: "What is in the MDCAT 2026 syllabus?", answer: "MDCAT 2026 covers Biology, Chemistry, Physics, English and Logical Reasoning per PM&DC guidelines." },
        { question: "What is the MDCAT subject weightage?", answer: "The MDCAT paper has 200 MCQs: Biology 68, Chemistry 54, Physics 54, English 18 and Logical Reasoning 6." },
        { question: "Is there negative marking in MDCAT?", answer: "No. MDCAT has no negative marking, so attempt every question — leaving a blank only loses a possible mark." },
        { question: "What are the MDCAT passing marks?", answer: "The minimum qualifying score for MDCAT is 55% (110 out of 200 MCQs) for admission to MBBS and BDS programmes." },
        { question: "Where can I practice MDCAT MCQs?", answer: "Practice topic-wise MDCAT MCQs free on MCQsAI, including past-paper style questions." },
      ]}

    />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">
          MDCAT Syllabus 2026 — Complete Guide
        </h1>
        <p className="text-muted-foreground mb-6">
          Official PMC MDCAT syllabus breakdown with free MCQ practice for each topic.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-yellow-800">
            📅 MDCAT 2026 — Rescheduled Test Date
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            MDCAT 2026 has been rescheduled from 16 August 2026 to{' '}
            <strong>Sunday, 20 September 2026</strong>. Confirmed by PM&amp;DC
            Public Notice No. PF-1-C-PM&amp;DC/Notification/2026/1229 (6 August 2026)
            and the STS press release No. STS/SEC/990/26.
            For admission to LUMHS, DUHS, SMBBMU and other medical universities —
            use the remaining weeks for full-syllabus revision.
          </p>
          <p className="text-xs text-yellow-700 mt-2">
            Source:{' '}
            <a
              href="https://www.iba-suk.edu.pk/sts/announcements"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="underline"
            >
              SIBA Testing Services — official announcements
            </a>
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">
            Biology (80 MCQs — 58%)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Cell Biology', 'Biological Molecules',
              'Enzymes', 'Bioenergetics',
              'Nutrition', 'Gaseous Exchange',
              'Transport', 'Homeostasis',
              'Support & Movement', 'Reproduction',
              'Inheritance', 'Variation & Genetics',
              'Biotechnology', 'Evolution',
              'Ecosystem', 'Biodiversity'
            ].map(topic => (
              <Link
                key={topic}
                to={`/exams/mdcat`}
                className="p-3 border rounded-lg hover:bg-purple-50 flex justify-between items-center"
              >
                <span className="text-sm font-medium">{topic}</span>
                <span className="text-xs text-purple-600">Practice →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">
            Chemistry (54 MCQs — 39%)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Atomic Structure', 'Chemical Bonding',
              'Gases', 'Liquids & Solids',
              'Solutions', 'Electrochemistry',
              'Chemical Kinetics', 'Thermodynamics',
              'Organic Chemistry', 'Biochemistry',
              'Industrial Chemistry', 'Environmental Chemistry'
            ].map(topic => (
              <Link
                key={topic}
                to={`/exams/mdcat`}
                className="p-3 border rounded-lg hover:bg-blue-50 flex justify-between items-center"
              >
                <span className="text-sm font-medium">{topic}</span>
                <span className="text-xs text-blue-600">Practice →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-green-700">
            Physics (38 MCQs — 27%)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Measurements', 'Scalars & Vectors',
              'Motion & Force', 'Work & Energy',
              'Circular Motion', 'Fluid Dynamics',
              'Oscillations', 'Waves',
              'Thermodynamics', 'Electrostatics',
              'Current Electricity', 'Electromagnetism',
              'Atomic Physics', 'Nuclear Physics'
            ].map(topic => (
              <Link
                key={topic}
                to={`/exams/mdcat`}
                className="p-3 border rounded-lg hover:bg-green-50 flex justify-between items-center"
              >
                <span className="text-sm font-medium">{topic}</span>
                <span className="text-xs text-green-600">Practice →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-orange-700">
            English (18 MCQs — 13%)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Vocabulary', 'Grammar',
              'Reading Comprehension', 'Sentence Correction',
              'Fill in the blanks', 'Synonyms & Antonyms'
            ].map(topic => (
              <Link
                key={topic}
                to={`/exams/mdcat`}
                className="p-3 border rounded-lg hover:bg-orange-50 flex justify-between items-center"
              >
                <span className="text-sm font-medium">{topic}</span>
                <span className="text-xs text-orange-600">Practice →</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white text-center mt-8">
          <h2 className="text-2xl font-bold mb-2">
            Start MDCAT Practice Free
          </h2>
          <p className="opacity-90 mb-4">
            AI-generated MCQs for every topic in the syllabus. Instant feedback. No signup needed.
          </p>
          <Link
            to="/exams/mdcat"
            className="bg-white text-purple-700 px-8 py-3 rounded-full font-semibold hover:bg-purple-50 inline-block"
          >
            Practice MDCAT MCQs →
          </Link>
        </div>

        <div className="mt-8 p-6 bg-gray-50 rounded-xl">
          <h2 className="font-semibold mb-3">Related Resources</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'MDCAT Aggregate Calculator', url: '/tools/aggregate-calculator' },
              { label: 'ECAT Syllabus', url: '/exams/ecat' },

              { label: 'FSc Pre-Medical MCQs', url: '/exams/fsc-pre-medical' },
              { label: 'Biology MCQs', url: '/subjects' },
              { label: 'Chemistry MCQs', url: '/subjects' },
              { label: 'Physics MCQs', url: '/subjects' },
              { label: 'NUMS Preparation', url: '/exams/nums' },
            ].map(link => (
              <Link
                key={link.url}
                to={link.url}
                className="px-4 py-2 bg-white border rounded-full text-sm hover:bg-purple-50 text-purple-700"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <RelatedContent entitySlug="mdcat-syllabus" title="Continue Preparing" />
      </div>
    </>
  );
};

export default MDCATSyllabus;
