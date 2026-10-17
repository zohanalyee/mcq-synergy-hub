import AdmissionTestPage from './AdmissionTestPage';

/**
 * Sukkur IBA Sindh Talent Hunt Program (STHP) 2027 guide.
 * Verified facts only, read from iba-suk.edu.pk official announcements on
 * 15 October 2026. Anything the official notice does not state is shown as
 * "Check the official announcement" — never guessed.
 * Live facts come from the exam_pages row (slug "sthp"); these props are the fallback.
 */
const SthpGuide = () => (
  <AdmissionTestPage
    slug="sthp"
    name="Sukkur IBA Sindh Talent Hunt Program (STHP) 2027"
    h1="Sukkur IBA Sindh Talent Hunt Program (STHP) 2027 Guide"
    fullName="Sukkur IBA University's Sindh Talent Hunt Program — Foundation Semester route for Sindh students"
    metaTitle="Sukkur IBA STHP 2027 – Syllabus, Dates, Past Papers & Free Mock Test | MCQsAI"
    metaDescription="Sukkur IBA STHP 2027: apply by 29 Oct 2026, test on 8 Nov 2026. English, Mathematics and ICT syllabus, sample paper and free timed mock test."
    keywords="STHP 2027, Sukkur IBA Sindh Talent Hunt Program, STHP test date, STHP eligibility, STHP mock test, Sukkur IBA scholarship"
    intro="The Sindh Talent Hunt Program (STHP) is run by Sukkur IBA University to find talented students from across Sindh and bring them into a Foundation Semester at the Sukkur IBA Main Campus. Candidates apply online, sit an admission test, and selected students join the Foundation Semester covering English, Mathematics and ICT. Everything on this page is taken from the official Sukkur IBA admissions announcement; where the notice does not state something, this page says so instead of guessing."
    examBody="Sukkur IBA University (testing by SIBA Testing Services, STS)"
    duration="Check the official announcement"
    totalMarks="Check the official announcement"
    frequency="Annual talent hunt cycle"
    testDate="8 November 2026"
    subjects={['English', 'Mathematics', 'ICT (Information & Communication Technology)']}
    pattern={[
      { section: 'English', detail: 'MCQsAI practice pattern, not official', weight: '40%' },
      { section: 'Mathematics', detail: 'MCQsAI practice pattern, not official', weight: '40%' },
      { section: 'ICT', detail: 'MCQsAI practice pattern, not official', weight: '20%' },
    ]}
    patternNote="This weightage is the pattern used by our own free MCQsAI mock test so you can practise in a timed, exam-style format. It is a practice pattern, not an official Sukkur IBA breakdown. The official announcement does not publish a section-wise weightage, MCQ count, negative marking or passing marks — check the official sources below before relying on any figure."
    eligibility={[
      'Sindh domicile is required.',
      'Intermediate or equivalent passed in 2024, 2025 or 2026.',
      'Application fee, test centres, minimum marks percentage, negative marking and passing marks: check the official announcement.',
    ]}
    keyDates={[
      { event: 'Last date to apply', value: '29 October 2026' },
      { event: 'Admission test', value: '8 November 2026' },
      { event: 'Application fee', value: 'Check the official announcement' },
      { event: 'Test centres', value: 'Check the official announcement' },
    ]}
    tips={[
      '200 students are selected for the Foundation Semester, which covers English, Mathematics and ICT — the same three areas the test focuses on.',
      'The top 100 students who maintain a minimum 2.2 CGPA in the Foundation Semester receive the scholarship at Sukkur IBA Main Campus.',
      'Apply early on the official admission portal; the last date to apply is 29 October 2026.',
      'Practise English and Mathematics daily with timed MCQ sets — both carry the largest share of our practice pattern.',
      'Keep basic ICT concepts (computer fundamentals, MS Office, internet basics) revised alongside English and Maths.',
      'Take the free MCQsAI STHP mock test under a real countdown so test-day timing does not surprise you.',
      'Read the official announcement yourself for fee, centres and any rule this page marks as "check the official announcement".',
    ]}
    faqs={[
      {
        question: 'What is the last date to apply for STHP 2027?',
        answer: 'The last date to apply is 29 October 2026, through the official Sukkur IBA admission portal.',
      },
      {
        question: 'When is the STHP 2027 admission test?',
        answer: 'The admission test is on 8 November 2026 as stated in the official Sukkur IBA announcement.',
      },
      {
        question: 'Who is eligible for STHP 2027?',
        answer: 'Candidates with a Sindh domicile who have passed Intermediate or an equivalent qualification in 2024, 2025 or 2026.',
      },
      {
        question: 'How many students are selected and what is the scholarship?',
        answer: '200 students are selected for the Foundation Semester covering English, Mathematics and ICT. The top 100 students with a minimum 2.2 CGPA get the scholarship at Sukkur IBA Main Campus.',
      },
      {
        question: 'Is there negative marking or an application fee in STHP 2027?',
        answer: 'The official announcement available to us does not state the negative marking, passing marks or application fee, so we do not publish a figure. Check the official announcement linked on this page.',
      },
      {
        question: 'Where can I practise an STHP-style test for free?',
        answer: 'Our free timed STHP 2027 mock test covers English, Mathematics and ICT with solved MCQs. It uses the MCQsAI practice pattern, not an official weightage.',
      },
    ]}
    officialUrl="https://www.iba-suk.edu.pk/admissions/announcements"
    notice={{
      text: "Looking for IBA Karachi's National Talent Hunt (NTHP)? That is a different program from Sukkur IBA.",
      label: 'IBA Karachi NTHP guide',
      to: '/exams/nthp',
    }}
    officialSources={[
      {
        label: 'Sukkur IBA — official admissions announcements (STHP notice, dates and eligibility)',
        url: 'https://www.iba-suk.edu.pk/admissions/announcements',
      },
      {
        label: 'Sukkur IBA — online admission application portal',
        url: 'https://applyadmission.iba-suk.edu.pk',
      },
    ]}
    verifiedOn="15 October 2026"
    relatedLinks={[
      { label: 'Sukkur IBA Admission Test guide', to: '/exams/iba-sukkur' },
      { label: 'All admission tests in Pakistan', to: '/exams' },
      { label: 'Sindh universities entry test guide', to: '/sindh-universities-entry-test' },
      { label: 'Free mock tests', to: '/mock-tests' },
    ]}
    mockTest={{
      label: 'Free STHP 2027 Mock Test',
      to: '/mock-tests/sukkur-iba-sindh-talent-hunt-program-sthp-2027',
      note: 'Free timed STHP practice test with solved English, Mathematics and ICT MCQs (MCQsAI practice pattern).',
    }}
  />
);

export default SthpGuide;
