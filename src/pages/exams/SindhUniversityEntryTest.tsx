import AdmissionTestPage from './AdmissionTestPage';

/** Official University of Sindh sources, verified 20 September 2026. */
const SindhUniversityEntryTest = () => (
  <AdmissionTestPage
    slug="sindh-university"
    name="Sindh University Pre-Entry Test"
    fullName="University of Sindh Pre-Entry Test (PET) for bachelor degree admissions"
    metaTitle="Sindh University PET – Pattern, Eligibility & Free MCQs"
    metaDescription="University of Sindh PET guide from official sources: 90-minute paper, section weightage, eligibility, preparation tips and verified admissions links."
    keywords="Sindh University pre entry test, University of Sindh PET, SUTC test, Sindh University admission test, PET sample paper"
    intro="The University of Sindh Testing Centre (SUTC) conducts the Pre-Entry Test (PET) used for bachelor degree admissions. The official SUTC sample paper distributes the paper across English, General Science, General Knowledge, Simple Arithmetic and Intelligence Questions, while official University reporting describes a 90-minute test. The university's published materials have not always used the same minimum qualifying figure: annual advertisements reviewed state 40%, while prospectus text reviewed states 30 out of 100 for most disciplines and separate thresholds for some programmes. Applicants should therefore follow the current programme advertisement and portal rather than a historical threshold."
    examBody="University of Sindh — Sindh University Testing Centre (SUTC)"
    duration="90 minutes"
    totalMarks="100 marks"
    frequency="Not officially fixed; announced with each admission cycle"
    testDate="Not yet announced"
    subjects={[
      'English',
      'General Science',
      'General Knowledge',
      'Simple Arithmetic',
      'Intelligence Questions / IQ',
    ]}
    pattern={[
      { section: 'English', detail: 'Vocabulary and language-use questions shown in the official sample paper', weight: '30%' },
      { section: 'General Science', detail: 'General science MCQs', weight: '20%' },
      { section: 'General Knowledge', detail: 'General awareness MCQs', weight: '20%' },
      { section: 'Simple Arithmetic', detail: 'Basic arithmetic MCQs', weight: '20%' },
      { section: 'Intelligence Questions / IQ', detail: 'Reasoning questions', weight: '10%' },
      { section: 'Total', detail: 'Complete PET paper', weight: '100 marks' },
    ]}
    patternNote="Section weightage is taken from the official SUTC bachelor PET sample paper. Official annual advertisements and prospectus text reviewed show different minimum qualifying figures, so this page does not choose one over the other; follow the current programme notice."
    eligibility={[
      'Applicants must have passed HSC / Intermediate or an officially recognised equivalent prerequisite examination for the selected programme.',
      'The official prospectus states that a prerequisite examination passed in Third Division is not eligible.',
      'Applicants must submit an online application through the official University of Sindh admissions portal.',
      'Bachelor applicants must appear in and qualify the PET unless the current programme notice explicitly provides another route.',
      'LLB (Honours) applicants follow the HEC Law Admission Test requirement rather than the PET route.',
      'Programme-specific subject and academic requirements remain governed by the current official prospectus.',
    ]}
    keyDates={[
      { event: 'Next application window', value: 'Not yet announced' },
      { event: 'Pre-Entry Test date', value: 'Not yet announced' },
      { event: 'Admit card / venue', value: 'Not yet announced' },
      { event: 'Current qualifying threshold', value: 'Confirm in the current official programme advertisement' },
    ]}
    tips={[
      'Begin with the official SUTC sample paper because it is the authoritative guide to section weightage and question style.',
      'Prioritise English: it is the largest single section at 30% of the official sample paper.',
      'Practise General Science, General Knowledge and Simple Arithmetic evenly; each carries 20%.',
      'Reserve short daily drills for IQ questions so the 10% reasoning section does not consume excess time.',
      'Complete full 100-mark practice papers within 90 minutes to develop a sustainable pace.',
      'Before applying, verify the current qualifying threshold and programme requirements on the official admissions portal.',
    ]}
    officialUrl="https://admission.usindh.edu.pk/"
    officialSources={[
      { label: 'University of Sindh — official admissions portal', url: 'https://admission.usindh.edu.pk/' },
      { label: 'Sindh University Testing Centre — official website', url: 'https://sutc.usindh.edu.pk/' },
      { label: 'University of Sindh — official website', url: 'https://usindh.edu.pk/' },
    ]}
    verifiedOn="20 September 2026"
    relatedLinks={[
      { label: 'All admission tests in Pakistan', to: '/exams' },
      { label: 'Karachi University entrance test', to: '/exams/karachi-university' },
      { label: 'Sukkur IBA admission test', to: '/exams/iba-sukkur' },
      { label: 'NTS NAT preparation guide', to: '/exams/nat' },
      { label: 'LAT law admission test', to: '/exams/lat' },
    ]}
    mockTest={{
      label: 'Browse Admission-Test Practice',
      to: '/mock-tests',
      note: 'A Sindh University-specific PET mock is not published yet; use the official SUTC sample paper as the pattern authority.',
    }}
  />
);

export default SindhUniversityEntryTest;