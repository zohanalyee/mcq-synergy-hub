import AdmissionTestPage from './AdmissionTestPage';

/** LUMS official admission pages, verified 25 September 2026. */
const LumsAdmissionTest = () => (
  <AdmissionTestPage
    slug="lums"
    name="LCAT (LUMS Common Admission Test)"
    fullName="LUMS Common Admission Test and the SAT/ACT admission route for LUMS undergraduate programmes"
    metaTitle="LUMS LCAT Guide – Test Options, Sections & Eligibility"
    metaDescription="Official-source LUMS undergraduate admission guide: LCAT, SAT and ACT routes, LCAT sections and approximate 3-hour duration, academic eligibility and cycle dates."
    keywords="LUMS admission test, LCAT, LUMS Common Admission Test, LUMS SAT requirement, LUMS eligibility, LUMS SBASSE admission"
    intro="LUMS accepts three test routes for undergraduate admission: the SAT, the ACT, or its own LUMS Common Admission Test (LCAT). LUMS states officially that the LCAT is a multiple-choice test similar to the SAT, with Verbal and Math sections and an approximate duration of three hours, while noting that its timing and format may differ from the SAT. LUMS schedules the LCAT once per admission cycle, and evaluates applicants on academic background, admission-test performance, application review and interview — without publishing a numeric weightage formula."
    examBody="Lahore University of Management Sciences (LUMS), Office of Admissions — SAT is conducted by the College Board and ACT by ACT Inc."
    duration="Approximately 3 hours, as stated in the official LUMS LCAT sample-test document"
    totalMarks="Not officially stated; LUMS does not publish a total marks or question count for the LCAT"
    frequency="Once per admission cycle"
    testDate="15 February 2026 for the Fall 2026 cycle; the next cycle date is not yet announced"
    subjects={[
      'Verbal: Craft and Structure',
      'Verbal: Information and Ideas',
      'Verbal: Standard English Conventions',
      'Verbal: Expression of Ideas',
      'Math',
    ]}
    pattern={[
      { section: 'Accepted tests', detail: 'SAT, or ACT, or the LUMS Common Admission Test (LCAT)', weight: 'Any one route' },
      { section: 'LCAT format', detail: 'Multiple-choice test, similar to the SAT, with Verbal and Math sections', weight: 'Approx. 3 hours' },
      { section: 'Verbal section', detail: 'Craft and Structure, Information and Ideas, Standard English Conventions, Expression of Ideas', weight: 'Not stated officially' },
      { section: 'Math section', detail: 'Published in the official LCAT sample questions document', weight: 'Not stated officially' },
      { section: 'Selection factors', detail: 'Academic background, performance in the admission test, application review and interview', weight: 'No percentage formula published' },
    ]}
    patternNote="LUMS states that the LCAT's time duration and test format may vary from the SAT, so treat the three-hour figure as the officially stated approximation rather than a fixed limit. Marks, question counts and the weightage between test score and academic record are not published on the official LUMS pages."
    eligibility={[
      'Matriculation with 70% marks or above together with FSc or ICS with 70% marks or above.',
      'O-level results in at least 8 subjects with an average grade of at least B, together with A-level in at least three full-credit subjects averaging 2 Bs and 1 C.',
      'American High School Diploma with 70% or above, or a GPA of B or above.',
      'International Baccalaureate Diploma with at least 28 out of 45 points.',
      'One of SAT, ACT or LCAT scores must be submitted with the application.',
      'Programme-specific requirements apply, so confirm the criteria on your own programme page at LUMS.',
    ]}
    keyDates={[
      { event: 'LCAT (Fall 2026 cycle)', value: '15 February 2026' },
      { event: 'LCAT duration', value: 'Approximately 3 hours' },
      { event: 'Total marks', value: 'Not officially stated' },
      { event: 'Next cycle dates', value: 'Not yet announced — check the LUMS critical dates page' },
    ]}
    tips={[
      'Decide your route early: the SAT and ACT have their own registration calendars, while the LCAT is held once in the LUMS cycle.',
      'Because the LCAT follows an SAT-style multiple-choice design, SAT-style Verbal and Math practice transfers directly.',
      'Work through the official LUMS LCAT sample questions document before any third-party material.',
      'Practise the four Verbal areas separately — reading for structure, for ideas, for grammar conventions, and for clearer expression.',
      'Train under a three-hour sitting so stamina is not the reason your accuracy drops.',
      'Check that you clear the 70% academic bar in your own qualification system before planning around test scores.',
      'Prepare for the interview stage too, since LUMS lists it as part of the evaluation alongside test performance.',
    ]}
    officialUrl="https://admission.lums.edu.pk/testing-admissions"
    officialSources={[
      { label: 'LUMS — testing and admissions (SAT, ACT, LCAT routes)', url: 'https://admission.lums.edu.pk/testing-admissions' },
      { label: 'LUMS — official LCAT sample questions (duration and sections)', url: 'https://lums.edu.pk/sites/default/files/sample_lcat_2025.pdf' },
      { label: 'LUMS — critical dates for all programmes', url: 'https://admission.lums.edu.pk/critical-dates-all-programmes' },
      { label: 'LUMS — BS Computer Science admission criteria', url: 'https://lums.edu.pk/programmes/bs-computer-science' },
    ]}
    verifiedOn="25 September 2026"
    relatedLinks={[
      { label: 'All admission tests in Pakistan', to: '/exams' },
      { label: 'IBA Sukkur admission test', to: '/exams/iba-sukkur' },
      { label: 'GIKI admission test', to: '/exams/giki' },
      { label: 'PIEAS written test', to: '/exams/pieas' },
      { label: 'NTS NAT guide', to: '/exams/nat' },
    ]}
    mockTest={{
      label: 'Practise English and Maths MCQs',
      to: '/mock-tests',
      note: 'The LCAT is Verbal and Math only, so aptitude practice is the most useful preparation.',
    }}
  />
);

export default LumsAdmissionTest;
