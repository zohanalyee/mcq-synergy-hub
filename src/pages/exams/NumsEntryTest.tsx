import AdmissionTestPage from './AdmissionTestPage';

/**
 * NUMS MDCAT (NUMS Entry Test) landing page.
 * Every fact below is taken from numspak.edu.pk official notices/PDFs — see
 * officialSources. Verified on 22 August 2026.
 */
const NumsEntryTest = () => (
  <AdmissionTestPage
    slug="nums"
    name="NUMS MDCAT 2026 (NUMS Entry Test)"
    fullName="Entry test conducted by the National University of Medical Sciences for MBBS/BDS admissions, Session 2026-27"
    metaTitle="NUMS MDCAT 2026 – Test Date, Pattern & Free MCQs"
    metaDescription="NUMS MDCAT 2026 is on Sunday, 13 September 2026. Official pattern: Paper-I 150 MCQs (Bio 55, Chem 40, Phys 40, Eng 15) + Paper-II 50 psychological MCQs. Free practice MCQs."
    keywords="NUMS MDCAT 2026, NUMS entry test, NUMS test date, NUMS MDCAT pattern, NUMS MDCAT syllabus, NUMS MCQs, Army Medical College entry test"
    intro="NUMS MDCAT is the entry test conducted by the National University of Medical Sciences (NUMS), Rawalpindi, for admission to MBBS and BDS programmes in its constituent, private-sector affiliated and all Armed Forces administered medical and dental colleges — including Army Medical College Rawalpindi, CMH Lahore Medical College, Wah Medical College, Bahria University Medical and Dental College, Fazaia Medical College and NUST School of Health Sciences. It is a separate test from the national MDCAT: NUMS states that only the NUMS MDCAT held on 13 September 2026 is valid for admission to these colleges for Session 2026-27."
    examBody="National University of Medical Sciences (NUMS)"
    duration="Paper-I: 2 hours 45 minutes + Paper-II: 15 minutes"
    totalMarks="200 MCQs (150 + 50)"
    frequency="Once a year"
    testDate="Sunday, 13 September 2026, 10:00 AM PST (postponed from the earlier date; local centres start simultaneously)"
    subjects={['Biology', 'Chemistry', 'Physics', 'English', 'Psychological Test']}
    pattern={[
      { section: 'Biology (Paper-I)', detail: '55 MCQs', weight: '37.0%' },
      { section: 'Chemistry (Paper-I)', detail: '40 MCQs', weight: '26.5%' },
      { section: 'Physics (Paper-I)', detail: '40 MCQs', weight: '26.5%' },
      { section: 'English (Paper-I)', detail: '15 MCQs', weight: '10.0%' },
      { section: 'Paper-I total', detail: '150 MCQs in 2 hours 45 minutes', weight: '100% of Paper-I' },
      { section: 'Psychological Test (Paper-II)', detail: '50 MCQs in 15 minutes', weight: '5% of aggregate' },
    ]}
    patternNote="Format: paper-based MCQs, one best answer. Official difficulty split — 20% easy, 60% moderate, 20% hard. In Biology, Chemistry and Physics, 70% of questions are recall level and 30% application level. Mobile phones, smart watches and other electronic gadgets are not allowed in the examination hall. (Source: NUMS MDCAT-2026 Syllabus / Table of Specifications.)"
    eligibility={[
      'Candidates holding valid Pakistani citizenship, Overseas Pakistanis, dual nationals and foreign nationals may appear.',
      'FSc / HSSC / A-Levels / 12th Grade candidates, including result-awaiting candidates, can apply.',
      'Candidates below 18 years of age must hold a valid Juvenile Card issued by NADRA.',
      'Only NUMS MDCAT-2026 (held 13 September 2026) is valid for MBBS/BDS admission in NUMS constituent, affiliated and Armed Forces administered colleges for Session 2026-27.',
      'The subject test is mandatory for admission to all the listed medical and dental colleges.',
    ]}
    keyDates={[
      { event: 'Online registration starts', value: 'Monday, 18 May 2026' },
      { event: 'Online registration ends', value: 'Monday, 22 June 2026 by 1600 hours' },
      { event: 'Registration with late fee ends', value: 'Wednesday, 19 August 2026 by 1600 hours' },
      { event: 'Application portal status', value: 'Reopened per the latest NUMS notice — check the official page before applying' },
      { event: 'NUMS MDCAT-2026 test', value: 'Sunday, 13 September 2026, 10:00 AM' },
      { event: 'Processing fee (local centres)', value: 'PKR 7,500 regular / PKR 8,500 with late fee (non-refundable, non-transferable)' },
      { event: 'Processing fee (KSA centre)', value: 'PKR 40,000 regular / PKR 50,000 with late fee' },
      { event: 'Result / merit list date', value: 'Not yet announced' },
    ]}
    tips={[
      'Biology carries the single largest share (55 of 150 Paper-I MCQs) — build your revision calendar around it first.',
      'Because 70% of science questions are recall level, drill definitions, values and labelled diagrams daily rather than only solving numericals.',
      'Reserve focused practice for the 30% application-level items in Physics and Chemistry — these decide top merit positions.',
      'English is only 15 MCQs: cover high-yield grammar, sentence correction and vocabulary instead of long comprehension drills.',
      'Do not skip Paper-II: 50 psychological-test MCQs must be attempted in just 15 minutes, so practise fast, instinctive answering.',
      'Study directly from the NUMS MDCAT-2026 Table of Specifications (linked below) — NUMS advises broad-based study, not a limited syllabus.',
      'Take full-length timed mocks on MCQsAI so 150 MCQs in 165 minutes (about 66 seconds per question) feels routine.',
    ]}
    officialUrl="https://numspak.edu.pk"
    officialSources={[
      {
        label: 'NUMS MDCAT-2026 official notice (test date, schedule, eligibility, fee)',
        url: 'https://numspak.edu.pk/news-detail/nums-mdcat-2026-for-admissions-in-mbbs-bds-session-2026-27',
      },
      {
        label: 'NUMS MDCAT-2026 Syllabus / Table of Specifications (PDF)',
        url: 'http://numspak.edu.pk/upload/media/2026-NUMS-Updated-MDCAT-TOS-2026_1779075557.pdf',
      },
      {
        label: 'NUMS MDCAT-2026 advertisement (PDF)',
        url: 'http://numspak.edu.pk/upload/media/2026-Advertisement-for-NUMS-MDCAT-2026_1779075470.pdf',
      },
      { label: 'NUMS admissions announcements', url: 'https://numspak.edu.pk/admissions-details' },
    ]}
    verifiedOn="22 August 2026"
    relatedLinks={[
      { label: 'All admission tests in Pakistan', to: '/exams' },
      { label: 'MDCAT (national) preparation', to: '/exams/mdcat' },
      { label: 'MDCAT syllabus 2026', to: '/mdcat-syllabus' },
      { label: 'MDCAT past papers', to: '/mdcat-past-papers' },
      { label: 'NUST NET entry test', to: '/nust-entry-test' },
      { label: 'ECAT preparation', to: '/exams/ecat' },
    ]}
    mockTest={{
      label: 'Practice MDCAT-style Mock Tests',
      to: '/mock-tests',
      note: 'A NUMS-specific mock test is not published yet; provincial MDCAT pattern mocks are the closest match.',
    }}
  />
);

export default NumsEntryTest;
