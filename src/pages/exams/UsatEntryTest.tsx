import AdmissionTestPage from './AdmissionTestPage';

/** HEC Education Testing Council official USAT material, verified 25 September 2026. */
const UsatEntryTest = () => (
  <AdmissionTestPage
    slug="usat"
    name="USAT (Undergraduate Studies Admission Test)"
    fullName="HEC Education Testing Council Undergraduate Studies Admission Test"
    metaTitle="USAT Guide – HEC Test Pattern, Categories & 2026 Dates"
    metaDescription="Official-source USAT guide from HEC's Education Testing Council: 75 MCQs in 100 minutes plus a 40-minute essay, six category streams, content weightage and 2026 cycle dates."
    keywords="USAT test, HEC USAT pattern, USAT-E, USAT-M, USAT-CS, USAT content weightage, USAT 2026 test date, Education Testing Council USAT"
    intro="USAT is the Undergraduate Studies Admission Test conducted by the Education Testing Council (ETC) of the Higher Education Commission for candidates with 12 years of education or an equivalent qualification. HEC's official content-weightage document sets a single structure across all category streams: Part I is 75 MCQs in 100 minutes, split into Verbal Reasoning, Quantitative Reasoning and subject sections that change by stream, and Part II is a 40-minute essay-writing paper worth 25 marks, which may be attempted in English or Urdu. HEC states that while it recommends USAT to universities, accepting USAT scores is not mandatory — each university decides for itself."
    examBody="Education Testing Council (ETC), Higher Education Commission of Pakistan"
    duration="Part I: 100 minutes for 75 MCQs. Part II: 40 minutes for essay writing"
    totalMarks="75 MCQs in Part I; Part II essays carry 25 marks (argument-based 15, narrative-based 10). A single overall marks total is not stated officially"
    frequency="Several cycles per year — the official 2026 test calendar lists five USAT test dates"
    testDate="25 October 2026 for the fourth 2026 cycle; other 2026 test dates are 1 February, 19 April, 5 July and 13 December"
    subjects={[
      'Verbal Reasoning (analogy, synonym/antonym, sentence completion, comprehension)',
      'Quantitative Reasoning (arithmetic, algebra and functions, geometry, equations, statistics, scenario-based mental mathematics)',
      'Subject sections by stream: Physics, Chemistry, Mathematics, Biology, Computer Science, Islamiat/Ethics, Pakistan Studies, General Knowledge',
      'Essay writing in English or Urdu',
    ]}
    pattern={[
      { section: 'Part I — Verbal Reasoning', detail: 'Analogy 5, Synonym/Antonym 4, Sentence Completion 6, Comprehension 5', weight: '20 MCQs' },
      { section: 'Part I — Quantitative Reasoning', detail: 'Arithmetic 6, Algebra and functions 4, Geometry 3, Equations 3, Statistics 3, Scenario-based mental mathematics 6', weight: '25 MCQs' },
      { section: 'USAT-E (Pre-Engineering) subjects', detail: 'Physics 10, Chemistry 10, Mathematics 10', weight: '30 MCQs' },
      { section: 'USAT-M (Pre-Medical) subjects', detail: 'Physics 8, Chemistry 8, Biology 14', weight: '30 MCQs' },
      { section: 'USAT-CS (Computer Science) subjects', detail: 'Physics 8, Computer Science 14, Mathematics 8', weight: '30 MCQs' },
      { section: 'USAT-A (Arts and Humanities) subjects', detail: 'Islamiat/Ethics 10, Pakistan Studies 10, General Knowledge 10', weight: '30 MCQs' },
      { section: 'Other streams', detail: 'USAT General Science and USAT Commerce also have official sample papers published by ETC', weight: 'Stream specific' },
      { section: 'Part II — Essay writing', detail: 'Argument-based essay (1 of 3 choices) and narrative-based essay (1 of 3 choices), in English or Urdu', weight: '25 marks / 40 minutes' },
    ]}
    patternNote="The Verbal and Quantitative sections are identical across streams — 45 of the 75 MCQs — so aptitude preparation counts for more than subject revision. The passing or qualifying score, the result validity period and the registration fee amount are not stated on the official HEC and ETC pages reviewed; HEC's official documents confirm a processing and test fee exists and is deposited by bank challan, without publishing the amount."
    eligibility={[
      '12 years of education or an equivalent qualification, across the disciplines and streams covered by the official USAT category list.',
      'Choose the category stream matching your intermediate background: Pre-Engineering, Pre-Medical, Computer Science, Arts and Humanities, General Science or Commerce.',
      'Registration is completed online on the ETC portal using a CNIC, NADRA Juvenile Card or B-Form number, with the name exactly as on the Matric certificate and a photo uploaded.',
      'The candidate profile is locked after registration, so verify every detail before submitting.',
      'A processing and test fee must be deposited at a bank using the downloadable challan, and the deposit slip uploaded with the application; the amount is not stated on the official pages reviewed.',
      'Detailed eligibility conditions and the qualifying score are not stated on the official HEC and ETC pages reviewed — confirm them in the current USAT advertisement on the ETC portal.',
    ]}
    keyDates={[
      { event: 'Fourth 2026 cycle — announcement', value: '6 September 2026' },
      { event: 'Last date for online registration', value: '2 October 2026' },
      { event: 'Roll number slip issue date', value: '16 October 2026' },
      { event: 'Test date', value: '25 October 2026' },
      { event: 'Result announcement', value: '16 November 2026' },
    ]}
    tips={[
      'Put aptitude first: Verbal and Quantitative Reasoning together are 45 of the 75 MCQs in every stream.',
      'Within Quantitative Reasoning, arithmetic and scenario-based mental mathematics carry 12 of the 25 questions, so drill fast calculation.',
      'For Verbal Reasoning, practise analogies, synonyms and antonyms, sentence completion and comprehension as four separate skills.',
      'Prepare the subject block for your own stream only; the 30 subject questions differ sharply between USAT-E, USAT-M, USAT-CS and USAT-A.',
      'Do not skip Part II — the essay paper carries 25 marks and you may write it in English or Urdu, so choose the language you write best in.',
      'Practise both essay types under a 40-minute limit, since one argument-based and one narrative-based essay must be written in that time.',
      'Check whether your target university accepts USAT before relying on it; HEC recommends USAT but universities are not required to accept it.',
    ]}
    officialUrl="https://www.hec.gov.pk/english/services/students/etc/Pages/Content-WeightagesSyllabus.aspx"
    officialSources={[
      { label: 'HEC ETC — official USAT content weightages (pattern and section counts)', url: 'https://www.hec.gov.pk/english/services/students/etc/PublishingImages/Content%20Weightages%20for%20%28USAT%29.pdf' },
      { label: 'HEC ETC — content weightages and syllabus page', url: 'https://www.hec.gov.pk/english/services/students/etc/Pages/Content-WeightagesSyllabus.aspx' },
      { label: 'HEC ETC — test calendar for 2026 (revised 25.08.2026)', url: 'https://www.hec.gov.pk/english/services/students/etc/Documents/Test%20Calendar%20for%20Year%202026%20-%20Revsied%20on%2025.08.2026.pdf' },
      { label: 'HEC ETC — sample papers', url: 'https://www.hec.gov.pk/english/services/students/etc/Pages/HAT-Sample-Papers.aspx' },
      { label: 'HEC — statement that USAT is recommended but not mandatory for universities', url: 'https://www.hec.gov.pk/english/news/news/Pages/USAT-HEC.aspx' },
      { label: 'HEC ETC — candidate registration portal', url: 'https://etc.hec.gov.pk/' },
    ]}
    verifiedOn="25 September 2026"
    relatedLinks={[
      { label: 'All admission tests in Pakistan', to: '/exams' },
      { label: 'NTS NAT guide', to: '/exams/nat' },
      { label: 'LAT (Law Admission Test)', to: '/exams/lat' },
      { label: 'ECAT paper pattern', to: '/exams/ecat' },
      { label: 'Air University AU-CBT', to: '/exams/air-university' },
    ]}
    mockTest={{
      label: 'Practise Verbal and Quantitative MCQs',
      to: '/mock-tests',
      note: 'Aptitude is 45 of the 75 USAT MCQs, so start with English and quantitative reasoning sets.',
    }}
  />
);

export default UsatEntryTest;
