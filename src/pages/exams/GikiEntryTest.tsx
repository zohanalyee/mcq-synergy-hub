import AdmissionTestPage from './AdmissionTestPage';

/** GIKI official admission pages, verified 25 September 2026. */
const GikiEntryTest = () => (
  <AdmissionTestPage
    slug="giki"
    name="GIKI Undergraduate Admission Test"
    fullName="Ghulam Ishaq Khan Institute of Engineering Sciences and Technology undergraduate admission test"
    metaTitle="GIKI Admission Test Guide – Two Exams, Merit Formula & Eligibility"
    metaDescription="Official-source GIKI admission guide: Engineering/Computing and Management exam tracks, the 85% test plus 15% SSC merit formula, eligibility and the 2026 test window."
    keywords="GIKI admission test, GIKI entry test pattern, GIKI merit formula, GIKI eligibility, GIKI engineering computing test, GIKI management exam"
    intro="GIKI conducts its own undergraduate admission test through its Office of Admission and Examination, in two tracks: an Engineering and Computing exam for engineering, artificial intelligence, computer science, cyber security, software engineering and data science programmes, and a Management exam for BS Management Science. GIKI publishes a clear merit formula — 85% from the admission test score and 15% from SSC or the equivalent qualification — and holds the test in a single window each cycle. The test duration, question count and section weightage are not stated on the official eligibility and syllabus pages; GIKI provides downloadable syllabus and sample-paper files instead."
    examBody="Ghulam Ishaq Khan Institute of Engineering Sciences and Technology (GIKI), Office of Admission and Examination"
    duration="Not officially stated on the admission pages; see the official downloadable syllabus and sample paper"
    totalMarks="Not officially stated as a marks total or question count"
    frequency="Once per admission cycle"
    testDate="6–10 July 2026 for the 2026 cycle; the next cycle window is not yet announced"
    subjects={[
      'Engineering and Computing exam: subjects listed in the official GIKI Engineering/Computing test syllabus',
      'Management exam: subjects listed in the official Management test material',
      'Eligibility background: Mathematics, Physics and Chemistry for Pre-Engineering applicants',
    ]}
    pattern={[
      { section: 'Engineering / Computing exam', detail: 'For Engineering, Artificial Intelligence, Computer Science, Cyber Security, Software Engineering and Data Science programmes', weight: 'One of two tracks' },
      { section: 'Management exam', detail: 'For the BS Management Science programme', weight: 'One of two tracks' },
      { section: 'Merit — admission test', detail: 'Score in the GIKI admission test', weight: '85%' },
      { section: 'Merit — previous qualification', detail: 'SSC or equivalent; O-level for A-level candidates; last completed qualification for high-school diploma, IB, BSc or DAE', weight: '15%' },
      { section: 'Duration and question count', detail: 'Not stated on the official eligibility or syllabus pages', weight: 'Not yet announced here' },
    ]}
    patternNote="GIKI's merit formula is unusually test-heavy at 85%, so your admission-test score matters far more than your academic record. Section-level weightage inside the test is not published on the official pages — download GIKI's own syllabus and sample paper from the admission section for that detail."
    eligibility={[
      'BS Engineering programmes: HSSC Pre-Engineering (Mathematics, Physics and Chemistry) with 60% or above marks each in Mathematics, Physics and overall.',
      'Several other equivalent qualification routes are accepted, including A-level, high-school diploma, IB, BSc and DAE backgrounds, as listed officially.',
      'A-level and O-level candidates have their O-level result used for the 15% academic component.',
      'High-school diploma, IB diploma, BSc and DAE candidates have their last completed qualification used for the 15% academic component.',
      'Candidates choose the Engineering/Computing exam or the Management exam according to the programme applied for.',
      'Programme-specific criteria apply — confirm them on the official GIKI eligibility criteria page.',
    ]}
    keyDates={[
      { event: '2026 cycle admission test', value: '6–10 July 2026' },
      { event: 'Merit weightage', value: 'Test 85% + previous qualification 15%' },
      { event: 'Test duration', value: 'Not yet announced on the official pages' },
      { event: 'Next cycle window', value: 'Not yet announced' },
    ]}
    tips={[
      'Because the test carries 85% of merit, treat it as the single decisive part of your application.',
      'Confirm which of the two exams you must sit — Engineering/Computing or Management — before you start preparing.',
      'Download GIKI\u2019s own syllabus and sample paper from the admission section and work to that scope rather than a generic entry-test syllabus.',
      'Engineering applicants need 60% or above in Mathematics, Physics and overall, so check those three figures specifically.',
      'Revise Mathematics and Physics to HSSC depth; they carry both the eligibility bar and the technical core of the test.',
      'Note that your SSC or O-level result — not your intermediate result — may be the 15% academic component, depending on your route.',
      'Plan around a single test window each cycle; there is no second sitting to fall back on.',
    ]}
    officialUrl="https://giki.edu.pk/admissions/admissions-undergraduates/"
    officialSources={[
      { label: 'GIKI — undergraduate admissions and important dates', url: 'https://giki.edu.pk/admissions/admissions-undergraduates/' },
      { label: 'GIKI — eligibility criteria and merit weightage', url: 'https://giki.edu.pk/admissions/admissions-undergraduates/eligibility-criteria/' },
      { label: 'GIKI — undergraduate admission test syllabus', url: 'https://giki.edu.pk/admissions/admissions-undergraduates/undergraduate-admission-test-syllabus/' },
      { label: 'GIKI — official institute site', url: 'https://giki.edu.pk/' },
    ]}
    verifiedOn="25 September 2026"
    relatedLinks={[
      { label: 'All admission tests in Pakistan', to: '/exams' },
      { label: 'PIEAS written test', to: '/exams/pieas' },
      { label: 'ECAT paper pattern', to: '/exams/ecat' },
      { label: 'UET Lahore admission route', to: '/exams/uet-lahore' },
      { label: 'Engineering universities entry tests', to: '/engineering-universities-entry-test' },
    ]}
    mockTest={{
      label: 'Practise Maths and Physics MCQs',
      to: '/mock-tests',
      note: 'GIKI\u2019s engineering track rests on HSSC Mathematics and Physics, so build accuracy there first.',
    }}
  />
);

export default GikiEntryTest;
