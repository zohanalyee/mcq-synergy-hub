import AdmissionTestPage from './AdmissionTestPage';

/** Air University official admission pages, verified 24 September 2026. */
const AirUniversityEntryTest = () => (
  <AdmissionTestPage
    slug="air-university"
    name="AU-CBT (Air University Admission Test)"
    fullName="Air University computer-based admission test for undergraduate programmes"
    metaTitle="Air University AU-CBT Guide – Test Composition & Eligibility"
    metaDescription="Official-source Air University AU-CBT guide covering section weightage for each HSSC group, test-exemption options, eligibility and admission phases."
    keywords="Air University admission test, AU-CBT, Air University entry test pattern, AU-CBT composition, Air University eligibility, Air University test exemption"
    intro="Air University admits undergraduate students through its own computer-based test, published officially as AU-CBT and conducted at Air University campuses. The official AU-CBT composition tables give the percentage weightage of each section separately for Pre-Engineering, Pre-Medical, Arts and Computer Science candidates. Air University also publishes exemption routes, so candidates holding certain NAT, USAT, SAT or recognised university entrance-test results may not need to sit AU-CBT for specific programmes."
    examBody="Air University (conducted at its own campuses)"
    duration="Not officially stated on the AU-CBT pages reviewed"
    totalMarks="Not officially stated as a question count or total marks; the official tables give section percentages totalling 100%"
    frequency="Several phases within each admission cycle, announced in the campus admission schedule"
    testDate="Not yet announced for the next cycle — check the official Air University admission schedule"
    subjects={[
      'English',
      'Analytical Reasoning',
      'Quantitative Reasoning',
      'Subject knowledge for your HSSC group (Physics, Chemistry, Mathematics, Biology, Computer or Arts subjects)',
    ]}
    pattern={[
      { section: 'Pre-Engineering group', detail: 'English 20, Analytical 25, Quantitative 25, Physics 10, Chemistry 10, Mathematics 10', weight: '100%' },
      { section: 'Pre-Medical group', detail: 'English 20, Analytical 25, Quantitative 15, Physics 10, Chemistry 10, Biology 20', weight: '100%' },
      { section: 'Computer Science group', detail: 'English 20, Analytical 25, Quantitative 25, Physics 10, Computer 10, Mathematics 10', weight: '100%' },
      { section: 'Arts group', detail: 'English 20, Analytical 25, Quantitative 15, Islamiat 10, Pakistan Studies 10, General Knowledge and Current Affairs 20', weight: '100%' },
      { section: 'Engineering exemptions', detail: 'Published exemptions include NAT-IE, NAT-ICS, USAT-E, USAT-CS and entrance tests of UET Lahore, NED UET Karachi, MUET Jamshoro, NUST and ETEA', weight: 'Minimum score 50 required' },
      { section: 'Business and management exemptions', detail: 'At least 1100 in SAT-1, or all six NAT types, as published officially', weight: 'Programme specific' },
    ]}
    patternNote="The values above are percentage weightages from Air University’s official AU-CBT composition tables, not question counts — the total duration and number of questions are not stated on the pages reviewed. Exemption rules require the pre-qualified test to relate to your HSSC qualification, and campus tables differ, so verify your own campus and programme page."
    eligibility={[
      'Eligibility is programme-specific; several bachelor programmes require at least 50% marks in Intermediate or an equivalent qualification.',
      'Candidates with A-level or other foreign qualifications must provide an IBCC equivalence certificate.',
      'Engineering applicants may claim exemption from AU-CBT with a qualifying NAT-IE, NAT-ICS, USAT-E, USAT-CS or a recognised university entrance test as published by Air University.',
      'A pre-qualified NAT must relate to the candidate’s HSSC qualification and a minimum score of 50 is required for exemption.',
      'Business and management applicants may qualify with at least 1100 in SAT-1 or all six NAT types.',
      'The application processing fee published officially is Rs. 2500.',
    ]}
    keyDates={[
      { event: 'Test phases', value: 'Multiple AU-CBT phases per cycle, published per campus' },
      { event: 'Application processing fee', value: 'Rs. 2500' },
      { event: 'Official duration', value: 'Not yet announced on the pages reviewed' },
      { event: 'Next cycle schedule', value: 'Not yet announced — check the campus admission schedule' },
    ]}
    tips={[
      'Use the composition table for your own HSSC group; the Quantitative and subject weightages change between Pre-Engineering, Pre-Medical, Arts and Computer Science.',
      'English plus Analytical plus Quantitative carries 60–70% of AU-CBT in every group, so treat aptitude practice as the core of your plan, not an extra.',
      'Pre-Medical candidates should give Biology the largest single subject share at 20%.',
      'Arts candidates should build a steady current-affairs and general-knowledge routine, since those sections together carry 20%.',
      'Check whether you already qualify for exemption through NAT, USAT or SAT before paying for the test.',
      'Confirm which admission phase you are applying in; each campus publishes its own AU-CBT phase dates.',
      'Because the official pages do not state the paper length, practise full-length aptitude sets under timed conditions rather than assuming a duration.',
    ]}
    officialUrl="https://au.edu.pk/"
    officialSources={[
      { label: 'Air University — prepare for the admission test (AU-CBT composition)', url: 'https://webdata.au.edu.pk/Pages/Admission/prepare_adm_test.aspx' },
      { label: 'Air University Karachi campus — AU-CBT composition', url: 'https://khi.au.edu.pk/Pages/Admission/prepare_adm_test.aspx' },
      { label: 'Air University — bachelor programmes and eligibility', url: 'https://webdata.au.edu.pk/Pages/Admission/newpages/Bachelor_programs.aspx' },
      { label: 'Air University — admission schedule', url: 'https://webdata.au.edu.pk/Pages/Admission/admission_schedule.aspx' },
      { label: 'Air University — official site', url: 'https://au.edu.pk/' },
    ]}
    verifiedOn="24 September 2026"
    relatedLinks={[
      { label: 'All admission tests in Pakistan', to: '/exams' },
      { label: 'NTS NAT guide', to: '/exams/nat' },
      { label: 'ECAT paper pattern', to: '/exams/ecat' },
      { label: 'Engineering universities entry tests', to: '/engineering-universities-entry-test' },
      { label: 'NUMS admission test', to: '/exams/nums' },
    ]}
    mockTest={{
      label: 'Practise Aptitude MCQs',
      to: '/mock-tests',
      note: 'AU-CBT is aptitude-heavy in every group, so start with English, analytical and quantitative practice sets.',
    }}
  />
);

export default AirUniversityEntryTest;
