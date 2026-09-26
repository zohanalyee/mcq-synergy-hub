import AdmissionTestPage from './AdmissionTestPage';

/** HEC official PhD criteria documents, verified 25 September 2026. */
const GatSubjectTest = () => (
  <AdmissionTestPage
    slug="hec-gat-subject"
    name="GAT-Subject (HEC PhD Requirement)"
    fullName="GAT-Subject test as required by HEC for PhD admission, and HEC's own HAT for MS/MPhil/PhD admission"
    metaTitle="GAT-Subject Guide – HEC PhD Requirement & 60% Pass Mark"
    metaDescription="Official-source guide to GAT-Subject: conducted by NTS or ETS, required at 60% for PhD admission under HEC criteria, plus how HEC's own HAT test differs."
    keywords="GAT Subject test, HEC PhD GAT subject requirement, GAT subject 60 percent, HEC HAT test, NTS GAT subject, HEC PhD admission criteria"
    intro="GAT-Subject is often described as an HEC test, but HEC's own documents are explicit that it is not. In HEC's official Minimum Criteria for MS/MPhil and PhD Programs, the subject test is conducted by the National Testing Service (NTS) or by ETS in the United States, and HEC's role is to require it: a candidate must clear a subject test in the chosen area of specialisation before PhD admission, with a minimum of 60% marks in the case of the GAT-Subject test. HEC's Education Testing Council runs its own aptitude test for this level, called HAT, which is a different test — that distinction is explained below so you prepare for the right one."
    examBody="National Testing Service (NTS) or ETS, USA — HEC sets the requirement and the 60% threshold but does not conduct GAT-Subject"
    duration="Not stated on HEC's official pages, because HEC does not conduct this test"
    totalMarks="Not stated officially by HEC; the qualifying requirement is a minimum of 60% marks"
    frequency="Not stated on HEC's official pages — scheduled by the conducting body"
    testDate="Not yet announced here — check the conducting body's own test schedule"
    subjects={[
      'The candidate\u2019s chosen area of specialisation at PhD level',
      'Section-level breakdown is not published on HEC\u2019s official pages',
    ]}
    pattern={[
      { section: 'Requirement', detail: 'A subject test in the chosen area of specialisation must be cleared before PhD admission', weight: 'Mandatory for PhD' },
      { section: 'Conducting body', detail: 'National Testing Service (NTS) or ETS, USA (GRE Subject)', weight: 'Not HEC / not ETC' },
      { section: 'Qualifying score', detail: 'Minimum 60% marks in the case of the GAT-Subject test', weight: '60%' },
      { section: 'Duration, question count, sections', detail: 'Not stated on any official HEC or ETC page', weight: 'Not yet announced here' },
      { section: 'HEC ETC\u2019s own test (HAT)', detail: 'HAT Regular Streams — 100 MCQs in 120 minutes across English/Verbal Reasoning, Analytical Reasoning and Quantitative Reasoning, with weights varying by stream', weight: 'Separate test' },
      { section: 'HAT scholarship variants', detail: 'ETC publishes separate HAT sample papers for the MS and PhD overseas scholarship programmes', weight: 'Programme specific' },
    ]}
    patternNote="Two things are commonly confused here. GAT-Subject is an NTS or ETS subject test that HEC requires at 60% for PhD admission. HAT is HEC's own aptitude test, conducted by its Education Testing Council, with 100 MCQs in 120 minutes and no subject-knowledge component in its published weightage table. Confirm which one your university asks for before you register."
    eligibility={[
      'Applies to candidates seeking PhD admission under HEC\u2019s minimum criteria for MS/MPhil and PhD programmes.',
      'The subject test must be in the area of specialisation chosen at PhD level.',
      'The test must be cleared prior to admission to the PhD programme.',
      'A minimum of 60% marks is required to pass in the case of the GAT-Subject test.',
      'Candidates may alternatively present an ETS (GRE) subject test in the area of specialisation, as stated in HEC\u2019s criteria document.',
      'Registration, fee and scheduling are handled by the conducting body, not by HEC.',
    ]}
    keyDates={[
      { event: 'Qualifying requirement', value: 'Minimum 60% marks' },
      { event: 'When it must be cleared', value: 'Before PhD admission' },
      { event: 'Duration and question count', value: 'Not stated on HEC official pages' },
      { event: 'HEC\u2019s own test at this level', value: 'HAT — 100 MCQs in 120 minutes' },
    ]}
    tips={[
      'First confirm with your university whether it requires GAT-Subject or HEC\u2019s own HAT — they are different tests with different content.',
      'For GAT-Subject, prepare the depth of your PhD specialisation area rather than general aptitude.',
      'Treat 60% as the floor, not the target, since admission is competitive beyond the qualifying mark.',
      'Clear the test before you apply; HEC requires it to be passed prior to PhD admission, not during the programme.',
      'If you are taking HAT instead, prepare English or verbal reasoning, analytical reasoning and quantitative reasoning — its published weightage has no subject section.',
      'For an overseas scholarship route, use the HAT sample papers ETC publishes specifically for the MS and PhD scholarship programmes.',
      'Check registration dates and fees on the conducting body\u2019s own site, since HEC does not publish them for this test.',
    ]}
    officialUrl="https://www.hec.gov.pk/english/scholarshipsgrants/Documents/MPHIL_Phd_Criteria.pdf"
    officialSources={[
      { label: 'HEC — Minimum Criteria for MS/MPhil and PhD Programs (GAT-Subject requirement and 60% pass mark)', url: 'https://www.hec.gov.pk/english/scholarshipsgrants/Documents/MPHIL_Phd_Criteria.pdf' },
      { label: 'HEC ETC — approved content weightages for HAT Regular Streams', url: 'https://www.hec.gov.pk/english/services/students/etc/Documents/Approved%20Content%20Weightages%20for%20HEC%20HAT%20Regular%20Streams.pdf' },
      { label: 'HEC ETC — HAT sample papers', url: 'https://www.hec.gov.pk/english/services/students/etc/Pages/HAT-Sample-Papers.aspx' },
      { label: 'HEC ETC — candidate portal', url: 'https://etc.hec.gov.pk/' },
    ]}
    verifiedOn="25 September 2026"
    relatedLinks={[
      { label: 'All admission tests in Pakistan', to: '/exams' },
      { label: 'USAT (HEC undergraduate test)', to: '/exams/usat' },
      { label: 'NTS NAT guide', to: '/exams/nat' },
      { label: 'NTS exam guide', to: '/exams/nts' },
      { label: 'LAT (Law Admission Test)', to: '/exams/lat' },
    ]}
  />
);

export default GatSubjectTest;
