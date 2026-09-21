import AdmissionTestPage from './AdmissionTestPage';

/** NTS NAT official pages, verified 20 September 2026. */
const NatEntryTest = () => (
  <AdmissionTestPage
    slug="nat"
    name="NAT (National Aptitude Test)"
    fullName="National Testing Service aptitude test for admission to NTS-associated universities and degree-awarding institutes"
    metaTitle="NTS NAT Preparation Guide – Types, Pattern & Free MCQs"
    metaDescription="Official-source NTS NAT guide covering Category One and Two test types, 90/100-question patterns, eligibility, one-year result validity and preparation tips."
    keywords="NTS NAT preparation, National Aptitude Test, NAT-IE, NAT-IM, NAT-IA, NAT-ICS, NAT-IGS, NAT-ICOM, NAT-II, NTS NAT paper pattern"
    intro="The National Aptitude Test (NAT) is conducted by National Testing Service for admission to universities and degree-awarding institutes associated with NTS. NTS states that a candidate appears in the NAT type matching their subject group, can use that result for the relevant associated universities, and has a result valid for one year. This consolidated guide covers every type listed on the official NTS paper-pattern pages and links applicants to the type-level official detail. NAT-IBS is not included because that label does not appear in the official NTS type list reviewed."
    examBody="National Testing Service Pakistan (NTS)"
    duration="Not officially stated on the NTS NAT pages reviewed"
    totalMarks="Category One: 90 questions; Category Two: 100 questions"
    frequency="Not officially fixed on the core NAT pages; use the official NAT schedule"
    testDate="Not yet announced here — check the current official NAT schedule"
    subjects={[
      'English',
      'Analytical Reasoning',
      'Quantitative Reasoning',
      'Subject Knowledge for the selected NAT type',
    ]}
    pattern={[
      { section: 'Category One (12 years of education)', detail: 'NAT-IE, NAT-IM, NAT-IA, NAT-ICS, NAT-IGS and NAT-ICOM', weight: '90 questions' },
      { section: 'Category One — common sections', detail: 'English 20 + Analytical 20 + Quantitative 20', weight: '60 questions' },
      { section: 'Category One — subject section', detail: 'Content depends on the selected type', weight: '30 questions' },
      { section: 'Category Two (14 years of education)', detail: 'NAT-IIA and the other Category Two types listed by NTS', weight: '100 questions' },
      { section: 'NAT-IIA — common sections', detail: 'English 20 + Analytical 15 + Quantitative 15', weight: '50 questions' },
      { section: 'NAT-IIA — subject section', detail: 'Arts and Humanities', weight: '50 questions' },
      { section: 'Other Category Two types — common sections', detail: 'English 10 + Analytical 10 + Quantitative 10', weight: '30 questions' },
      { section: 'Other Category Two types — subject section', detail: 'Content depends on the selected type', weight: '70 questions' },
    ]}
    patternNote="Choose the NAT type that matches your prior subject group and verify its exact subject distribution on the official NTS paper-pattern page. This page intentionally gives a consolidated overview rather than creating unsupported type-specific claims. Test duration is not stated on the official pages reviewed."
    eligibility={[
      'Category One NAT types are organised for candidates with 12 years of education in the corresponding subject group.',
      'Category Two NAT types are organised for candidates with 14 years of education in the corresponding subject group.',
      'Candidates must select the NAT type that matches their prior subject group and the requirements of the intended associated university.',
      'A NAT result is valid for one year according to NTS.',
      'A candidate can use the relevant NAT result for admission to NTS-associated universities and degree-awarding institutes, subject to each institution’s own admission rules.',
    ]}
    keyDates={[
      { event: 'Current test dates', value: 'See the official NAT schedule' },
      { event: 'Registration deadline', value: 'See the official NAT schedule for the selected session' },
      { event: 'Result validity', value: 'One year' },
      { event: 'Official duration', value: 'Not yet announced on the pages reviewed' },
    ]}
    tips={[
      'Identify your correct NAT type first; the subject section changes with your prior academic group.',
      'Use the official NTS paper-pattern page to turn section question counts into a weekly study allocation.',
      'Practise English, analytical and quantitative questions for every type because all official NAT patterns include these common sections.',
      'For Category One, reserve one-third of your paper practice for the 30-question subject section.',
      'For most Category Two types, prioritise subject revision because the subject section carries 70 of 100 questions.',
      'Take complete 90- or 100-question practice sets, matching your category, while waiting for NTS to confirm session instructions.',
      'Check the associated-universities list before registering so your intended institution accepts the relevant NAT result.',
    ]}
    officialUrl="https://www.nts.org.pk/Products/NTSNAT/nat-test.php"
    officialSources={[
      { label: 'NTS — National Aptitude Test overview', url: 'https://www.nts.org.pk/Products/NTSNAT/nat-test.php' },
      { label: 'NTS — NAT paper patterns and type-specific distributions', url: 'https://www.nts.org.pk/Products/NTSNAT/nat-paper-pattern.php' },
      { label: 'NTS — how to register for NAT', url: 'https://www.nts.org.pk/Products/NTSNAT/nat-howto-register.php' },
      { label: 'NTS — NAT test-day instructions', url: 'https://www.nts.org.pk/Products/NTSNAT/nat-test-inst.php' },
      { label: 'NTS — associated universities and institutes', url: 'https://www.nts.org.pk/Products/NTSNAT/nat-associated-universities.php' },
    ]}
    verifiedOn="20 September 2026"
    relatedLinks={[
      { label: 'All admission tests in Pakistan', to: '/exams' },
      { label: 'General NTS test preparation', to: '/exams/nts' },
      { label: 'Sukkur IBA admission test', to: '/exams/iba-sukkur' },
      { label: 'Karachi University entrance test', to: '/exams/karachi-university' },
      { label: 'Sindh University Pre-Entry Test', to: '/exams/sindh-university' },
    ]}
    mockTest={{
      label: 'Browse NTS Practice Tests',
      to: '/mock-tests',
      note: 'Select practice matching your NAT category and subject group; verify the exact official type-level distribution before starting.',
    }}
  />
);

export default NatEntryTest;