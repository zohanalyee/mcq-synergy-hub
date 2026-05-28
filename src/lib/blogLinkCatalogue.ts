/**
 * Catalogue of MCQSAI internal routes used by AI blog generation
 * for contextual internal linking + preparation funnel blocks.
 *
 * Used in two places:
 *   - supabase/functions/generate-blog: passed into the prompt as an allow-list
 *   - src/pages/BlogPost: to validate and render `internal_links` + `prep_blocks`
 */

export interface CatalogueEntry {
  anchor: string;
  href: string;
  description: string;
  cta: string;
}

const CATALOGUE: Record<string, CatalogueEntry[]> = {
  jobs: [
    { anchor: 'NTS MCQs', href: '/exams/nts', description: 'Practice NTS-style MCQs across General Knowledge, English and Maths.', cta: 'Practice NTS MCQs' },
    { anchor: 'FPSC MCQs', href: '/fpsc-past-papers', description: 'FPSC past-paper MCQs with explanations.', cta: 'Practice FPSC MCQs' },
    { anchor: 'PPSC MCQs', href: '/ppsc-past-papers', description: 'PPSC topic-wise MCQs and mock tests.', cta: 'Practice PPSC MCQs' },
    { anchor: 'Age Calculator', href: '/tools/age-calculator', description: 'Check age eligibility before applying.', cta: 'Open Age Calculator' },
    { anchor: 'Percentage Calculator', href: '/tools/percentage-calculator', description: 'Compute marks percentage for application forms.', cta: 'Open Percentage Calculator' },
    { anchor: 'Merit Calculator', href: '/tools/merit-calculator', description: 'Estimate merit for government jobs.', cta: 'Open Merit Calculator' },
  ],
  scholarships: [
    { anchor: 'Study Guides', href: '/study-guides', description: 'Step-by-step preparation guides for scholarships and exams.', cta: 'Browse Study Guides' },
    { anchor: 'Board MCQs', href: '/board-mcqs', description: 'Board-wise MCQ practice for academic eligibility.', cta: 'Practice Board MCQs' },
    { anchor: 'CGPA Calculator', href: '/tools/cgpa-calculator', description: 'Convert CGPA for scholarship applications.', cta: 'Open CGPA Calculator' },
  ],
  mdcat: [
    { anchor: 'MDCAT Syllabus', href: '/mdcat-syllabus', description: 'Official 2026 MDCAT syllabus and topic weightage.', cta: 'View MDCAT Syllabus' },
    { anchor: 'Biology MCQs', href: '/subjects/biology', description: 'MDCAT-aligned Biology MCQs.', cta: 'Practice Biology MCQs' },
    { anchor: 'Chemistry MCQs', href: '/subjects/chemistry', description: 'MDCAT-aligned Chemistry MCQs.', cta: 'Practice Chemistry MCQs' },
    { anchor: 'Aggregate Calculator', href: '/tools/aggregate-calculator', description: 'Compute your MDCAT aggregate score.', cta: 'Open Aggregate Calculator' },
    { anchor: 'Custom Syllabus Builder', href: '/custom-syllabus', description: 'Build a personalised MDCAT practice plan.', cta: 'Open Syllabus Builder' },
    { anchor: 'Mock Tests', href: '/mock-tests', description: 'Full-length MDCAT mock tests.', cta: 'Take a Mock Test' },
  ],
  ecat: [
    { anchor: 'ECAT Preparation', href: '/ecat-preparation', description: 'Engineering admission test preparation.', cta: 'Start ECAT Prep' },
    { anchor: 'Physics MCQs', href: '/subjects/physics', description: 'ECAT-aligned Physics MCQs.', cta: 'Practice Physics MCQs' },
    { anchor: 'Maths MCQs', href: '/subjects/mathematics', description: 'ECAT-aligned Maths MCQs.', cta: 'Practice Maths MCQs' },
  ],
  css: [
    { anchor: 'Current Affairs MCQs', href: '/subjects/current-affairs', description: 'Daily Pakistan current-affairs MCQs.', cta: 'Practice Current Affairs' },
    { anchor: 'Pakistan Affairs MCQs', href: '/subjects/pakistan-affairs', description: 'Pakistan-history and politics MCQs.', cta: 'Practice Pakistan Affairs' },
    { anchor: 'English MCQs', href: '/subjects/english', description: 'CSS English Comprehension and Précis MCQs.', cta: 'Practice English MCQs' },
    { anchor: 'CSS MCQs', href: '/css-mcqs', description: 'CSS exam-style MCQs and mock tests.', cta: 'Practice CSS MCQs' },
  ],
  fpsc: [
    { anchor: 'FPSC MCQs', href: '/fpsc-past-papers', description: 'FPSC past-paper MCQs.', cta: 'Practice FPSC MCQs' },
    { anchor: 'General Knowledge MCQs', href: '/subjects/general-knowledge', description: 'GK MCQs aligned to FPSC.', cta: 'Practice GK MCQs' },
    { anchor: 'Pakistan Affairs MCQs', href: '/subjects/pakistan-affairs', description: 'Pakistan Affairs MCQs.', cta: 'Practice Pakistan Affairs' },
  ],
  ppsc: [
    { anchor: 'PPSC MCQs', href: '/ppsc-past-papers', description: 'PPSC topic-wise MCQs.', cta: 'Practice PPSC MCQs' },
    { anchor: 'General Knowledge MCQs', href: '/subjects/general-knowledge', description: 'GK MCQs aligned to PPSC.', cta: 'Practice GK MCQs' },
  ],
  nts: [
    { anchor: 'NTS MCQs', href: '/exams/nts', description: 'NTS-style MCQs across analytical, verbal and quantitative.', cta: 'Practice NTS MCQs' },
    { anchor: 'Past Papers', href: '/past-papers', description: 'NTS past papers archive.', cta: 'Browse Past Papers' },
  ],
  'study-guides': [
    { anchor: 'Study Guides', href: '/study-guides', description: 'In-depth preparation guides.', cta: 'Browse Study Guides' },
    { anchor: 'Custom Syllabus Builder', href: '/custom-syllabus', description: 'Build a personalised study plan.', cta: 'Open Syllabus Builder' },
    { anchor: 'Mock Tests', href: '/mock-tests', description: 'Full-length mock tests.', cta: 'Take a Mock Test' },
  ],
  'board-exams': [
    { anchor: 'Board MCQs', href: '/board-mcqs', description: 'Class 9–12 board MCQs by subject.', cta: 'Practice Board MCQs' },
    { anchor: '9th Class MCQs', href: '/9th-class-mcqs', description: 'Matric Part-I MCQ practice.', cta: 'Practice 9th MCQs' },
    { anchor: 'Past Papers', href: '/past-papers', description: 'Board past papers archive.', cta: 'Browse Past Papers' },
  ],
  admissions: [
    { anchor: 'NUST Entry Test', href: '/nust-entry-test', description: 'NUST NET preparation.', cta: 'Prepare for NUST NET' },
    { anchor: 'COMSATS Entry Test', href: '/comsats-entry-test', description: 'COMSATS admission test preparation.', cta: 'Prepare for COMSATS' },
    { anchor: 'Aggregate Calculator', href: '/tools/aggregate-calculator', description: 'Compute your aggregate score.', cta: 'Open Aggregate Calculator' },
  ],
  'government-jobs': [
    { anchor: 'Forces Jobs Tests', href: '/forces-jobs-tests', description: 'PAF, Army, ASF and Navy test prep.', cta: 'Browse Forces Tests' },
    { anchor: 'FPSC MCQs', href: '/fpsc-past-papers', description: 'FPSC past-paper MCQs.', cta: 'Practice FPSC MCQs' },
    { anchor: 'PPSC MCQs', href: '/ppsc-past-papers', description: 'PPSC topic-wise MCQs.', cta: 'Practice PPSC MCQs' },
  ],
  general: [
    { anchor: 'Subjects', href: '/subjects', description: 'Browse all MCQ subjects.', cta: 'Browse Subjects' },
    { anchor: 'Mock Tests', href: '/mock-tests', description: 'Full-length mock tests.', cta: 'Take a Mock Test' },
    { anchor: 'Tools', href: '/tools', description: 'Calculators and study utilities.', cta: 'Open Tools' },
  ],
};

export const BLOG_CATEGORIES = [
  'jobs', 'scholarships', 'mdcat', 'ecat', 'css', 'fpsc', 'ppsc', 'nts',
  'study-guides', 'board-exams', 'admissions', 'government-jobs', 'general',
] as const;

export type BlogCategory = typeof BLOG_CATEGORIES[number];

export function pickLinksForCategory(category: string | null | undefined, max = 8): CatalogueEntry[] {
  const key = (category || 'general').toLowerCase().trim() as BlogCategory;
  const entries = CATALOGUE[key] ?? CATALOGUE.general;
  return entries.slice(0, max);
}

export function isAllowedHref(href: string): boolean {
  if (!href) return false;
  return Object.values(CATALOGUE).some(arr => arr.some(e => e.href === href));
}

export default CATALOGUE;
