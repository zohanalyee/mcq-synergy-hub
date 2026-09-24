import AdmissionTestPage from './AdmissionTestPage';

/** PIEAS official admission pages, verified 24 September 2026. */
const PieasEntryTest = () => (
  <AdmissionTestPage
    slug="pieas"
    name="PIEAS Written Test (BS Admission)"
    fullName="Pakistan Institute of Engineering and Applied Sciences written admission test for BS programmes"
    metaTitle="PIEAS Written Test Guide – 100 MCQs, Pattern & Eligibility"
    metaDescription="Official-source PIEAS BS admission guide: 3-hour 100-MCQ written test, subject split for Pre-Engineering, Pre-Medical, ICS and general science, 60% eligibility bar and fee."
    keywords="PIEAS admission test, PIEAS written test pattern, PIEAS BS admission, PIEAS eligibility 60 percent, PIEAS entry test preparation, PIEAS SAT II route"
    intro="The Pakistan Institute of Engineering and Applied Sciences (PIEAS) admits BS students through its own written test. PIEAS officially states that the test runs for three hours and contains 100 multiple-choice questions with four options each and no negative marking, and that the subject split depends on the candidate’s intermediate background. PIEAS requires at least 60% marks in both Matriculation and Intermediate, and also reserves some seats for candidates applying with SAT-II or ACT scores."
    examBody="Pakistan Institute of Engineering and Applied Sciences (PIEAS)"
    duration="3 hours (180 minutes)"
    totalMarks="100 multiple-choice questions, four options each, with no negative marking"
    frequency="Two written tests per undergraduate cycle (Test 1 and Test 2)"
    testDate="Not yet announced for the next cycle — check the official PIEAS admission schedule"
    subjects={[
      'English',
      'Mathematics',
      'Physics',
      'Chemistry (Pre-Engineering and Pre-Medical papers)',
      'Computer Science (ICS paper)',
    ]}
    pattern={[
      { section: 'Pre-Engineering paper', detail: 'English 10, Mathematics (HSSC) 30, Physics (HSSC) 30, Chemistry (HSSC) 30', weight: '100 questions' },
      { section: 'Pre-Medical paper', detail: 'English 10, Mathematics (SSC level) 30, Physics (HSSC) 30, Chemistry (HSSC) 30', weight: '100 questions' },
      { section: 'ICS paper', detail: 'English 10, Mathematics (HSSC) 30, Physics (HSSC) 30, Computer Science (HSSC) 30', weight: '100 questions' },
      { section: 'Science general paper', detail: 'English 10, Mathematics (HSSC) 60, Physics (SSC level) 30', weight: '100 questions' },
      { section: 'Marking', detail: 'All questions are MCQs with four options and there is no negative marking', weight: 'No negative marking' },
      { section: 'Merit formula', detail: 'The percentage weightage of test score against academic marks is not stated on the official pages reviewed', weight: 'Not yet announced here' },
    ]}
    patternNote="Note the paper difference that catches candidates out: Pre-Medical candidates answer Mathematics at SSC level, while the science general paper carries 60 Mathematics questions and Physics at SSC level. Choose the paper matching your intermediate background and confirm it in the current official pattern document."
    eligibility={[
      'At least 60% marks or equivalent in both Matriculation or O-level and Intermediate (HSSC Part I/II) or A-level or equivalent.',
      'Engineering programmes require Pre-Engineering (Physics, Chemistry, Mathematics) or ICS backgrounds as specified officially.',
      'Computer and information sciences and physics programmes accept PCM, Pre-Medical or ICS backgrounds as specified officially.',
      'Candidates with less than 60% in SSC or HSSC Part I/II, or who failed or did not appear in any HSSC Part I/II subject, are not eligible.',
      'Some seats are reserved for admission through SAT-II or ACT: PIEAS states SAT-II in Physics, Chemistry and Mathematics Level II with a score of at least 2000, or an ACT score of at least 26.',
      'Application processing fee is Rs. 3500 within the due date, or Rs. 4000 within one week after the due date.',
    ]}
    keyDates={[
      { event: 'Test duration', value: '3 hours (180 minutes)' },
      { event: 'Question count', value: '100 MCQs, no negative marking' },
      { event: 'Application processing fee', value: 'Rs. 3500 on time, Rs. 4000 late' },
      { event: 'Next test dates', value: 'Not yet announced — check the official PIEAS admission schedule' },
    ]}
    tips={[
      'Confirm which of the four papers applies to you before studying; the mathematics level differs sharply between them.',
      'Three hours for 100 MCQs gives you time to think, so practise accuracy and full working rather than pure speed.',
      'Because there is no negative marking, plan to attempt every question and never leave blanks.',
      'Pre-Engineering and ICS candidates should split revision evenly across the three 30-question subject blocks.',
      'Pre-Medical candidates should revise SSC-level mathematics deliberately, since that is what the official pattern tests.',
      'Science general candidates should give mathematics the majority of study time; it carries 60 of the 100 questions.',
      'Check whether you clear the 60% bar in both Matric and Intermediate before applying, and note the two test sittings per cycle.',
    ]}
    officialUrl="https://admissions.pieas.edu.pk/Admissions/schedule.html"
    officialSources={[
      { label: 'PIEAS — admission schedule for BS programmes', url: 'https://admissions.pieas.edu.pk/Admissions/schedule.html' },
      { label: 'PIEAS — written test pattern for BS programmes', url: 'https://admissions.pieas.edu.pk/Admissions/Contents/WrittenTestPatternforBSPrograms2025.pdf' },
      { label: 'PIEAS — information leaflet for BS admissions', url: 'https://admissions.pieas.edu.pk/Admissions/Contents/Information%20leaflet%20BS-Programs-Updated_02012026.pdf' },
      { label: 'PIEAS — admission FAQs (SAT-II and ACT route)', url: 'https://admissions.pieas.edu.pk/Admissions/FAQs.pdf' },
      { label: 'PIEAS — official site', url: 'https://www.pieas.edu.pk/' },
    ]}
    verifiedOn="24 September 2026"
    relatedLinks={[
      { label: 'All admission tests in Pakistan', to: '/exams' },
      { label: 'ECAT paper pattern', to: '/exams/ecat' },
      { label: 'UET Lahore admission route', to: '/exams/uet-lahore' },
      { label: 'Engineering universities entry tests', to: '/engineering-universities-entry-test' },
      { label: 'NTS NAT guide', to: '/exams/nat' },
    ]}
    mockTest={{
      label: 'Practise Physics, Chemistry and Maths MCQs',
      to: '/mock-tests',
      note: 'PIEAS tests HSSC-level subject content, so revise chapter by chapter and then attempt full 100-question sets.',
    }}
  />
);

export default PieasEntryTest;
