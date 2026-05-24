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
      'MDCAT Islamabad serves federal-area candidates competing for seats at Shaheed Zulfiqar Ali Bhutto Medical University (SZABMU) and federal-quota allocations at top-tier universities country-wide. The test is conducted by PMC on the unified national date, with venues across Islamabad and Rawalpindi. Federal-domicile candidates have access to federally-administered quota seats not available to provincial applicants.',
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
      { q: 'When is MDCAT 2026 in Islamabad?', a: 'PMC announces the unified national MDCAT date each year, typically in September. Islamabad follows the federal schedule.' },
      { q: 'Is SZABMU merit higher than Punjab?', a: 'Federal seats often close near 91%+ due to limited quota size. Punjab universities like KEMU close similar or higher.' },
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
      'The National Testing Service (NTS) conducts GAT-General, GAT-Subject, NAT, and recruitment tests across multiple Karachi venues year-round. Karachi candidates typically attend at university campuses like IBA, Karachi University, and NED. Roll-number slips and exact venues are issued ~10 days before each test on the NTS portal.',
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
      { q: 'How often does NTS conduct GAT in Karachi?', a: 'GAT-General runs on roughly a quarterly cycle. Schedules are published on nts.org.pk.' },
      { q: 'Where can I take NTS test in Karachi?', a: 'Primary centres include University of Karachi, IBA, NED University, Federal Urdu University, and Sir Syed University.' },
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
};

/** All slugs that should appear in the sitemap (i.e. indexable === true). */
export const indexableProgSeoSlugs = (): string[] =>
  Object.values(PROGRAMMATIC_SEO).filter(e => e.indexable).map(e => e.slug);

export const getProgEntry = (slug: string): ProgSeoEntry | null =>
  PROGRAMMATIC_SEO[slug] ?? null;
