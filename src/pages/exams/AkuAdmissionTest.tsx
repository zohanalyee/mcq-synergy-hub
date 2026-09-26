import AdmissionTestPage from './AdmissionTestPage';

/** AKU official MBBS admission information, verified 25 September 2026. */
const AkuAdmissionTest = () => (
  <AdmissionTestPage
    slug="aku"
    name="AKU Test (Aga Khan University MBBS)"
    fullName="Aga Khan University admission test for the MBBS programme, alongside the MDCAT requirement"
    metaTitle="AKU Test Guide – MBBS Admission Sections & Requirements"
    metaDescription="Official-source Aga Khan University MBBS admission guide: the AKU Test for shortlisting, MDCAT for final selection, test sections, merit criteria and the planned move to UCAT."
    keywords="AKU admission test, Aga Khan University MBBS admission, AKU test sections, AKU MDCAT requirement, AKU UCAT 2027, AKU medical college admission"
    intro="Aga Khan University admits MBBS students through its own AKU Test for shortlisting, combined with MDCAT for final selection and to meet PMDC requirements. The official AKU admission information states that the AKU Test is multiple-choice and based on the HSSC curriculum in Pakistan, with a science achievement section covering physics, chemistry and biology, plus sections on science and mathematical reasoning. AKU also states that from the 2027 admission cycle it is likely to administer the University Clinical Aptitude Test (UCAT) instead."
    examBody="Aga Khan University — MDCAT is administered under PMDC requirements, and MCAT by the AAMC for overseas-degree applicants"
    duration="Not officially stated in the AKU admission information document"
    totalMarks="Not officially stated; question count and marks are not published"
    frequency="One admission cycle per year"
    testDate="Not yet announced for the next cycle — admissions for 2026-2027 have closed"
    subjects={[
      'Science achievement: Physics',
      'Science achievement: Chemistry',
      'Science achievement: Biology',
      'Science reasoning',
      'Mathematical reasoning',
    ]}
    pattern={[
      { section: 'AKU Test', detail: 'Required for shortlisting for most applicants from the Pakistani, British, American-Canadian, IB and indigenous high-school systems', weight: 'Shortlisting stage' },
      { section: 'MDCAT', detail: 'Required for final selection and to meet PMDC requirements', weight: 'Final selection' },
      { section: 'Overseas degree holders', detail: 'MCAT (AAMC) for candidates with a degree from overseas; AKU Test for candidates with degrees from Pakistan', weight: 'Route dependent' },
      { section: 'Test content', detail: 'Multiple-choice, based on the HSSC curriculum in Pakistan', weight: 'Science achievement plus reasoning' },
      { section: 'Merit', detail: 'Assessed on scholastic achievements, AKU Admission Test performance, interviews, productive use of time and leadership potential', weight: 'No numeric formula published' },
      { section: 'From the 2027 cycle', detail: 'AKU states it is likely to administer the University Clinical Aptitude Test (UCAT)', weight: 'Announced as likely' },
    ]}
    patternNote="AKU does not publish the AKU Test duration, question count or marks, and does not publish a percentage merit formula — only the criteria it considers. Because AKU has signalled a likely move to UCAT from the 2027 cycle, confirm the required test in the admission information booklet for the cycle you are applying to."
    eligibility={[
      'Candidates prepared in Urdu-medium or English-medium institutions, in Pakistan or overseas, who have completed or are completing HSSC, graduate or postgraduate education and meet the published criteria may apply.',
      'Applicants from the Pakistani, British, American-Canadian, IB and indigenous high-school systems sit the AKU Test for shortlisting and MDCAT for final selection.',
      'Degree holders from overseas institutions apply with MCAT; degree holders from Pakistan apply with the AKU Test.',
      'MDCAT is required in every route for final selection under PMDC requirements.',
      'The detailed numeric eligibility requirements are set out in the official AKU MBBS Admission Information booklet — confirm them there for your own education system.',
      'Admissions for the 2026-2027 cycle are closed; the next cycle window is not yet announced.',
    ]}
    keyDates={[
      { event: '2026-2027 application deadline', value: '13 May 2026 (cycle now closed)' },
      { event: 'Test duration', value: 'Not officially stated' },
      { event: 'Likely change from 2027 cycle', value: 'University Clinical Aptitude Test (UCAT)' },
      { event: 'Next cycle dates', value: 'Not yet announced' },
    ]}
    tips={[
      'Prepare against the HSSC curriculum, because AKU states its test is based on it rather than on a separate syllabus.',
      'Treat physics, chemistry and biology as the core science achievement block and revise them to HSSC depth.',
      'Practise reasoning questions separately; science reasoning and mathematical reasoning are their own sections, not extra subject content.',
      'Plan MDCAT preparation in parallel — it is needed for final selection no matter how well you do in the AKU Test.',
      'Because duration and question count are not published, practise mixed full-length MCQ sets rather than timing to an assumed limit.',
      'Build the non-test part of your application too: AKU weighs scholastic record, interviews, use of time and leadership potential.',
      'Check the current admission information booklet before you start, in case UCAT replaces the AKU Test for your cycle.',
    ]}
    officialUrl="https://www.aku.edu/admissions/mbbs/Pages/home.aspx"
    officialSources={[
      { label: 'AKU — MBBS admission information 2026-2027 (test requirements)', url: 'https://www.aku.edu/admissions/Documents/admission-information-MBBS.pdf' },
      { label: 'AKU — MBBS admissions home', url: 'https://www.aku.edu/admissions/mbbs/Pages/home.aspx' },
      { label: 'AKU — official university site', url: 'https://www.aku.edu/' },
      { label: 'PMDC — national MDCAT requirements', url: 'https://www.pmdc.pk/' },
    ]}
    verifiedOn="25 September 2026"
    relatedLinks={[
      { label: 'All admission tests in Pakistan', to: '/exams' },
      { label: 'MDCAT guide', to: '/exams/mdcat' },
      { label: 'MDCAT syllabus', to: '/mdcat-syllabus' },
      { label: 'NUMS admission test', to: '/exams/nums' },
      { label: 'LUMS admission test', to: '/exams/lums' },
    ]}
    mockTest={{
      label: 'Practise MDCAT-style MCQs',
      to: '/exams/mdcat',
      note: 'MDCAT is required for final selection at AKU, so start there while preparing HSSC science depth.',
    }}
  />
);

export default AkuAdmissionTest;
