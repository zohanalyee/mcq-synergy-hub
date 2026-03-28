export interface ExamData {
  slug: string;
  name: string;
  fullName: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  description: string;
  eligibility: string[];
  subjects: string[];
  tips: string[];
  examBody: string;
  frequency: string;
  duration: string;
  totalMarks: string;
  officialUrl?: string;
}

export const examsData: Record<string, ExamData> = {
  mdcat: {
    slug: 'mdcat',
    name: 'MDCAT',
    fullName: 'Medical and Dental College Admission Test',
    metaTitle: 'MDCAT Preparation 2025 – Free MCQs, Past Papers & Tips',
    metaDescription: 'Prepare for MDCAT with 1000+ MCQs, past papers, study guides, and AI-powered practice tests. Biology, Chemistry, Physics & English prep for Pakistani medical students.',
    keywords: 'MDCAT preparation, MDCAT MCQs, MDCAT past papers, medical test Pakistan, PMC MDCAT, MDCAT 2025, MDCAT biology, MDCAT chemistry',
    description: 'The Medical and Dental College Admission Test (MDCAT) is conducted by the Pakistan Medical Commission (PMC) for admission to medical and dental colleges across Pakistan. It tests knowledge in Biology, Chemistry, Physics, and English.',
    eligibility: [
      'Intermediate (FSc Pre-Medical) with at least 65% marks',
      'A-Levels with equivalent biology/chemistry subjects',
      'Pakistani national or overseas Pakistani',
    ],
    subjects: ['Biology', 'Chemistry', 'Physics', 'English'],
    tips: [
      'Focus heavily on Biology – it carries the most marks',
      'Practice past papers from the last 5 years',
      'Use MCQsAI daily practice mode for spaced repetition',
      'Time yourself during mock tests to improve speed',
      'Review PMC syllabus carefully – stick to the official topics',
    ],
    examBody: 'Pakistan Medical Commission (PMC)',
    frequency: 'Once a year (August-September)',
    duration: '3.5 hours',
    totalMarks: '200',
    officialUrl: 'https://www.pmc.gov.pk',
  },
  ecat: {
    slug: 'ecat',
    name: 'ECAT',
    fullName: 'Engineering College Admission Test',
    metaTitle: 'ECAT Preparation 2025 – Free MCQs & Practice Tests',
    metaDescription: 'Ace your ECAT exam with free MCQs, past papers, and AI-powered tests. Mathematics, Physics, Chemistry & English preparation for engineering admissions in Pakistan.',
    keywords: 'ECAT preparation, ECAT MCQs, ECAT past papers, engineering test Pakistan, UET ECAT, ECAT mathematics, ECAT physics',
    description: 'The Engineering College Admission Test (ECAT) is conducted by UET Lahore and other engineering universities for admission to engineering programs. It evaluates proficiency in Mathematics, Physics, Chemistry, and English.',
    eligibility: [
      'Intermediate (FSc Pre-Engineering) with at least 60% marks',
      'A-Levels with equivalent math/physics subjects',
      'Pakistani national',
    ],
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'English'],
    tips: [
      'Mathematics is the highest-weighted section – practice daily',
      'Learn formulas and derivations by heart',
      'Solve previous 10 years ECAT papers',
      'Focus on conceptual understanding over rote memorization',
      'Take timed mock tests weekly on MCQsAI',
    ],
    examBody: 'UET Lahore / respective university',
    frequency: 'Once a year (July-August)',
    duration: '2 hours',
    totalMarks: '400',
  },
  css: {
    slug: 'css',
    name: 'CSS',
    fullName: 'Central Superior Services Examination',
    metaTitle: 'CSS Exam Preparation 2025 – MCQs, Past Papers & Study Guide',
    metaDescription: 'Prepare for CSS examination with comprehensive MCQs, past papers, and expert tips. Pakistan Affairs, Current Affairs, English, and optional subjects preparation.',
    keywords: 'CSS exam preparation, CSS MCQs, CSS past papers, Central Superior Services, FPSC CSS, CSS Pakistan affairs, CSS current affairs',
    description: 'The Central Superior Services (CSS) examination is conducted by the Federal Public Service Commission (FPSC) for recruitment to Grade 17 posts in the federal government of Pakistan. It is one of the most competitive exams in the country.',
    eligibility: [
      "Bachelor's degree from a recognized university",
      'Age 21-30 years (relaxable for government employees)',
      'Pakistani citizen',
      'Domicile holder of any province/territory',
    ],
    subjects: ['English Essay', 'English Precis & Composition', 'Current Affairs', 'Pakistan Affairs', 'Islamic Studies', 'Optional Subjects'],
    tips: [
      'Read Dawn and The News daily for current affairs',
      'Practice essay writing weekly with timed sessions',
      'Study Pakistan Affairs from Ikram Rabbani',
      'Choose optional subjects based on your strengths',
      'Join a study group for discussion and motivation',
    ],
    examBody: 'Federal Public Service Commission (FPSC)',
    frequency: 'Once a year (February)',
    duration: '3 hours per paper',
    totalMarks: '1200 (12 papers × 100)',
    officialUrl: 'https://www.fpsc.gov.pk',
  },
  ppsc: {
    slug: 'ppsc',
    name: 'PPSC',
    fullName: 'Punjab Public Service Commission Tests',
    metaTitle: 'PPSC Test Preparation 2025 – Free MCQs & Past Papers',
    metaDescription: 'Prepare for PPSC tests with free MCQs, past papers, and practice tests. General knowledge, Pakistan studies, current affairs, and subject-specific preparation.',
    keywords: 'PPSC preparation, PPSC MCQs, PPSC past papers, Punjab Public Service Commission, PPSC jobs, PPSC test preparation',
    description: 'The Punjab Public Service Commission (PPSC) conducts tests for recruitment to various government positions in Punjab province. Tests cover general knowledge, Pakistan studies, current affairs, and job-specific subjects.',
    eligibility: [
      'Varies by post – typically graduation or above',
      'Punjab domicile for provincial posts',
      'Age limits vary by position',
    ],
    subjects: ['General Knowledge', 'Pakistan Studies', 'Current Affairs', 'Islamic Studies', 'English', 'Subject-specific topics'],
    tips: [
      'Focus on General Knowledge – it appears in every test',
      'Study Pakistan geography, history, and constitution',
      'Keep up with current affairs – especially Pakistan-related',
      'Practice MCQs daily on MCQsAI for pattern recognition',
      'Review past PPSC papers for frequently repeated questions',
    ],
    examBody: 'Punjab Public Service Commission',
    frequency: 'Multiple times a year',
    duration: 'Varies by test',
    totalMarks: 'Varies by test',
    officialUrl: 'https://www.ppsc.gop.pk',
  },
  fpsc: {
    slug: 'fpsc',
    name: 'FPSC',
    fullName: 'Federal Public Service Commission Tests',
    metaTitle: 'FPSC Test Preparation 2025 – MCQs & Practice Tests',
    metaDescription: 'Prepare for FPSC exams including CSS, federal government jobs with free MCQs, past papers, and AI-powered practice tests on MCQsAI.',
    keywords: 'FPSC preparation, FPSC MCQs, FPSC past papers, Federal Public Service Commission, FPSC jobs, federal government test',
    description: 'The Federal Public Service Commission (FPSC) conducts examinations and tests for recruitment to federal government positions, including the prestigious CSS exam. It serves all provinces and territories of Pakistan.',
    eligibility: [
      'Varies by post and exam type',
      'Pakistani citizen with valid CNIC',
      'Educational requirements vary by position',
    ],
    subjects: ['General Knowledge', 'Current Affairs', 'Pakistan Affairs', 'English', 'Islamic Studies', 'Subject-specific topics'],
    tips: [
      'Understand the FPSC test pattern – MCQ-based screening',
      'General Knowledge is key – study broadly',
      'Practice time management during mock tests',
      'Review FPSC past papers – questions often repeat',
      'Use MCQsAI for daily practice and progress tracking',
    ],
    examBody: 'Federal Public Service Commission',
    frequency: 'Multiple times a year',
    duration: 'Varies by test',
    totalMarks: 'Varies by test',
    officialUrl: 'https://www.fpsc.gov.pk',
  },
  nts: {
    slug: 'nts',
    name: 'NTS',
    fullName: 'National Testing Service',
    metaTitle: 'NTS Test Preparation 2025 – Free MCQs & Past Papers',
    metaDescription: 'Prepare for NTS tests with free MCQs, past papers, and AI practice. GAT, NAT, and job-specific test preparation for Pakistani students and professionals.',
    keywords: 'NTS preparation, NTS MCQs, NTS past papers, National Testing Service, GAT test, NAT test, NTS jobs',
    description: 'The National Testing Service (NTS) conducts standardized tests for university admissions (NAT), graduate assessments (GAT), and recruitment tests for various organizations in Pakistan.',
    eligibility: [
      'NAT: Intermediate or equivalent for undergraduate admissions',
      'GAT: Bachelor\'s degree for graduate program admissions',
      'Job tests: As per hiring organization requirements',
    ],
    subjects: ['Quantitative Reasoning', 'Analytical Reasoning', 'Verbal Ability', 'Subject Knowledge'],
    tips: [
      'Master analytical reasoning – it\'s common across all NTS tests',
      'Practice quantitative MCQs daily for speed improvement',
      'Verbal ability requires strong vocabulary – read regularly',
      'Time management is critical – practice with a timer',
      'Use MCQsAI mock tests to simulate real NTS conditions',
    ],
    examBody: 'National Testing Service Pakistan',
    frequency: 'Multiple times a year',
    duration: '2-3 hours',
    totalMarks: '100 (typically)',
    officialUrl: 'https://www.nts.org.pk',
  },
};

export const getAllExamSlugs = () => Object.keys(examsData);
