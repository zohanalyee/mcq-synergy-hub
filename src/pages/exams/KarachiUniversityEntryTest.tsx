import AdmissionTestPage from './AdmissionTestPage';

/** Official University of Karachi admissions sources, verified 20 September 2026. */
const KarachiUniversityEntryTest = () => (
  <AdmissionTestPage
    slug="karachi-university"
    name="Karachi University Entrance Test"
    fullName="University of Karachi entrance and aptitude tests for test-based undergraduate admissions"
    metaTitle="Karachi University Entrance Test – Pattern, Eligibility & MCQs"
    metaDescription="University of Karachi entrance-test guide based on official UoK admissions sources: exam body, verified marks, eligibility, subjects, preparation and official links."
    keywords="Karachi University entrance test, UoK admission test, KU entrance test, Karachi University test based admissions, UoK sample paper"
    intro="The University of Karachi Directorate of Admissions uses entrance or aptitude tests for its test-based undergraduate admissions. The exact eligible programmes, academic requirements and department-specific subject portions are published with each admission cycle, so applicants should use the current official prospectus and admission portal rather than relying on a previous year's list. Official test result material identifies a 100-mark test and a 50-mark passing score. A test duration and next test date were not stated in the official admissions material reviewed, so they are shown as not yet announced."
    examBody="University of Karachi — Directorate of Admissions"
    duration="Not yet announced in the official admissions material reviewed"
    totalMarks="100 marks; official result material states a 50-mark passing score"
    frequency="Not officially stated; announced with each admission cycle"
    testDate="Not yet announced"
    subjects={[
      'English',
      'Verbal reasoning / analogies',
      'IQ / General Knowledge',
      'Programme-specific subjects listed in the current official material',
    ]}
    pattern={[
      { section: 'Entrance / aptitude test', detail: 'Multiple-choice test for test-based admissions', weight: '100 marks' },
      { section: 'Passing score', detail: 'Shown on official test result material', weight: '50 marks' },
      { section: 'Section-wise distribution', detail: 'Varies by programme; consult the current official sample paper', weight: 'Not yet announced' },
      { section: 'Visual Studies selection', detail: 'Academic record, aptitude test and interview are assessed', weight: '20% + 60% + 20%' },
    ]}
    patternNote="The University publishes programme-specific eligibility and test material with the relevant admissions cycle. No universal section-by-section distribution or duration was officially stated in the sources reviewed, so none is inferred here."
    eligibility={[
      'Applicants must hold HSC / Intermediate or an officially recognised equivalent qualification in the group required by their chosen programme.',
      'Applicants must meet the department-specific academic requirement published in the current official prospectus.',
      'Applicants to a test-based programme must sit and qualify the relevant University of Karachi entrance or aptitude test.',
      'The definitive programme list and eligibility rules are those in the current official admissions prospectus and portal.',
    ]}
    keyDates={[
      { event: 'Next application window', value: 'Not yet announced' },
      { event: 'Entrance / aptitude test date', value: 'Not yet announced' },
      { event: 'Admit card / venue', value: 'Not yet announced' },
      { event: 'Result / merit list', value: 'Not yet announced' },
    ]}
    tips={[
      'Download the current official prospectus and the sample paper for your intended programme before planning preparation.',
      'Practise English vocabulary, analogies and verbal reasoning because these skills appear in official test material.',
      'Revise IQ and general-knowledge MCQs under timed conditions.',
      'Prepare the HSC-level subjects relevant to your chosen programme instead of assuming every department uses the same paper.',
      'Use a 100-question timed practice set, but wait for the official notice before fixing an exam-duration target.',
      'Recheck the official admission portal near test day for the schedule, venue and programme-specific instructions.',
    ]}
    officialUrl="https://www.uok.edu.pk/admissions/"
    officialSources={[
      { label: 'University of Karachi — official admissions page', url: 'https://www.uok.edu.pk/admissions/' },
      { label: 'University of Karachi — official admissions portal', url: 'https://uokadmission.edu.pk/' },
    ]}
    verifiedOn="20 September 2026"
    relatedLinks={[
      { label: 'All admission tests in Pakistan', to: '/exams' },
      { label: 'Sindh University Pre-Entry Test', to: '/exams/sindh-university' },
      { label: 'Sukkur IBA admission test', to: '/exams/iba-sukkur' },
      { label: 'NTS NAT preparation guide', to: '/exams/nat' },
      { label: 'Sindh universities entry-test guide', to: '/sindh-universities-entry-test' },
    ]}
    mockTest={{
      label: 'Browse Admission-Test Practice',
      to: '/mock-tests',
      note: 'A University of Karachi-specific mock test is not published yet; confirm the current official sample paper before choosing practice sets.',
    }}
  />
);

export default KarachiUniversityEntryTest;