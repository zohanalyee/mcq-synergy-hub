import AdmissionTestPage from './AdmissionTestPage';

/**
 * Sukkur IBA University admission (aptitude) test landing page.
 * Facts sourced from iba-suk.edu.pk official admission pages/PDF and sts.net.pk.
 * Verified on 22 August 2026. Anything not officially stated is marked
 * "not yet announced" / "not officially published".
 */
const IbaSukkurEntryTest = () => (
  <AdmissionTestPage
    slug="iba-sukkur"
    name="Sukkur IBA Admission Test"
    fullName="Sukkur IBA University aptitude test for undergraduate and graduate admissions"
    metaTitle="Sukkur IBA Admission Test – Pattern, Eligibility & Free MCQs"
    metaDescription="Sukkur IBA University aptitude test: analytical skills, logical reasoning, reading comprehension and grammar, followed by group discussion and interview. Eligibility, routes and free practice MCQs."
    keywords="Sukkur IBA admission test, IBA Sukkur aptitude test, Sukkur IBA University admission 2026, STS SIBA Testing Services, IBA Sukkur test preparation, IBA Sukkur eligibility"
    intro="Sukkur IBA University runs its own written aptitude test for admission to its undergraduate and graduate programmes at the main campus and its Khairpur, Kandhkot, Mirpurkhas and Dadu campuses. According to the university's official admission procedure, candidates enter through one of two routes — the Foundation Semester (Regular / THP) or direct appearance in the aptitude test — and candidates who qualify the written test are then assessed through a group discussion and an interview. The university's testing arm, SIBA Testing Services (STS), conducts testing and certification services across Sindh."
    examBody="Sukkur IBA University (testing by SIBA Testing Services, STS)"
    duration="Not officially published — see the official sample papers"
    totalMarks="Not officially published"
    frequency="Phase-wise with each admission cycle (multiple phases per year)"
    testDate="Not yet announced for the next phase — Sukkur IBA publishes each test date on its admissions announcements page"
    subjects={[
      'Analytical skills',
      'Logical reasoning',
      'Reading comprehension',
      'English grammar / grammatical range',
    ]}
    pattern={[
      {
        section: 'Written aptitude test',
        detail: 'Assesses analytical skills, logical reasoning, reading comprehension and grammatical range',
        weight: 'Qualifying stage',
      },
      {
        section: 'Group discussion',
        detail: 'Communication skills, confidence, maturity and leadership qualities are assessed',
        weight: 'Selection stage',
      },
      {
        section: 'Interview',
        detail: "Evaluates the applicant's maturity, motivation, interpersonal skills and career focus",
        weight: 'Selection stage',
      },
      {
        section: 'Foundation Semester route',
        detail: 'Qualify the written test, complete six months of classes and maintain a 2.2 CGPA to progress to a degree programme',
        weight: 'Alternative route',
      },
    ]}
    patternNote="Sukkur IBA does not publish a fixed MCQ count, marks breakdown or test duration in its admission procedure document, so those figures are shown as “not officially published” here. The university does publish programme-wise sample papers — use those for the real question style. Selection is strictly on merit and seat availability, and Sukkur IBA does not accept credit transfers from other institutions."
    eligibility={[
      'BBA / BS programmes: Intermediate or F.Sc with a minimum of 50% marks in the annual examination.',
      'Engineering programmes (e.g. Computer Systems / Electrical): Intermediate or F.Sc in the Pre-Engineering group with a minimum of 60% marks.',
      'Graduate programmes: 16 years of education from a recognised university with a minimum of 60% marks or 2.2 CGPA.',
      'Graduate applicants must clear the Sukkur IBA entry test or hold a minimum 50% score in NTS GAT-General.',
      'A-Levels and American High School Diploma holders are considered with an HEC equivalence certificate.',
      'Undergraduate applicants must have completed HSC (or equivalent) by the interview stage; result-awaiting applicants must show no shortcoming in the first year and may get provisional admission.',
    ]}
    keyDates={[
      { event: 'Undergraduate Admissions 2026 — Phase-I', value: 'Announced 13 April 2026 (closed)' },
      { event: 'Undergraduate Admissions 2026 — Phase-II', value: 'Last date 15 June 2026 (closed)' },
      { event: 'Next phase test date', value: 'Not yet announced' },
      { event: 'Where dates are published', value: 'Official admissions announcements page (linked below)' },
    ]}
    tips={[
      'The test rewards reasoning over memorised syllabus content — practise analytical and logical-reasoning items daily rather than re-reading FSc notes.',
      'Download the official programme-wise sample papers from Sukkur IBA before anything else; they are the only authentic guide to question style.',
      'Reading comprehension carries real weight: read one long English editorial a day and summarise it in three sentences to build speed.',
      'Grammar questions target sentence structure, tenses, prepositions and error identification — drill these as timed MCQ sets.',
      'Quantitative and IQ-style reasoning appear in aptitude formats, so keep basic arithmetic, ratios, percentages and series practice warm.',
      'Prepare for the group discussion and interview from day one — they are formal selection stages, not formalities: practise speaking clearly on current education, economy and technology topics.',
      'If your marks are borderline, study the Foundation Semester route: qualifying the written test and holding a 2.2 CGPA for six months is a legitimate path into a degree programme.',
    ]}
    officialUrl="https://www.iba-suk.edu.pk"
    officialSources={[
      {
        label: 'Sukkur IBA — undergraduate admission procedure and policies',
        url: 'https://www.iba-suk.edu.pk/admission/under-graduate-program/admission-procedures',
      },
      {
        label: 'Sukkur IBA — Admission Procedures (official PDF, eligibility and routes)',
        url: 'https://www.iba-suk.edu.pk/Content/pdf/admissions/Admission%20Proceedures.pdf',
      },
      {
        label: 'Sukkur IBA — aptitude test, group discussion and interview (Computer Systems Engineering)',
        url: 'https://www.iba-suk.edu.pk/CSE/AdmProc',
      },
      {
        label: 'Sukkur IBA — official sample papers',
        url: 'https://iba-suk.edu.pk/admissions/sample-papers',
      },
      {
        label: 'Sukkur IBA — admissions announcements (phase dates)',
        url: 'https://www.iba-suk.edu.pk/admissions/announcements',
      },
      { label: 'SIBA Testing Services (STS) — official website', url: 'https://sts.net.pk/' },
    ]}
    verifiedOn="22 August 2026"
    relatedLinks={[
      { label: 'All admission tests in Pakistan', to: '/exams' },
      { label: 'Sindh universities entry test guide', to: '/sindh-universities-entry-test' },
      { label: 'NTS practice (NAT / GAT)', to: '/exams/nts' },
      { label: 'NUMS MDCAT 2026', to: '/exams/nums' },
      { label: 'Engineering universities entry test', to: '/engineering-universities-entry-test' },
    ]}
    mockTest={{
      label: 'Practice NTS GAT General Mock Test',
      to: '/mock-tests',
      note: 'The NTS GAT General mock test is the closest available match for Sukkur IBA aptitude practice (English, quantitative and analytical reasoning).',
    }}
  />
);

export default IbaSukkurEntryTest;
