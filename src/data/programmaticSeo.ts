// Programmatic SEO registry — hand-curated, high-intent combinations only.
// Each entry must carry GENUINE local content (universities, merit, test centres,
// domicile rules, prep resources). Entries without enough content are flagged
// `indexable: false` so the template emits <meta name="robots" content="noindex">.
//
// AI is NEVER called at runtime here. Any AI-generated intros/FAQs are
// pre-generated once and pasted into this file as plain strings.

export interface ProgSeoFAQ { q: string; a: string; }

export interface ProgSeoEntry {
  slug: string;
  title: string;          // <h1> + <title>
  metaDescription: string;
  keywords: string;
  intro: string;          // 2–3 paragraph local intro
  syllabusOrEligibility?: string[]; // bullet list
  universitiesOrInstitutions?: { name: string; note?: string }[];
  testCentres?: string[];
  meritOrCutoff?: { label: string; value: string }[];
  domicile?: string;
  prepResources?: { label: string; path: string }[];
  faqs: ProgSeoFAQ[];
  relatedSlug?: string;   // entitySlug for <RelatedContent />
  indexable: boolean;     // false → noindex
  lastUpdated: string;    // ISO date
}

export const PROGRAMMATIC_SEO: Record<string, ProgSeoEntry> = {
  'mdcat-karachi': {
    slug: 'mdcat-karachi',
    title: 'MDCAT Karachi 2026 — Test Centres, Universities & Free MCQ Practice',
    metaDescription: 'MDCAT 2026 Karachi guide: STS test centres, DUHS/SMBBMU/JSMU admission, Sindh domicile rules, merit cutoffs & free MCQ practice — MCQsAI.',
    keywords: 'MDCAT Karachi, MDCAT 2026 Karachi, DUHS MDCAT, SMBBMU admission, JSMU merit, Sindh MDCAT centres',
    intro:
      'MDCAT 2026 in Karachi is conducted by the Sindh Testing Service (STS) on August 16, 2026 for admission to public medical universities across Sindh. Karachi-domicile students compete primarily for seats at Dow University of Health Sciences (DUHS), Jinnah Sindh Medical University (JSMU), and Shaheed Mohtarma Benazir Bhutto Medical University (SMBBMU). This guide covers Karachi-specific test centres, university merit trends, domicile requirements, and a focused 12-week prep plan.',
    universitiesOrInstitutions: [
      { name: 'Dow University of Health Sciences (DUHS)', note: 'MBBS, BDS, Pharm-D — largest seat allocation in Karachi' },
      { name: 'Jinnah Sindh Medical University (JSMU)', note: 'MBBS, BDS — historic merit ~89%' },
      { name: 'SMBBMU (Larkana, Sindh quota)', note: 'Open to Karachi domicile under Sindh quota' },
      { name: 'Liaquat University of Medical & Health Sciences (LUMHS)', note: 'Jamshoro — open seats for Karachi candidates' },
      { name: 'Karachi Medical & Dental College (KMDC)', note: 'Affiliated with University of Karachi' },
    ],
    testCentres: [
      'Expo Centre Karachi (main STS venue)',
      'NED University of Engineering & Technology',
      'IBA Karachi',
      'University of Karachi (auditorium block)',
    ],
    meritOrCutoff: [
      { label: 'DUHS MBBS (open merit, 2024)', value: '~90.5%' },
      { label: 'JSMU MBBS (open merit, 2024)', value: '~89.2%' },
      { label: 'SMBBMU MBBS Karachi seats (2024)', value: '~87.0%' },
      { label: 'KMDC MBBS (2024)', value: '~88.4%' },
    ],
    domicile: 'Karachi domicile holders compete in the Sindh provincial quota. Federal-area applicants (e.g. KPT colony) may need additional documentation. Domicile, FSc result and PRC must be submitted with the STS application.',
    prepResources: [
      { label: 'MDCAT Past Papers', path: '/mdcat-past-papers' },
      { label: 'MDCAT Syllabus 2026', path: '/mdcat-syllabus' },
      { label: 'Aggregate Calculator', path: '/tools/aggregate-calculator' },
      { label: 'Practice MDCAT MCQs', path: '/exams/mdcat' },
    ],
    faqs: [
      { q: 'When is MDCAT Karachi 2026?', a: 'STS will conduct MDCAT Sindh on August 16, 2026. Karachi candidates take the test at city venues like Expo Centre and NED University.' },
      { q: 'What is the merit for DUHS MBBS from Karachi?', a: 'DUHS open-merit MBBS closed near 90.5% aggregate in 2024. Karachi seats follow the Sindh provincial quota.' },
      { q: 'Can a Karachi domicile apply to LUMHS or SMBBMU?', a: 'Yes. All Sindh-domicile candidates are eligible for any Sindh public medical university; allocation is by merit and university preference.' },
      { q: 'Is the MDCAT Karachi syllabus different?', a: 'No. The syllabus is the unified PMC syllabus. Only the conducting body (STS vs PMC) differs from federal MDCAT.' },
    ],
    relatedSlug: 'mdcat-past-papers',
    indexable: true,
    lastUpdated: '2026-05-20',
  },

  'mdcat-sindh': {
    slug: 'mdcat-sindh',
    title: 'MDCAT Sindh 2026 — STS Test Date, Universities & Prep Plan',
    metaDescription: 'Complete MDCAT Sindh 2026 guide: STS test on Aug 16, all Sindh medical universities, merit lists, domicile rules & free practice — MCQsAI.',
    keywords: 'MDCAT Sindh, MDCAT Sindh 2026, STS MDCAT, Sindh medical universities, Sindh MDCAT merit',
    intro:
      'MDCAT Sindh 2026 is the entry test for all public medical and dental colleges across Sindh province, conducted by the Sindh Testing Service (STS) on August 16, 2026. It replaces the older provincial MCAT and follows the unified PMC syllabus. Centres operate in Karachi, Hyderabad, Sukkur, Larkana and Mirpurkhas — every Sindh-domicile candidate competes under the provincial quota for ~3,500 MBBS seats.',
    universitiesOrInstitutions: [
      { name: 'DUHS, Karachi' },
      { name: 'JSMU, Karachi' },
      { name: 'LUMHS, Jamshoro' },
      { name: 'SMBBMU, Larkana' },
      { name: 'Peoples University of Medical & Health Sciences (PUMHS), Nawabshah' },
      { name: 'Chandka Medical College, Larkana' },
      { name: 'Ghulam Muhammad Mahar Medical College, Sukkur' },
    ],
    testCentres: [
      'Karachi (Expo Centre, NED, IBA)',
      'Hyderabad (Sindh University main campus)',
      'Sukkur (IBA Sukkur)',
      'Larkana (Chandka Medical College)',
      'Mirpurkhas',
    ],
    meritOrCutoff: [
      { label: 'LUMHS MBBS (2024)', value: '~87.8%' },
      { label: 'PUMHS MBBS (2024)', value: '~86.5%' },
      { label: 'Chandka MC (2024)', value: '~85.7%' },
    ],
    domicile: 'Only Sindh domicile and Permanent Resident Certificate (PRC) holders are eligible for Sindh provincial seats. Documentation is verified at STS application stage.',
    prepResources: [
      { label: 'MDCAT Syllabus 2026', path: '/mdcat-syllabus' },
      { label: 'MDCAT Past Papers', path: '/mdcat-past-papers' },
      { label: 'MDCAT Karachi Guide', path: '/p/mdcat-karachi' },
      { label: 'Practice MDCAT MCQs', path: '/exams/mdcat' },
    ],
    faqs: [
      { q: 'Who conducts MDCAT in Sindh?', a: 'The Sindh Testing Service (STS) under the Government of Sindh conducts MDCAT for all Sindh public medical universities.' },
      { q: 'What is the MDCAT Sindh 2026 date?', a: 'August 16, 2026. Admit cards are released ~2 weeks prior on the STS portal.' },
      { q: 'Is MDCAT Sindh easier than federal MDCAT?', a: 'No. Both follow the PMC syllabus and difficulty is comparable. STS papers are independently set.' },
    ],
    relatedSlug: 'mdcat-syllabus',
    indexable: true,
    lastUpdated: '2026-05-20',
  },

  'mdcat-islamabad': {
    slug: 'mdcat-islamabad',
    title: 'MDCAT Islamabad 2026 — Federal Centres, Universities & Merit',
    metaDescription: 'MDCAT 2026 Islamabad: federal test centres, SZABMU/AIMC merit, federal quota rules, syllabus & free MCQ practice — MCQsAI.',
    keywords: 'MDCAT Islamabad, MDCAT 2026 Islamabad, SZABMU MBBS, federal MDCAT, AIMC Islamabad',
    intro:
      'MDCAT Islamabad serves federal-area candidates competing for seats at Shaheed Zulfiqar Ali Bhutto Medical University (SZABMU) and federal-quota allocations at top-tier universities country-wide. The test is conducted by PMC on the unified national date, with venues across Islamabad and Rawalpindi. Federal-domicile candidates have access to federally-administered quota seats not available to provincial applicants. This guide covers the Islamabad and Rawalpindi test centres, SZABMU and Federal Medical College merit trends, federal-quota eligibility rules, the unified PMC syllabus, and a focused MCQ practice plan so Islamabad aspirants can prepare with confidence and avoid common registration mistakes.',
    universitiesOrInstitutions: [
      { name: 'SZABMU (PIMS), Islamabad', note: 'Premier federal medical university' },
      { name: 'Federal Medical College, Islamabad' },
      { name: 'Army Medical College, Rawalpindi', note: 'Affiliated with NUMS — separate admission' },
      { name: 'Rawalpindi Medical University (RMU)', note: 'Punjab quota applies' },
    ],
    testCentres: [
      'COMSATS University Islamabad',
      'Quaid-e-Azam University',
      'NUST H-12 campus',
      'PIMS Auditorium',
    ],
    meritOrCutoff: [
      { label: 'SZABMU MBBS open merit (2024)', value: '~91.3%' },
      { label: 'Federal Medical College (2024)', value: '~89.7%' },
    ],
    domicile: 'Federal-area domicile (Islamabad Capital Territory) is required for federal quota seats. Holders of provincial domiciles apply under their own provincial quotas.',
    prepResources: [
      { label: 'MDCAT Syllabus 2026', path: '/mdcat-syllabus' },
      { label: 'MDCAT Past Papers', path: '/mdcat-past-papers' },
      { label: 'Practice MDCAT MCQs', path: '/exams/mdcat' },
    ],
    faqs: [
      { q: 'When is MDCAT 2026 in Islamabad?', a: 'PMC announces the unified national MDCAT date each year, typically in September. Islamabad follows the federal schedule and venues are confirmed on the candidate roll-number slip.' },
      { q: 'Is SZABMU merit higher than Punjab?', a: 'Federal seats often close near 91%+ due to limited quota size. Punjab universities like KEMU close similar or higher in open merit.' },
      { q: 'Which test centres are used in Islamabad and Rawalpindi?', a: 'Common venues include COMSATS University, Quaid-e-Azam University, NUST H-12 campus and the PIMS auditorium. Your exact centre is printed on your admit slip.' },
      { q: 'Who is eligible for federal-quota MBBS seats?', a: 'Candidates holding an Islamabad Capital Territory (federal) domicile compete for federal-quota seats. Provincial-domicile holders apply under their own provincial quota instead.' },
    ],
    relatedSlug: 'mdcat-syllabus',
    indexable: true,
    lastUpdated: '2026-05-20',
  },

  'nts-karachi': {
    slug: 'nts-karachi',
    title: 'NTS Test Karachi 2026 — Schedule, Centres & Free MCQ Prep',
    metaDescription: 'NTS GAT, NAT, recruitment tests in Karachi 2026: schedule, test centres, syllabus & free MCQ practice — MCQsAI Pakistan.',
    keywords: 'NTS Karachi, NTS test centres Karachi, GAT general Karachi, NAT Karachi, NTS preparation',
    intro:
      'The National Testing Service (NTS) conducts GAT-General, GAT-Subject, NAT, and recruitment tests across multiple Karachi venues year-round. Karachi candidates typically attend at university campuses like IBA, Karachi University, and NED. Roll-number slips and exact venues are issued around 10 days before each test on the NTS portal. This guide explains the Karachi test-centre network, the GAT and NAT formats, registration fees and deadlines, and the most efficient way to practise verbal, quantitative and analytical MCQs so you can target the score required by your degree programme or recruiting department.',
    syllabusOrEligibility: [
      'GAT-General: Verbal (30) + Quantitative (30) + Analytical (40) = 100 MCQs in 120 min',
      'NAT-I (intermediate-level entry tests): English + Analytical + Subject section',
      'Recruitment tests: format varies by hiring department — usually 100 MCQs',
    ],
    testCentres: [
      'University of Karachi',
      'IBA Main Campus',
      'NED University',
      'Federal Urdu University',
      'Sir Syed University',
    ],
    domicile: 'NTS tests are open nation-wide regardless of domicile; Karachi candidates simply select Karachi as their preferred venue during registration.',
    prepResources: [
      { label: 'NTS Preparation Guide', path: '/exams/nts' },
      { label: 'FPSC Past Papers', path: '/fpsc-past-papers' },
      { label: 'PPSC Past Papers', path: '/ppsc-past-papers' },
    ],
    faqs: [
      { q: 'How often does NTS conduct GAT in Karachi?', a: 'GAT-General runs on roughly a quarterly cycle. Schedules are published in advance on nts.org.pk so you can plan your registration.' },
      { q: 'Where can I take the NTS test in Karachi?', a: 'Primary centres include University of Karachi, IBA, NED University, Federal Urdu University, and Sir Syed University. The allocated venue appears on your roll-number slip.' },
      { q: 'How long is a GAT-General score valid?', a: 'A GAT-General score is valid for two years from the test date, which most universities accept for MS/MPhil and PhD admissions.' },
      { q: 'What is the GAT-General passing percentage?', a: 'Most programmes require a minimum of 50%, though competitive departments set higher cut-offs. Aim well above 50% to stay safe.' },
    ],
    relatedSlug: 'nts',
    indexable: true,
    lastUpdated: '2026-05-20',
  },

  'nts-lahore': {
    slug: 'nts-lahore',
    title: 'NTS Test Lahore 2026 — Schedule, Centres & Free Prep MCQs',
    metaDescription: 'NTS GAT, NAT, recruitment tests in Lahore 2026: schedule, test centres, syllabus & free MCQ practice — MCQsAI Pakistan.',
    keywords: 'NTS Lahore, NTS test centres Lahore, GAT general Lahore, NTS preparation Punjab',
    intro:
      'NTS holds GAT, NAT, and recruitment tests for Punjab-government and federal positions throughout the year in Lahore. Common venues include Punjab University, University of Engineering & Technology (UET), and Government College University (GCU). Test slips with allocated venue, time, and roll number are downloadable from the NTS portal ~10 days before each test.',
    syllabusOrEligibility: [
      'GAT-General: 100 MCQs in 120 minutes',
      'NAT: depending on stream (NAT-IM, NAT-IE, etc.)',
      'PPSC-style recruitment tests sometimes outsourced to NTS for assistants/clerks',
    ],
    testCentres: [
      'Punjab University (New Campus)',
      'University of Engineering & Technology (UET)',
      'Government College University (GCU)',
      'Lahore College for Women University',
      'University of Education',
    ],
    domicile: 'No domicile restriction for general NTS tests. Recruitment-specific tests may carry Punjab-domicile requirements.',
    prepResources: [
      { label: 'NTS Preparation Guide', path: '/exams/nts' },
      { label: 'PPSC Past Papers', path: '/ppsc-past-papers' },
      { label: 'PPSC Lahore Jobs Guide', path: '/p/ppsc-lahore' },
    ],
    faqs: [
      { q: 'What is the cost of NTS test in Lahore?', a: 'GAT registration fee is currently PKR 1,400. Recruitment-test fees vary by department, usually PKR 600–1,200.' },
      { q: 'How do I select Lahore as NTS centre?', a: 'During online registration on nts.org.pk, choose "Lahore" as preferred test city. Final venue is allocated based on capacity.' },
    ],
    relatedSlug: 'nts',
    indexable: true,
    lastUpdated: '2026-05-20',
  },

  'css-islamabad': {
    slug: 'css-islamabad',
    title: 'CSS Exam Islamabad 2026 — FPSC Centre, Schedule & Prep Plan',
    metaDescription: 'CSS exam in Islamabad: FPSC headquarters, written test schedule, interview venues, syllabus & free MCQ practice — MCQsAI Pakistan.',
    keywords: 'CSS Islamabad, CSS exam centre Islamabad, FPSC headquarters, CSS interview Islamabad, CSS preparation',
    intro:
      'CSS (Central Superior Services) competitive examination is administered by the Federal Public Service Commission (FPSC) headquartered in Islamabad. Islamabad serves as both a written-test venue and the sole venue for psychological assessment and viva voce. Aspirants from across Pakistan travel to FPSC HQ for the interview stage — making Islamabad a critical location in every candidate\'s CSS journey.',
    syllabusOrEligibility: [
      '12 papers: 6 compulsory (Essay, English, GSA, Pakistan Affairs, Islamic/Comparative Studies, Current Affairs) + 6 optional from groups',
      'Age: 21–30 years (relaxation for certain categories)',
      'Education: Second-division Bachelor\'s minimum',
    ],
    testCentres: [
      'FPSC Headquarters, F-5/1 Islamabad (written + interview)',
      'Federal Government Educational Institutions (FGEI) auditoriums',
    ],
    domicile: 'CSS is open to all Pakistani citizens regardless of domicile. Provincial quotas apply at allocation stage, not at examination eligibility.',
    prepResources: [
      { label: 'CSS MCQs Practice', path: '/css-mcqs-practice' },
      { label: 'CSS Preparation Guide', path: '/exams/css' },
      { label: 'FPSC Past Papers', path: '/fpsc-past-papers' },
    ],
    faqs: [
      { q: 'Is the CSS interview always held in Islamabad?', a: 'Yes. All psychological and viva voce assessments are conducted at FPSC headquarters in Islamabad regardless of written-test centre.' },
      { q: 'Can I attempt CSS from any Pakistani city?', a: 'Yes. Written paper venues are available across major cities; the interview stage is centralised in Islamabad.' },
    ],
    relatedSlug: 'css',
    indexable: true,
    lastUpdated: '2026-05-20',
  },

  'fpsc-islamabad': {
    slug: 'fpsc-islamabad',
    title: 'FPSC Jobs Islamabad 2026 — Tests, Schedule & Prep Resources',
    metaDescription: 'FPSC jobs and tests in Islamabad: headquarters location, federal recruitment cycles, syllabus & free MCQ practice — MCQsAI.',
    keywords: 'FPSC Islamabad, FPSC headquarters, FPSC federal jobs, FPSC test centre Islamabad',
    intro:
      'The Federal Public Service Commission (FPSC) headquarters is at F-5/1, Islamabad. FPSC conducts recruitment exams for all federal government grade BS-16 to BS-20 positions, including CSS, Combined Examination for ASOs/PROs, and specialist cadre tests. Islamabad-based candidates have access to the most frequent test schedules due to centralised operations.',
    syllabusOrEligibility: [
      'Job-specific written test: General Knowledge + English + Professional subject',
      'Most posts: 100 MCQs in 90–120 minutes',
      'Shortlisted candidates appear for interview at FPSC HQ',
    ],
    testCentres: [
      'FPSC HQ, F-5/1, Islamabad',
      'Federal Government Educational Institutions',
      'COMSATS Islamabad (for high-volume tests)',
    ],
    domicile: 'Federal jobs are open to all Pakistani citizens; provincial/regional quotas apply per Establishment Division rules. Federal-area candidates use ICT domicile.',
    prepResources: [
      { label: 'FPSC Past Papers', path: '/fpsc-past-papers' },
      { label: 'FPSC Preparation', path: '/exams/fpsc' },
      { label: 'CSS MCQs Practice', path: '/css-mcqs-practice' },
    ],
    faqs: [
      { q: 'Where is the FPSC office in Islamabad?', a: 'FPSC headquarters is located at Aga Khan Road, F-5/1, Islamabad.' },
      { q: 'How often does FPSC announce jobs?', a: 'Consolidated Advertisement is published monthly on fpsc.gov.pk listing all open positions.' },
    ],
    relatedSlug: 'fpsc',
    indexable: true,
    lastUpdated: '2026-05-20',
  },

  'ppsc-lahore': {
    slug: 'ppsc-lahore',
    title: 'PPSC Jobs Lahore 2026 — Headquarters, Tests & Prep Guide',
    metaDescription: 'PPSC jobs and tests in Lahore: headquarters at Aiwan-e-Iqbal, Punjab recruitment schedule, syllabus & free MCQ practice — MCQsAI.',
    keywords: 'PPSC Lahore, PPSC headquarters, PPSC test centre Lahore, Punjab government jobs, PPSC preparation',
    intro:
      'The Punjab Public Service Commission (PPSC) headquarters is at Aiwan-e-Iqbal, Egerton Road, Lahore. PPSC conducts recruitment for all BS-11 to BS-20 positions in the Punjab Government. Lahore is the primary venue for both written tests and interviews; written papers may also be held in Rawalpindi, Multan, Faisalabad, Bahawalpur, D.G. Khan, Sargodha and Sahiwal depending on candidate volume.',
    syllabusOrEligibility: [
      'Written test: 100 MCQs (English, GK, Islamic Studies, Pakistan Studies, Professional)',
      'Most tests run for 90 minutes with 1-mark per MCQ, no negative marking',
      'Shortlisted candidates appear for interview at Lahore HQ',
    ],
    testCentres: [
      'PPSC HQ, Aiwan-e-Iqbal Complex, Lahore',
      'University of the Punjab',
      'University of Engineering & Technology, Lahore',
      'Government College University (GCU)',
    ],
    domicile: 'Punjab domicile is mandatory for most PPSC posts. Domicile certificate must be uploaded with the online application.',
    prepResources: [
      { label: 'PPSC Past Papers', path: '/ppsc-past-papers' },
      { label: 'PPSC Preparation', path: '/exams/ppsc' },
      { label: 'NTS Lahore Guide', path: '/p/nts-lahore' },
    ],
    faqs: [
      { q: 'Where is the PPSC office in Lahore?', a: 'Aiwan-e-Iqbal Complex, Egerton Road, Lahore — accessible via Mall Road.' },
      { q: 'Does PPSC have negative marking?', a: 'No. Most PPSC tests carry no negative marking — attempt every MCQ.' },
    ],
    relatedSlug: 'ppsc',
    indexable: true,
    lastUpdated: '2026-05-20',
  },

  'ecat-punjab': {
    slug: 'ecat-punjab',
    title: 'ECAT Punjab 2026 — UET Test, Universities & Free Prep MCQs',
    metaDescription: 'ECAT 2026 Punjab: UET-conducted entry test, engineering universities, merit, syllabus & free MCQ practice — MCQsAI.',
    keywords: 'ECAT Punjab, ECAT UET, UET Lahore ECAT, Punjab engineering universities, ECAT 2026',
    intro:
      'ECAT (Engineering College Admission Test) for Punjab is conducted by the University of Engineering & Technology (UET) Lahore each year, typically in mid-August. Punjab-domicile candidates use ECAT for admission to UET Lahore and its constituent campuses (Faisalabad, Rachna RYK, Narowal), plus most Punjab-government engineering universities. NUST and GIKI run their own separate entry tests.',
    syllabusOrEligibility: [
      'Mathematics — 30 MCQs',
      'Physics — 30 MCQs',
      'Chemistry / English — 30 MCQs (candidate chooses one)',
      'Total: 100 MCQs · 100 minutes · negative marking applies',
    ],
    universitiesOrInstitutions: [
      { name: 'UET Lahore (Main + KSK Campus + RCET Gujranwala)' },
      { name: 'UET Taxila' },
      { name: 'UET Peshawar (separate)' },
      { name: 'University of Engineering and Technology Faisalabad' },
      { name: 'Mirpur University of Science and Technology (AJK)' },
    ],
    meritOrCutoff: [
      { label: 'UET Lahore Electrical (2024)', value: '~88%' },
      { label: 'UET Lahore Mechanical (2024)', value: '~85%' },
      { label: 'UET Lahore Computer Science (2024)', value: '~89%' },
    ],
    domicile: 'Punjab domicile is required for the Punjab quota seats at UET. AJK and federal candidates apply under reserved quota seats.',
    prepResources: [
      { label: 'ECAT Preparation Guide', path: '/ecat-preparation' },
      { label: 'NUST Entry Test', path: '/nust-entry-test' },
      { label: 'Engineering Universities Entry Test', path: '/engineering-universities-entry-test' },
      { label: 'Practice ECAT MCQs', path: '/exams/ecat' },
    ],
    faqs: [
      { q: 'When is ECAT 2026 held?', a: 'UET Lahore typically conducts ECAT in the third week of August. Exact date is announced on uet.edu.pk by June.' },
      { q: 'Is there negative marking in ECAT?', a: 'Yes. Wrong answers carry a 1/4 mark penalty. Skip questions you are unsure about.' },
    ],
    relatedSlug: 'ecat-preparation',
    indexable: true,
    lastUpdated: '2026-05-20',
  },

  'biology-mcqs-class-12': {
    slug: 'biology-mcqs-class-12',
    title: 'Biology MCQs Class 12 — FSc Part 2 Chapter-Wise Practice',
    metaDescription: 'Class 12 Biology MCQs chapter-wise: FSc Part 2 syllabus, board + MDCAT pattern questions with explanations — free on MCQsAI.',
    keywords: 'Biology MCQs class 12, FSc Part 2 Biology, class 12 Biology chapter wise MCQs, intermediate biology Pakistan',
    intro:
      'Class 12 (FSc Part 2) Biology is the gateway subject for MDCAT, university admissions, and the 12th-class board exam. The syllabus across Punjab, Sindh, KP, Balochistan and Federal boards is largely aligned with the National Curriculum, covering Homeostasis, Coordination, Reproduction, Genetics, Evolution, Ecology, and Biotechnology. Practising chapter-wise MCQs is the fastest way to lock in concepts for both your board exam and the MDCAT.',
    syllabusOrEligibility: [
      'Chapter 15 — Homeostasis',
      'Chapter 16 — Support & Movement',
      'Chapter 17 — Coordination & Control',
      'Chapter 18 — Reproduction',
      'Chapter 19 — Growth & Development',
      'Chapter 20 — Chromosomes & DNA',
      'Chapter 21 — Cell Cycle',
      'Chapter 22 — Variation & Genetics',
      'Chapter 23 — Biotechnology',
      'Chapter 24 — Evolution',
      'Chapter 25 — Ecosystem',
      'Chapter 26 — Some Major Ecosystems',
      'Chapter 27 — Man & His Environment',
    ],
    prepResources: [
      { label: 'MDCAT Past Papers', path: '/mdcat-past-papers' },
      { label: 'MDCAT Syllabus 2026', path: '/mdcat-syllabus' },
      { label: 'Board MCQs Practice', path: '/board-mcqs' },
      { label: '9th Class MCQs', path: '/9th-class-mcqs' },
    ],
    faqs: [
      { q: 'Are Class 12 Biology MCQs same for all boards?', a: 'Roughly 90% overlap exists across Punjab, Sindh, KP, Balochistan and Federal boards under the National Curriculum. Chapter order may vary slightly.' },
      { q: 'How many MCQs come from Class 12 Biology in MDCAT?', a: 'About 50% of MDCAT Biology MCQs are pulled from FSc Part 2 chapters — making this the highest-yield study area.' },
      { q: 'Is there negative marking on board MCQs?', a: 'No. Board examinations do not apply negative marking. MDCAT does — be careful there.' },
    ],
    relatedSlug: 'board-mcqs',
    indexable: true,
    lastUpdated: '2026-05-20',
  },

  // ===== Phase 2F additions — Pakistan-focused city/province + subject pages =====

  'mdcat-lahore': {
    slug: 'mdcat-lahore',
    title: 'MDCAT Lahore 2026 — Test Centres, Universities & Free MCQ Practice',
    metaDescription: 'MDCAT 2026 Lahore guide: UHS test centres, KEMU/AIMC/FJMU merit, Punjab domicile rules, syllabus & free MCQ practice — MCQsAI.',
    keywords: 'MDCAT Lahore, MDCAT 2026 Lahore, KEMU MDCAT, AIMC merit, UHS MDCAT, Punjab MDCAT centres',
    intro:
      'MDCAT 2026 in Lahore is conducted by the University of Health Sciences (UHS) for admission to Punjab\'s public medical universities. Lahore-domicile candidates compete primarily for seats at King Edward Medical University (KEMU), Allama Iqbal Medical College (AIMC), Fatima Jinnah Medical University (FJMU) and Services Institute of Medical Sciences (SIMS). UHS uses the unified PMC syllabus and runs centres across Lahore, Rawalpindi, Multan, Faisalabad and Bahawalpur.',
    universitiesOrInstitutions: [
      { name: 'King Edward Medical University (KEMU)', note: 'Highest merit — historically ~92%+' },
      { name: 'Allama Iqbal Medical College (AIMC)', note: 'Punjab open merit ~91%' },
      { name: 'Fatima Jinnah Medical University (FJMU)', note: 'Female-only — Lahore' },
      { name: 'Services Institute of Medical Sciences (SIMS)', note: 'Lahore — Punjab quota' },
      { name: 'Lahore Medical & Dental College', note: 'Private — separate merit' },
    ],
    testCentres: [
      'Expo Centre Lahore (main UHS venue)',
      'UET Lahore',
      'Punjab University (New Campus)',
      'GCU Lahore',
    ],
    meritOrCutoff: [
      { label: 'KEMU MBBS open merit (2024)', value: '~92.4%' },
      { label: 'AIMC MBBS (2024)', value: '~91.1%' },
      { label: 'FJMU MBBS (2024)', value: '~90.6%' },
      { label: 'SIMS MBBS (2024)', value: '~90.0%' },
    ],
    domicile: 'Punjab domicile holders compete in the Punjab provincial quota. Federal and other-province candidates are eligible only under reciprocal/reserved seats.',
    prepResources: [
      { label: 'MDCAT Syllabus 2026', path: '/mdcat-syllabus' },
      { label: 'MDCAT Past Papers', path: '/mdcat-past-papers' },
      { label: 'Aggregate Calculator', path: '/tools/aggregate-calculator' },
      { label: 'Practice MDCAT MCQs', path: '/exams/mdcat' },
    ],
    faqs: [
      { q: 'When is MDCAT Lahore 2026?', a: 'UHS conducts MDCAT in Punjab during September 2026. Exact date is notified on uhs.edu.pk ~6 weeks prior.' },
      { q: 'What is the KEMU MBBS merit from Lahore?', a: 'KEMU\'s open-merit MBBS closed near 92.4% aggregate in 2024 — the highest in Punjab.' },
      { q: 'Do Lahore candidates compete only against Lahore?', a: 'No. Lahore is part of the Punjab provincial quota; all Punjab-domicile candidates compete in the same merit list.' },
      { q: 'Is MDCAT Lahore conducted by PMC or UHS?', a: 'UHS conducts MDCAT for Punjab on behalf of PMC. The syllabus is unified.' },
    ],
    relatedSlug: 'mdcat-syllabus',
    indexable: true,
    lastUpdated: '2026-05-26',
  },

  'mdcat-punjab': {
    slug: 'mdcat-punjab',
    title: 'MDCAT Punjab 2026 — UHS Test Date, Universities & Merit',
    metaDescription: 'MDCAT Punjab 2026 by UHS: test schedule, all Punjab medical universities, merit lists, domicile & free MCQ practice — MCQsAI.',
    keywords: 'MDCAT Punjab, MDCAT Punjab 2026, UHS MDCAT, Punjab medical universities, KEMU AIMC FJMU merit',
    intro:
      'MDCAT Punjab 2026 is the entry test for every public medical and dental college in Punjab, conducted by the University of Health Sciences (UHS), Lahore. Punjab has the largest seat allocation of any province with ~5,000 MBBS seats spread across KEMU, AIMC, FJMU, SIMS, Nishtar Medical University (Multan), Rawalpindi Medical University (RMU), QAMC Bahawalpur, Sargodha Medical College, DG Khan Medical College, and several others.',
    universitiesOrInstitutions: [
      { name: 'King Edward Medical University, Lahore' },
      { name: 'Allama Iqbal Medical College, Lahore' },
      { name: 'Fatima Jinnah Medical University, Lahore' },
      { name: 'Nishtar Medical University, Multan' },
      { name: 'Rawalpindi Medical University (RMU)' },
      { name: 'Quaid-e-Azam Medical College, Bahawalpur' },
      { name: 'Sargodha Medical College' },
      { name: 'DG Khan Medical College' },
    ],
    testCentres: [
      'Lahore (Expo Centre, UET, Punjab University)',
      'Rawalpindi (RMU, NUST Rawalpindi)',
      'Multan (Nishtar Medical University)',
      'Faisalabad (UAF)',
      'Bahawalpur (Islamia University)',
    ],
    meritOrCutoff: [
      { label: 'KEMU MBBS (2024)', value: '~92.4%' },
      { label: 'Nishtar Multan MBBS (2024)', value: '~89.8%' },
      { label: 'RMU MBBS (2024)', value: '~91.2%' },
      { label: 'QAMC Bahawalpur (2024)', value: '~88.6%' },
    ],
    domicile: 'Only Punjab domicile and PRC holders are eligible for the Punjab provincial quota. Federal-area and other-province candidates apply on reciprocal/reserved seats.',
    prepResources: [
      { label: 'MDCAT Syllabus 2026', path: '/mdcat-syllabus' },
      { label: 'MDCAT Past Papers', path: '/mdcat-past-papers' },
      { label: 'MDCAT Lahore Guide', path: '/p/mdcat-lahore' },
      { label: 'Practice MDCAT MCQs', path: '/exams/mdcat' },
    ],
    faqs: [
      { q: 'Who conducts MDCAT in Punjab?', a: 'The University of Health Sciences (UHS), Lahore conducts MDCAT for all Punjab public medical colleges.' },
      { q: 'How many MBBS seats are in Punjab?', a: 'Punjab offers roughly 5,000 MBBS seats across 14+ public medical universities — the largest provincial allocation in Pakistan.' },
      { q: 'Is the Punjab MDCAT harder than Sindh\'s?', a: 'Both follow the PMC syllabus with similar difficulty. Punjab\'s competitive pressure is higher due to a larger applicant pool.' },
    ],
    relatedSlug: 'mdcat-syllabus',
    indexable: true,
    lastUpdated: '2026-05-26',
  },

  'nts-islamabad': {
    slug: 'nts-islamabad',
    title: 'NTS Test Islamabad 2026 — Schedule, Centres & Free MCQ Prep',
    metaDescription: 'NTS GAT, NAT, recruitment tests in Islamabad 2026: schedule, test centres at QAU/COMSATS/NUST, syllabus & free practice — MCQsAI.',
    keywords: 'NTS Islamabad, NTS test centres Islamabad, GAT Islamabad, NAT Islamabad, NTS preparation federal',
    intro:
      'NTS conducts GAT-General, GAT-Subject, NAT, and federal recruitment tests across Islamabad throughout the year. As the federal capital and NTS headquarters location, Islamabad has the densest test schedule in Pakistan and access to the highest number of federal-grade vacancies. Common venues are Quaid-e-Azam University (QAU), COMSATS, NUST H-12, and FAST-NU.',
    syllabusOrEligibility: [
      'GAT-General: 100 MCQs (Verbal 30 + Quantitative 30 + Analytical 40) in 120 minutes',
      'NAT-IM/IE/IA: 90 MCQs covering English, Analytical, and Subject sections',
      'Federal recruitment tests: 100 MCQs of subject + GK + English',
    ],
    testCentres: [
      'Quaid-e-Azam University (QAU)',
      'COMSATS University Islamabad',
      'NUST H-12 Campus',
      'FAST-NU Islamabad',
      'International Islamic University (IIUI)',
    ],
    domicile: 'NTS tests are open nation-wide. Federal-area domicile may be required for specific federal-quota recruitment positions.',
    prepResources: [
      { label: 'NTS Preparation Guide', path: '/exams/nts' },
      { label: 'FPSC Past Papers', path: '/fpsc-past-papers' },
      { label: 'CSS Islamabad Guide', path: '/p/css-islamabad' },
      { label: 'FPSC Islamabad Guide', path: '/p/fpsc-islamabad' },
    ],
    faqs: [
      { q: 'Where is NTS headquarters located?', a: 'NTS HQ is at Plot 96, Street 4, H-8/1, Islamabad. All centralised operations are run from there.' },
      { q: 'How often is GAT held in Islamabad?', a: 'GAT-General runs roughly every quarter; recruitment tests appear in cycles linked to federal hiring drives.' },
      { q: 'What is the NTS test fee in Islamabad?', a: 'GAT registration is currently PKR 1,400; recruitment-test fees vary by department (typically PKR 600–1,200).' },
    ],
    relatedSlug: 'nts',
    indexable: true,
    lastUpdated: '2026-05-26',
  },

  'ecat-lahore': {
    slug: 'ecat-lahore',
    title: 'ECAT Lahore 2026 — UET Test Centres, Universities & Free Prep',
    metaDescription: 'ECAT 2026 Lahore: UET-Lahore conducted test, Punjab engineering universities, merit, syllabus & free MCQ practice — MCQsAI.',
    keywords: 'ECAT Lahore, ECAT UET Lahore, UET Lahore admission, Lahore engineering universities, ECAT 2026',
    intro:
      'ECAT in Lahore is conducted by the University of Engineering & Technology (UET), Lahore — the largest engineering admission test in Punjab. Lahore-based candidates take ECAT for admission to UET Lahore main campus, KSK and Narowal sub-campuses, plus most Punjab-government engineering universities. The test is held annually in mid-August at venues across the city including UET Main, Punjab University, and IT University Lahore.',
    syllabusOrEligibility: [
      'Mathematics — 30 MCQs',
      'Physics — 30 MCQs',
      'Chemistry OR English — 30 MCQs (candidate choice)',
      'Total 100 MCQs in 100 minutes with negative marking (¼ per wrong)',
    ],
    universitiesOrInstitutions: [
      { name: 'UET Lahore Main Campus' },
      { name: 'UET KSK Campus' },
      { name: 'UET Narowal & RCET Gujranwala' },
      { name: 'IT University Lahore' },
      { name: 'Government College University, Lahore (engineering programs)' },
    ],
    testCentres: [
      'UET Lahore (main venue)',
      'Punjab University (New Campus)',
      'IT University Lahore',
      'Forman Christian College',
    ],
    meritOrCutoff: [
      { label: 'UET Lahore CS (2024)', value: '~89%' },
      { label: 'UET Lahore Electrical (2024)', value: '~88%' },
      { label: 'UET Lahore Mechanical (2024)', value: '~85%' },
    ],
    domicile: 'Punjab domicile is required for Punjab-quota seats at UET. Reserved seats exist for AJK, Balochistan, GB, and FATA candidates.',
    prepResources: [
      { label: 'ECAT Preparation Guide', path: '/ecat-preparation' },
      { label: 'NUST Entry Test', path: '/nust-entry-test' },
      { label: 'ECAT Punjab Guide', path: '/p/ecat-punjab' },
      { label: 'Practice ECAT MCQs', path: '/exams/ecat' },
    ],
    faqs: [
      { q: 'Who conducts ECAT in Lahore?', a: 'University of Engineering & Technology (UET), Lahore conducts ECAT for Punjab engineering admissions.' },
      { q: 'What is the ECAT 2026 date?', a: 'UET Lahore typically conducts ECAT in the third week of August. The 2026 schedule is announced on uet.edu.pk by June.' },
      { q: 'Is ECAT Lahore harder than NUST entry test?', a: 'Different formats — ECAT is FSc-aligned; NUST NET tests deeper application. Both are competitive at top programs.' },
    ],
    relatedSlug: 'ecat-preparation',
    indexable: true,
    lastUpdated: '2026-05-26',
  },

  'css-karachi': {
    slug: 'css-karachi',
    title: 'CSS Exam Karachi 2026 — FPSC Centre, Schedule & Prep Plan',
    metaDescription: 'CSS exam in Karachi: FPSC regional centre, written test schedule, syllabus, allocation quotas & free MCQ practice — MCQsAI.',
    keywords: 'CSS Karachi, CSS exam Karachi, FPSC Karachi, CSS Sindh quota, CSS preparation',
    intro:
      'CSS (Central Superior Services) written examination is offered at FPSC\'s Karachi regional centre annually in February–March. Karachi candidates compete under the Sindh (Urban) provincial quota for allocation to elite occupational groups like Foreign Service, PAS, Police Service and Income Tax. The interview stage is centrally conducted at FPSC HQ Islamabad — all shortlisted Karachi candidates travel there for psychological and viva voce assessment.',
    syllabusOrEligibility: [
      '12 papers total: 6 compulsory + 6 optional from designated groups',
      'Compulsory: Essay, English Précis & Composition, GSA, Pakistan Affairs, Islamic/Comparative Studies, Current Affairs',
      'Age: 21–30 years; relaxation available for specific categories',
      'Education: minimum 2nd-division Bachelor\'s from a recognised university',
    ],
    testCentres: [
      'FPSC Karachi Regional Office',
      'University of Karachi (auditorium block)',
      'NED University',
    ],
    domicile: 'CSS is open to all Pakistani citizens. Allocation follows provincial/regional quota: Sindh Urban (7.6%) and Sindh Rural (11.4%) — Karachi candidates fall under Sindh Urban.',
    prepResources: [
      { label: 'CSS MCQs Practice', path: '/css-mcqs-practice' },
      { label: 'CSS Preparation Guide', path: '/exams/css' },
      { label: 'FPSC Past Papers', path: '/fpsc-past-papers' },
      { label: 'CSS Islamabad Guide', path: '/p/css-islamabad' },
    ],
    faqs: [
      { q: 'Where is the CSS exam centre in Karachi?', a: 'FPSC operates a regional office in Karachi; the written exam is hosted at FPSC Karachi and partner university venues like UoK and NED.' },
      { q: 'Is the CSS interview held in Karachi?', a: 'No. All psychological assessment and viva voce sessions are centralised at FPSC HQ, F-5/1, Islamabad.' },
      { q: 'What is the Sindh Urban CSS quota?', a: 'Sindh Urban (Karachi-domicile) holds a 7.6% allocation quota in the CSS merit list per Establishment Division rules.' },
    ],
    relatedSlug: 'css',
    indexable: true,
    lastUpdated: '2026-05-26',
  },

  'ppsc-punjab': {
    slug: 'ppsc-punjab',
    title: 'PPSC Jobs Punjab 2026 — Headquarters, Test Schedule & Prep',
    metaDescription: 'PPSC Punjab jobs and recruitment 2026: HQ Lahore, all test centres, common posts, syllabus & free MCQ practice — MCQsAI.',
    keywords: 'PPSC Punjab, PPSC jobs 2026, Punjab Public Service Commission, PPSC test centres, PPSC preparation',
    intro:
      'The Punjab Public Service Commission (PPSC) is the constitutional recruitment body for the Punjab Government, headquartered at Aiwan-e-Iqbal, Lahore. PPSC handles BS-11 to BS-20 selections including Punjab Civil Services (PCS), Tehsildar, Education Officer, Medical Officer, Patwari, Police Sub-Inspector, Naib Tehsildar, and several technical cadres. Written tests are held across Lahore, Rawalpindi, Multan, Faisalabad, Bahawalpur, DG Khan, Sargodha and Sahiwal.',
    syllabusOrEligibility: [
      'PMS / PCS: 6 compulsory papers (essay, English, GK, Islamiat, Pak Studies, current affairs) + 4 optional',
      'Junior posts (Patwari, Tehsildar): 100 MCQs (GK + Pak Studies + Islamiat + English + General Maths)',
      'No negative marking in most PPSC tests',
    ],
    testCentres: [
      'Lahore (Aiwan-e-Iqbal HQ, Punjab University, UET)',
      'Rawalpindi (Government College Asghar Mall)',
      'Multan (Bahauddin Zakariya University)',
      'Faisalabad (UAF)',
      'Bahawalpur (Islamia University)',
      'DG Khan, Sargodha, Sahiwal regional centres',
    ],
    domicile: 'Punjab domicile is mandatory for almost all PPSC posts. Domicile certificate and PRC must be uploaded with the online application.',
    prepResources: [
      { label: 'PPSC Past Papers', path: '/ppsc-past-papers' },
      { label: 'PPSC Preparation', path: '/exams/ppsc' },
      { label: 'PMS Preparation', path: '/exams/pms' },
      { label: 'NTS Lahore Guide', path: '/p/nts-lahore' },
    ],
    faqs: [
      { q: 'Where is PPSC headquarters?', a: 'Aiwan-e-Iqbal Complex, Egerton Road, Lahore.' },
      { q: 'How often does PPSC announce jobs?', a: 'PPSC publishes consolidated advertisements roughly twice a month on ppsc.gop.pk.' },
      { q: 'Does PPSC have negative marking?', a: 'No. Most PPSC tests carry no negative marking — attempt every MCQ.' },
      { q: 'Is Punjab domicile required for PPSC?', a: 'Yes. Punjab domicile and PRC are mandatory for almost all PPSC-advertised positions.' },
    ],
    relatedSlug: 'ppsc',
    indexable: true,
    lastUpdated: '2026-05-26',
  },

  'fpsc-karachi': {
    slug: 'fpsc-karachi',
    title: 'FPSC Jobs Karachi 2026 — Regional Office, Tests & Prep',
    metaDescription: 'FPSC jobs and federal tests in Karachi: regional office, recruitment cycles, syllabus & free MCQ practice — MCQsAI.',
    keywords: 'FPSC Karachi, FPSC regional office Karachi, FPSC federal jobs Sindh, FPSC test centre Karachi',
    intro:
      'The Federal Public Service Commission (FPSC) operates a regional office in Karachi (Block 47, Civic Centre, Gulshan-e-Iqbal) to facilitate federal recruitment for Sindh-based candidates. Karachi hosts written tests for CSS, Combined Examination for ASOs/PROs, Assistant Director (IB), Inspector Customs, and several technical cadres. Sindh-domicile candidates compete under Sindh (Urban) and Sindh (Rural) quotas for federal allocations.',
    syllabusOrEligibility: [
      'Most FPSC posts: 100 MCQs in 90–120 minutes covering English, GK, Islamiat, Pakistan Studies, and a professional subject',
      'CSS: 12-paper written examination held annually in February–March',
      'Shortlisted candidates travel to FPSC HQ Islamabad for interview',
    ],
    testCentres: [
      'FPSC Karachi Regional Office, Civic Centre Gulshan-e-Iqbal',
      'University of Karachi',
      'NED University',
      'IBA Karachi (for high-volume tests)',
    ],
    domicile: 'Federal jobs are open to all Pakistani citizens. Allocation follows provincial/regional quotas — Karachi candidates fall under Sindh (Urban) quota (7.6%).',
    prepResources: [
      { label: 'FPSC Past Papers', path: '/fpsc-past-papers' },
      { label: 'FPSC Preparation', path: '/exams/fpsc' },
      { label: 'CSS Karachi Guide', path: '/p/css-karachi' },
      { label: 'NTS Karachi Guide', path: '/p/nts-karachi' },
    ],
    faqs: [
      { q: 'Where is the FPSC office in Karachi?', a: 'FPSC Karachi Regional Office is at Block 47, Civic Centre, Gulshan-e-Iqbal, Karachi.' },
      { q: 'Can I sit federal CSS exam from Karachi?', a: 'Yes. FPSC hosts the CSS written exam at its Karachi regional centre. Only the interview is centralised at FPSC HQ Islamabad.' },
      { q: 'What is the Sindh Urban federal quota?', a: 'Sindh (Urban) holds 7.6% of federal allocations under the Establishment Division\'s quota policy.' },
    ],
    relatedSlug: 'fpsc',
    indexable: true,
    lastUpdated: '2026-05-26',
  },

  'chemistry-mcqs-class-12': {
    slug: 'chemistry-mcqs-class-12',
    title: 'Chemistry MCQs Class 12 — FSc Part 2 Chapter-Wise Practice',
    metaDescription: 'Class 12 Chemistry MCQs chapter-wise: FSc Part 2 syllabus, board + MDCAT/ECAT pattern questions with explanations — free on MCQsAI.',
    keywords: 'Chemistry MCQs class 12, FSc Part 2 Chemistry, class 12 Chemistry chapter wise MCQs, intermediate chemistry Pakistan',
    intro:
      'Class 12 (FSc Part 2) Chemistry is the core subject for MDCAT and ECAT entry tests across Pakistan. The National Curriculum syllabus — implemented by Punjab, Sindh, KP, Balochistan and Federal boards — covers Organic Chemistry, Industrial Chemistry, Periodic Classification, Transition Elements, and Environmental Chemistry. Chapter-wise MCQ practice with explanations is the highest-yield strategy for both your board exam and MDCAT/ECAT.',
    syllabusOrEligibility: [
      'Chapter 1 — Periodic Classification of Elements',
      'Chapter 2 — s-Block Elements',
      'Chapter 3 — Group IIIA & IVA Elements',
      'Chapter 4 — Group VA & VIA Elements',
      'Chapter 5 — The Halogens & Noble Gases',
      'Chapter 6 — Transition Elements',
      'Chapter 7 — Fundamental Principles of Organic Chemistry',
      'Chapter 8 — Aliphatic Hydrocarbons',
      'Chapter 9 — Aromatic Hydrocarbons',
      'Chapter 10 — Alkyl Halides',
      'Chapter 11 — Alcohols, Phenols & Ethers',
      'Chapter 12 — Aldehydes & Ketones',
      'Chapter 13 — Carboxylic Acids',
      'Chapter 14 — Macromolecules',
      'Chapter 15 — Common Chemical Industries',
      'Chapter 16 — Environmental Chemistry',
    ],
    prepResources: [
      { label: 'MDCAT Past Papers', path: '/mdcat-past-papers' },
      { label: 'MDCAT Syllabus 2026', path: '/mdcat-syllabus' },
      { label: 'ECAT Preparation', path: '/ecat-preparation' },
      { label: 'Board MCQs Practice', path: '/board-mcqs' },
      { label: 'Biology Class 12 MCQs', path: '/p/biology-mcqs-class-12' },
    ],
    faqs: [
      { q: 'How many Class 12 Chemistry MCQs come in MDCAT?', a: 'Around 60% of MDCAT Chemistry MCQs are drawn from FSc Part 2 — particularly the Organic Chemistry chapters (7–14).' },
      { q: 'Are the chapters identical across all Pakistani boards?', a: 'Yes — the National Curriculum aligns Punjab, Sindh, KP, Balochistan and Federal boards. Chapter order may vary slightly.' },
      { q: 'Is there negative marking in board Chemistry MCQs?', a: 'No. Board examinations do not penalise wrong answers. MDCAT and ECAT do — attempt cautiously there.' },
      { q: 'What is the most important Class 12 Chemistry topic?', a: 'Organic Chemistry (Chapters 7–14) carries the heaviest weight for both board and MDCAT/ECAT.' },
    ],
    relatedSlug: 'board-mcqs',
    indexable: true,
    lastUpdated: '2026-05-26',
  },

  'physics-mcqs-class-12': {
    slug: 'physics-mcqs-class-12',
    title: 'Physics MCQs Class 12 — FSc Part 2 Chapter-Wise Practice',
    metaDescription: 'Class 12 Physics MCQs chapter-wise: FSc Part 2 syllabus, board + MDCAT/ECAT pattern questions with explanations — free on MCQsAI.',
    keywords: 'Physics MCQs class 12, FSc Part 2 Physics, class 12 Physics chapter wise MCQs, intermediate physics Pakistan',
    intro:
      'Class 12 (FSc Part 2) Physics underpins ECAT, MDCAT (Physics section), NUST NET and most engineering entry tests in Pakistan. The unified National Curriculum syllabus covers Electrostatics, Current Electricity, Electromagnetism, Electromagnetic Induction, Alternating Current, Physics of Solids, Electronics, Dawn of Modern Physics, Atomic Spectra, and Nuclear Physics. Chapter-wise MCQ practice with worked solutions is the fastest path to mastery.',
    syllabusOrEligibility: [
      'Chapter 12 — Electrostatics',
      'Chapter 13 — Current Electricity',
      'Chapter 14 — Electromagnetism',
      'Chapter 15 — Electromagnetic Induction',
      'Chapter 16 — Alternating Current',
      'Chapter 17 — Physics of Solids',
      'Chapter 18 — Electronics',
      'Chapter 19 — Dawn of Modern Physics',
      'Chapter 20 — Atomic Spectra',
      'Chapter 21 — Nuclear Physics',
    ],
    prepResources: [
      { label: 'ECAT Preparation', path: '/ecat-preparation' },
      { label: 'MDCAT Past Papers', path: '/mdcat-past-papers' },
      { label: 'NUST Entry Test', path: '/nust-entry-test' },
      { label: 'Board MCQs Practice', path: '/board-mcqs' },
      { label: 'Chemistry Class 12 MCQs', path: '/p/chemistry-mcqs-class-12' },
    ],
    faqs: [
      { q: 'How much Class 12 Physics appears in ECAT?', a: 'About 50% of ECAT Physics MCQs are pulled from FSc Part 2 — especially Electromagnetism and Modern Physics chapters.' },
      { q: 'Is Class 12 Physics syllabus same nationwide?', a: 'Yes — the National Curriculum aligns all provincial and Federal boards. Specific board notes may differ in numerical practice problems.' },
      { q: 'Which Class 12 Physics chapter is most asked in MDCAT?', a: 'Electromagnetism and Modern Physics carry the highest weight in MDCAT\'s Physics section.' },
      { q: 'Are conceptual or numerical MCQs more common?', a: 'Boards lean conceptual; ECAT and NUST NET lean numerical and applied. Practise both formats.' },
    ],
    relatedSlug: 'board-mcqs',
    indexable: true,
    lastUpdated: '2026-05-26',
  },

  'biology-mcqs-class-11': {
    slug: 'biology-mcqs-class-11',
    title: 'Biology MCQs Class 11 — FSc Part 1 Chapter-Wise Practice',
    metaDescription: 'Class 11 Biology MCQs chapter-wise: FSc Part 1 syllabus, board + MDCAT pattern questions with explanations — free on MCQsAI.',
    keywords: 'Biology MCQs class 11, FSc Part 1 Biology, class 11 Biology chapter wise MCQs, intermediate biology Pakistan',
    intro:
      'Class 11 (FSc Part 1) Biology builds the foundation for MDCAT, university admissions, and the 11th-class board exam across Punjab, Sindh, KP, Balochistan and Federal boards. The National Curriculum syllabus covers Introduction to Biology, Biological Molecules, Enzymes, The Cell, Diversity, Kingdoms (Monera/Protista/Fungi/Plantae/Animalia), Nutrition, Gaseous Exchange, Transport, and Bioenergetics. Practising chapter-wise MCQs early is critical — MDCAT pulls roughly 50% of its Biology questions from Part 1.',
    syllabusOrEligibility: [
      'Chapter 1 — Introduction to Biology',
      'Chapter 2 — Biological Molecules',
      'Chapter 3 — Enzymes',
      'Chapter 4 — The Cell',
      'Chapter 5 — Variety of Life',
      'Chapter 6 — Kingdom Monera',
      'Chapter 7 — Kingdom Protista',
      'Chapter 8 — Fungi',
      'Chapter 9 — Kingdom Plantae',
      'Chapter 10 — Kingdom Animalia',
      'Chapter 11 — Bioenergetics',
      'Chapter 12 — Nutrition',
      'Chapter 13 — Gaseous Exchange',
      'Chapter 14 — Transport',
    ],
    prepResources: [
      { label: 'MDCAT Past Papers', path: '/mdcat-past-papers' },
      { label: 'MDCAT Syllabus 2026', path: '/mdcat-syllabus' },
      { label: 'Board MCQs Practice', path: '/board-mcqs' },
      { label: '9th Class MCQs', path: '/9th-class-mcqs' },
      { label: 'Biology Class 12 MCQs', path: '/p/biology-mcqs-class-12' },
    ],
    faqs: [
      { q: 'How many Class 11 Biology MCQs appear in MDCAT?', a: 'About 50% of MDCAT Biology MCQs are pulled from FSc Part 1 — especially Cell, Biological Molecules, Enzymes, and Bioenergetics chapters.' },
      { q: 'Is Class 11 Biology syllabus the same nationwide?', a: 'Yes — Punjab, Sindh, KP, Balochistan and Federal boards align with the National Curriculum. Chapter numbering may vary.' },
      { q: 'Which Class 11 Biology chapter carries the most weight?', a: 'The Cell (Chapter 4) and Biological Molecules (Chapter 2) account for the largest share of MDCAT questions from Part 1.' },
      { q: 'Should I study Part 1 or Part 2 first for MDCAT?', a: 'Start with Part 1 — it builds the foundational vocabulary and biological framework required for Part 2 topics like Reproduction and Genetics.' },
    ],
    relatedSlug: 'board-mcqs',
    indexable: true,
    lastUpdated: '2026-05-26',
  },
};

/** Quality gate — a programmatic entry is indexable only if it passes a content threshold. */
function passesQualityGate(e: ProgSeoEntry): boolean {
  if (!e.indexable) return false;
  if (!e.faqs || e.faqs.length < 3) return false;
  const wordCount = (e.intro || '').split(/\s+/).length;
  if (wordCount < 60) return false;
  return true;
}

/** All slugs that should appear in the sitemap (indexable + pass quality gate). */
export const indexableProgSeoSlugs = (): string[] =>
  Object.values(PROGRAMMATIC_SEO).filter(passesQualityGate).map(e => e.slug);

export const getProgEntry = (slug: string): ProgSeoEntry | null =>
  PROGRAMMATIC_SEO[slug] ?? null;

/** Runtime quality check used by the page template to enforce noindex on thin pages. */
export const isProgEntryIndexable = (e: ProgSeoEntry): boolean => passesQualityGate(e);
