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

        {daysLeft > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-8">
            <p className="text-sm font-semibold text-purple-800">
              ⏳ MDCAT 2026 in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
            </p>
            <p className="text-sm text-purple-700 mt-1">
              Test day is Sunday, 20 September 2026. With {daysLeft}{' '}
              {daysLeft === 1 ? 'day' : 'days'} left, split your time by paper weightage below:
              Biology first (68 MCQs), then Chemistry and Physics (54 each), and keep the last
              week for full-length mocks and revision of wrong answers.
            </p>
          </div>
        )}

        <section id="mdcat-weightage" className="mb-8 scroll-mt-24">
          <h2 className="text-xl font-semibold mb-2">MDCAT 2026 Subject Weightage (200 MCQs)</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The MDCAT paper carries 200 MCQs in 210 minutes. Use this distribution to allocate
            study time — Biology alone is roughly one third of the paper, so it deserves the
            largest share of your revision hours.
          </p>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">Subject</th>
                  <th className="text-left px-3 py-2 font-semibold">MCQs</th>
                  <th className="text-left px-3 py-2 font-semibold">Share of paper</th>
                  <th className="text-left px-3 py-2 font-semibold">Suggested time</th>
                </tr>
              </thead>
              <tbody>
                {WEIGHTAGE.map((w) => (
                  <tr key={w.subject} className="border-t">
                    <td className="px-3 py-2 font-medium">{w.subject}</td>
                    <td className="px-3 py-2">{w.mcqs}</td>
                    <td className="px-3 py-2">{w.pct}</td>
                    <td className="px-3 py-2 text-muted-foreground">{w.time}</td>
                  </tr>
                ))}
                <tr className="border-t bg-muted/30 font-semibold">
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2">200</td>
                  <td className="px-3 py-2">100%</td>
                  <td className="px-3 py-2">210 min</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            There is no negative marking in MDCAT and the qualifying score is 55% (110/200), so
            attempt every question. See{' '}
            <Link to="/mdcat-past-papers" className="text-purple-700 underline">
              MDCAT past papers and paper pattern
            </Link>{' '}
            for the question style, and{' '}
            <Link to="/tools/aggregate-calculator" className="text-purple-700 underline">
              calculate your MDCAT aggregate
            </Link>{' '}
            to know the score you need.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Last 4 Weeks — MDCAT Study Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                week: 'Week 1 — Full syllabus sweep',
                body: 'One fast pass over every chapter below. Mark each topic as strong / shaky / untouched. Do 30 mixed MCQs daily to surface gaps.',
              },
              {
                week: 'Week 2 — Weak-chapter drilling',
                body: 'Only the “shaky” and “untouched” topics. Biology first (68 MCQs in the paper), then Chemistry and Physics. 50 topic-wise MCQs daily with explanations.',
              },
              {
                week: 'Week 3 — Full-length mocks',
                body: 'Two or three 200-MCQ timed mocks in 210 minutes. After each mock, re-do every wrong question and its whole chapter the same day.',
              },
              {
                week: 'Week 4 — Revision and speed',
                body: 'Formulas, diagrams, English vocabulary and Logical Reasoning practice. Short 20-minute sprints, no new topics. Sleep and paper-day logistics sorted before 20 September.',
              },
            ].map((w) => (
              <div key={w.week} className="p-4 border rounded-lg">
                <h3 className="text-sm font-semibold mb-1">{w.week}</h3>
                <p className="text-sm text-muted-foreground">{w.body}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Practising in exam conditions matters more than re-reading notes — start a{' '}
            <Link to="/exams/mdcat" className="text-purple-700 underline">
              free MDCAT mock test
            </Link>{' '}
            or revise{' '}
            <Link to="/exams/fsc-pre-medical" className="text-purple-700 underline">
              FSc Pre-Medical MCQs
            </Link>{' '}
            chapter by chapter.
          </p>
        </section>



        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-purple-700">
            Biology (68 MCQs — 34%)
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
            Chemistry (54 MCQs — 27%)
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
            Physics (54 MCQs — 27%)
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
            English (18 MCQs — 9%)
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

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-teal-700">
            Logical Reasoning (6 MCQs — 3%)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Critical Thinking', 'Letter & Symbol Series',
              'Logical Deduction', 'Cause & Effect',
              'Course of Action', 'Logical Problems',
            ].map(topic => (
              <Link
                key={topic}
                to={`/exams/mdcat`}
                className="p-3 border rounded-lg hover:bg-teal-50 flex justify-between items-center"
              >
                <span className="text-sm font-medium">{topic}</span>
                <span className="text-xs text-teal-600">Practice →</span>
              </Link>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Only 6 MCQs, but they are quick marks — see how they appeared in{' '}
            <Link to="/mdcat-past-papers" className="text-purple-700 underline">
              previous MDCAT papers
            </Link>
            .
          </p>
        </section>

        <MdcatContextualLinks />

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
                key={link.label}

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
