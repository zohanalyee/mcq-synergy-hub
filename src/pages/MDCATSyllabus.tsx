import SEOHead from '@/components/SEOHead';
import { ExamPageSchema } from '@/components/StructuredData';
import RelatedContent from '@/components/seo/related/RelatedContent';
import { Link } from 'react-router-dom';

const MDCATSyllabus = () => {
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
      url="https://mcqsai.com/mdcat-syllabus-2026"
      breadcrumbs={[
        { name: 'Home', url: 'https://mcqsai.com/' },
        { name: "MDCAT Syllabus 2026", url: "https://mcqsai.com/mdcat-syllabus-2026" },
      ]}
      faqs={[
        { question: "What is in the MDCAT 2026 syllabus?", answer: "MDCAT 2026 covers Biology, Chemistry, Physics, English and Logical Reasoning per PMC guidelines." },
        { question: "Is the MDCAT 2026 syllabus changed?", answer: "PMC reviews the syllabus annually; check the official notification for any changes." },
        { question: "Where can I practice MDCAT MCQs?", answer: "Practice topic-wise MDCAT MCQs free on MCQsAI." },
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
            📅 MDCAT Sindh 2026 — Important Date
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            MDCAT Sindh 2026 will be conducted on{' '}
            <strong>August 16, 2026</strong> by{' '}
            <strong>STS (Sindh Testing Service)</strong>.
            For admission to LUMHS, DUHS, SMBBMU and other Sindh medical universities.
            Start preparation now — only 3 months left!
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
        <RelatedContent entitySlug="mdcat-syllabus-2026" title="Continue Preparing" />
      </div>
    </>
  );
};

export default MDCATSyllabus;
