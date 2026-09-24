import AdmissionTestPage from './AdmissionTestPage';

/** UET Lahore official admission pages, verified 24 September 2026. */
const UetLahoreAdmission = () => (
  <AdmissionTestPage
    slug="uet-lahore"
    name="UET Lahore Admission (ECAT Route)"
    fullName="University of Engineering and Technology Lahore undergraduate admission route, including which programmes require ECAT"
    metaTitle="UET Lahore Admission Guide – ECAT Requirement & Eligibility"
    metaDescription="Official-source UET Lahore undergraduate admission guide: which programmes need ECAT, non-ECAT programmes, minimum intermediate marks, domicile rules, fee and application window."
    keywords="UET Lahore admission, UET ECAT requirement, UET Lahore eligibility, non-ECAT programs UET, UET Lahore application, ECAT conducted by UET Lahore"
    intro="This page covers the University of Engineering and Technology (UET) Lahore undergraduate admission route rather than the ECAT paper itself. UET Lahore states that ECAT is compulsory for Engineering, Computing, Architecture and related disciplines, while Business and Science programmes classified as Non-ECAT Based do not require it. UET Lahore is also the body that conducts ECAT for public-sector engineering institutions in Punjab. For the ECAT paper pattern and subject split, use the dedicated ECAT page linked below."
    examBody="University of Engineering and Technology (UET) Lahore — which also conducts ECAT for public-sector engineering institutions in Punjab"
    duration="Not applicable to the admission route itself; ECAT paper timing is published on the official ECAT pages"
    totalMarks="Not stated as a single admission score on the official admission pages reviewed; merit is determined under UET’s own merit rules"
    frequency="Once per entry session; the Fall 2026 cycle ran one online application window"
    testDate="Not yet announced for the next session — check the official UET admission portal"
    subjects={[
      'ECAT-based programmes: Engineering, Computing, Architecture and related disciplines',
      'Non-ECAT Based programmes: Business and Science programmes listed as Non-ECAT',
      'ECAT paper subjects are published on the official ECAT pages',
    ]}
    pattern={[
      { section: 'Engineering, Computing, Architecture and related', detail: 'ECAT 2026 is compulsory', weight: 'Minimum 60% in Intermediate/equivalent' },
      { section: 'Business and Science programmes marked Non-ECAT Based', detail: 'ECAT is not required', weight: 'Minimum 50% in Intermediate/equivalent' },
      { section: 'Open merit seats', detail: 'Punjab domicile, including ICT, unless a programme specifies otherwise', weight: 'Domicile condition' },
      { section: 'Application fee', detail: 'Rs. 3000 for the undergraduate application', weight: 'Rs. 3000' },
      { section: 'Merit formula', detail: 'Percentage weightage of HSSC, ECAT and matric is not stated on the official admission pages reviewed', weight: 'Not yet announced here' },
    ]}
    patternNote="UET states that applications are received online only and that applications sent by post, courier or by hand are not entertained. Candidates with non-Pakistani qualifications must submit an IBCC equivalence certificate if selected. The exact merit-aggregate weightage was not stated on the official admission pages reviewed, so confirm it in the current prospectus before planning your target score."
    eligibility={[
      'Engineering, Architecture and Computer Engineering (NCEAC) programmes: minimum 60% marks in Intermediate or equivalent.',
      'Science, Technology and Business programmes: minimum 50% marks in Intermediate or equivalent.',
      'ECAT 2026 is compulsory for Engineering, Computing, Architecture and related disciplines.',
      'Business and Science programmes categorised as Non-ECAT Based do not require ECAT.',
      'Only Punjab domiciled applicants, including ICT, are eligible on open merit seats unless a programme specifies otherwise.',
      'FSc Pre-Medical students are eligible to apply for Computing programmes.',
      'Candidates holding qualifications other than Pakistani boards must submit an IBCC equivalence certificate if selected.',
    ]}
    keyDates={[
      { event: 'Fall 2026 application opened', value: '8 June 2026' },
      { event: 'Fall 2026 last date to apply', value: '15 July 2026' },
      { event: 'Application fee', value: 'Rs. 3000' },
      { event: 'Next session schedule', value: 'Not yet announced — check the official admission portal' },
    ]}
    tips={[
      'Check first whether your target programme is ECAT-based or Non-ECAT Based; this decides your entire preparation plan.',
      'If your programme is ECAT-based, prepare against the official ECAT paper pattern rather than a generic entry-test syllabus.',
      'Confirm you meet the marks bar for your group — 60% for engineering and NCEAC computing, 50% for science, technology and business.',
      'Apply within the online window; UET states that postal, courier and by-hand applications are not entertained.',
      'Keep your domicile documents ready, because open merit seats require Punjab or ICT domicile unless the programme says otherwise.',
      'If you studied outside Pakistani boards, start the IBCC equivalence process early so it is ready if you are selected.',
      'Read the merit rules in the current prospectus and confirm the weightage before assuming any aggregate formula.',
    ]}
    officialUrl="https://admission.uet.edu.pk/faqs"
    officialSources={[
      { label: 'UET Lahore — admission FAQs (ECAT requirement, marks, fee, dates)', url: 'https://admission.uet.edu.pk/faqs' },
      { label: 'UET Lahore — admission news and announcements', url: 'https://admission.uet.edu.pk/news' },
      { label: 'UET Lahore — ECAT information (conducting authority)', url: 'https://ecat.uet.edu.pk/General/Ecat' },
      { label: 'UET Lahore — official university site', url: 'https://uet.edu.pk/' },
    ]}
    verifiedOn="24 September 2026"
    relatedLinks={[
      { label: 'All admission tests in Pakistan', to: '/exams' },
      { label: 'ECAT paper pattern and syllabus', to: '/exams/ecat' },
      { label: 'ECAT preparation guide', to: '/ecat-preparation' },
      { label: 'Engineering universities entry tests', to: '/engineering-universities-entry-test' },
      { label: 'NUMS admission test', to: '/exams/nums' },
    ]}
    mockTest={{
      label: 'Practise ECAT-style MCQs',
      to: '/exams/ecat',
      note: 'ECAT is the paper that matters for UET engineering and computing admission; use the ECAT page for the official pattern.',
    }}
  />
);

export default UetLahoreAdmission;
