// Semantic relationship graph for internal linking.
// Hand-curated, intentional, educational. No runtime AI, no auto-generation.
// Each entity slug maps to related entities a learner would logically explore next.

export type EntityKind =
  | 'exam'
  | 'subject'
  | 'tool'
  | 'scholarship-hub'
  | 'job-hub'
  | 'blog-topic'
  | 'seo-page';

export type RelationReason =
  | 'syllabus'
  | 'prep-tool'
  | 'related-exam'
  | 'eligibility'
  | 'next-step'
  | 'past-papers'
  | 'university';

export interface Relation {
  kind: EntityKind;
  /** Route path, e.g. '/exams/mdcat' or '/tools/aggregate-calculator' */
  path: string;
  label: string;
  reason: RelationReason;
  /** Relative strength of the link — drives ordering. */
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Map keyed by entity slug. Keys are intentionally human-readable and stable
 * (use the route segment, e.g. 'mdcat', 'ecat', 'nust-entry-test').
 */
export const semanticGraph: Record<string, Relation[]> = {
  mdcat: [
    { kind: 'seo-page', path: '/mdcat-past-papers', label: 'MDCAT Past Papers', reason: 'past-papers', priority: 'high' },
    { kind: 'seo-page', path: '/mdcat-syllabus-2026', label: 'MDCAT Syllabus 2026', reason: 'syllabus', priority: 'high' },
    { kind: 'tool', path: '/tools/aggregate-calculator', label: 'MDCAT Aggregate Calculator', reason: 'prep-tool', priority: 'high' },
    { kind: 'subject', path: '/subjects', label: 'Biology MCQs', reason: 'syllabus', priority: 'high' },
    { kind: 'subject', path: '/subjects', label: 'Chemistry MCQs', reason: 'syllabus', priority: 'medium' },
    { kind: 'exam', path: '/exams/ecat', label: 'ECAT Preparation', reason: 'related-exam', priority: 'low' },
  ],
  ecat: [
    { kind: 'seo-page', path: '/ecat-preparation', label: 'ECAT Preparation Guide', reason: 'syllabus', priority: 'high' },
    { kind: 'seo-page', path: '/nust-entry-test', label: 'NUST Entry Test', reason: 'related-exam', priority: 'high' },
    { kind: 'seo-page', path: '/engineering-universities-entry-test', label: 'Engineering Universities Entry Test', reason: 'university', priority: 'high' },
    { kind: 'tool', path: '/tools/gpa-calculator', label: 'GPA Calculator', reason: 'prep-tool', priority: 'medium' },
    { kind: 'exam', path: '/exams/mdcat', label: 'MDCAT Preparation', reason: 'related-exam', priority: 'low' },
  ],
  nts: [
    { kind: 'exam', path: '/exams/fpsc', label: 'FPSC Preparation', reason: 'related-exam', priority: 'high' },
    { kind: 'exam', path: '/exams/ppsc', label: 'PPSC Preparation', reason: 'related-exam', priority: 'high' },
    { kind: 'seo-page', path: '/forces-jobs-tests', label: 'Forces Jobs Tests', reason: 'related-exam', priority: 'medium' },
  ],
  fpsc: [
    { kind: 'seo-page', path: '/fpsc-past-papers', label: 'FPSC Past Papers', reason: 'past-papers', priority: 'high' },
    { kind: 'exam', path: '/exams/css', label: 'CSS Preparation', reason: 'related-exam', priority: 'high' },
    { kind: 'exam', path: '/exams/ppsc', label: 'PPSC Preparation', reason: 'related-exam', priority: 'medium' },
    { kind: 'exam', path: '/exams/nts', label: 'NTS Preparation', reason: 'related-exam', priority: 'medium' },
  ],
  ppsc: [
    { kind: 'seo-page', path: '/ppsc-past-papers', label: 'PPSC Past Papers', reason: 'past-papers', priority: 'high' },
    { kind: 'exam', path: '/exams/fpsc', label: 'FPSC Preparation', reason: 'related-exam', priority: 'high' },
    { kind: 'exam', path: '/exams/css', label: 'CSS Preparation', reason: 'related-exam', priority: 'medium' },
  ],
  css: [
    { kind: 'seo-page', path: '/css-mcqs-practice', label: 'CSS MCQs Practice', reason: 'prep-tool', priority: 'high' },
    { kind: 'exam', path: '/exams/pms', label: 'PMS Preparation', reason: 'related-exam', priority: 'high' },
    { kind: 'exam', path: '/exams/fpsc', label: 'FPSC Preparation', reason: 'related-exam', priority: 'medium' },
  ],
  pms: [
    { kind: 'exam', path: '/exams/css', label: 'CSS Preparation', reason: 'related-exam', priority: 'high' },
    { kind: 'exam', path: '/exams/ppsc', label: 'PPSC Preparation', reason: 'related-exam', priority: 'medium' },
  ],
  // SEO landing pages
  'mdcat-past-papers':       [{ kind: 'exam', path: '/exams/mdcat', label: 'MDCAT Preparation', reason: 'next-step', priority: 'high' }, { kind: 'seo-page', path: '/mdcat-syllabus-2026', label: 'MDCAT Syllabus 2026', reason: 'syllabus', priority: 'high' }],
  'mdcat-syllabus-2026':     [{ kind: 'exam', path: '/exams/mdcat', label: 'MDCAT Preparation', reason: 'next-step', priority: 'high' }, { kind: 'seo-page', path: '/mdcat-past-papers', label: 'MDCAT Past Papers', reason: 'past-papers', priority: 'high' }],
  'ecat-preparation':        [{ kind: 'exam', path: '/exams/ecat', label: 'ECAT Exam Details', reason: 'next-step', priority: 'high' }, { kind: 'seo-page', path: '/nust-entry-test', label: 'NUST Entry Test', reason: 'related-exam', priority: 'high' }, { kind: 'seo-page', path: '/engineering-universities-entry-test', label: 'Engineering Universities', reason: 'university', priority: 'medium' }],
  'nust-entry-test':         [{ kind: 'seo-page', path: '/ecat-preparation', label: 'ECAT Preparation', reason: 'related-exam', priority: 'high' }, { kind: 'seo-page', path: '/engineering-universities-entry-test', label: 'Engineering Universities', reason: 'university', priority: 'medium' }],
  'comsats-entry-test':      [{ kind: 'seo-page', path: '/nust-entry-test', label: 'NUST Entry Test', reason: 'related-exam', priority: 'high' }, { kind: 'seo-page', path: '/ecat-preparation', label: 'ECAT Preparation', reason: 'related-exam', priority: 'medium' }],
  'punjab-university-entry-test':            [{ kind: 'seo-page', path: '/ecat-preparation', label: 'ECAT Preparation', reason: 'related-exam', priority: 'high' }],
  'sindh-universities-entry-test':           [{ kind: 'seo-page', path: '/ecat-preparation', label: 'ECAT Preparation', reason: 'related-exam', priority: 'high' }],
  'engineering-universities-entry-test':     [{ kind: 'seo-page', path: '/nust-entry-test', label: 'NUST Entry Test', reason: 'related-exam', priority: 'high' }, { kind: 'seo-page', path: '/ecat-preparation', label: 'ECAT Preparation', reason: 'related-exam', priority: 'high' }],
  'fpsc-past-papers':        [{ kind: 'exam', path: '/exams/fpsc', label: 'FPSC Preparation', reason: 'next-step', priority: 'high' }, { kind: 'exam', path: '/exams/css', label: 'CSS Preparation', reason: 'related-exam', priority: 'medium' }],
  'ppsc-past-papers':        [{ kind: 'exam', path: '/exams/ppsc', label: 'PPSC Preparation', reason: 'next-step', priority: 'high' }, { kind: 'exam', path: '/exams/fpsc', label: 'FPSC Preparation', reason: 'related-exam', priority: 'medium' }],
  'css-mcqs-practice':       [{ kind: 'exam', path: '/exams/css', label: 'CSS Exam Details', reason: 'next-step', priority: 'high' }, { kind: 'exam', path: '/exams/pms', label: 'PMS Preparation', reason: 'related-exam', priority: 'medium' }],
  'pst-sst-test-preparation':[{ kind: 'seo-page', path: '/9th-class-mcqs', label: '9th Class MCQs', reason: 'syllabus', priority: 'medium' }, { kind: 'seo-page', path: '/board-mcqs', label: 'Board MCQs', reason: 'syllabus', priority: 'medium' }],
  '9th-class-mcqs':          [{ kind: 'seo-page', path: '/board-mcqs', label: 'Board MCQs', reason: 'related-exam', priority: 'high' }, { kind: 'tool', path: '/tools/gpa-calculator', label: 'GPA Calculator', reason: 'prep-tool', priority: 'medium' }],
  'board-mcqs':              [{ kind: 'seo-page', path: '/9th-class-mcqs', label: '9th Class MCQs', reason: 'syllabus', priority: 'high' }, { kind: 'exam', path: '/exams/mdcat', label: 'MDCAT Preparation', reason: 'next-step', priority: 'medium' }],
  'pak-army-test':           [{ kind: 'seo-page', path: '/paf-test', label: 'PAF Test', reason: 'related-exam', priority: 'high' }, { kind: 'seo-page', path: '/forces-jobs-tests', label: 'Forces Jobs Tests', reason: 'related-exam', priority: 'high' }],
  'paf-test':                [{ kind: 'seo-page', path: '/pak-army-test', label: 'Pak Army Test', reason: 'related-exam', priority: 'high' }, { kind: 'seo-page', path: '/asf-test', label: 'ASF Test', reason: 'related-exam', priority: 'medium' }],
  'asf-test':                [{ kind: 'seo-page', path: '/pak-army-test', label: 'Pak Army Test', reason: 'related-exam', priority: 'high' }, { kind: 'seo-page', path: '/paf-test', label: 'PAF Test', reason: 'related-exam', priority: 'medium' }],
  'forces-jobs-tests':       [{ kind: 'seo-page', path: '/pak-army-test', label: 'Pak Army Test', reason: 'related-exam', priority: 'high' }, { kind: 'seo-page', path: '/paf-test', label: 'PAF Test', reason: 'related-exam', priority: 'high' }, { kind: 'seo-page', path: '/asf-test', label: 'ASF Test', reason: 'related-exam', priority: 'medium' }],

  // Hubs for dynamic detail pages
  'scholarships-hub': [
    { kind: 'seo-page', path: '/scholarships', label: 'All Scholarships', reason: 'related-exam', priority: 'high' },
    { kind: 'seo-page', path: '/nust-entry-test', label: 'NUST Entry Test', reason: 'university', priority: 'high' },
    { kind: 'seo-page', path: '/punjab-university-entry-test', label: 'Punjab University Entry Test', reason: 'university', priority: 'medium' },
    { kind: 'tool', path: '/tools/aggregate-calculator', label: 'Aggregate Calculator', reason: 'prep-tool', priority: 'medium' },
  ],
  'jobs-hub': [
    { kind: 'seo-page', path: '/jobs', label: 'All Government Jobs', reason: 'related-exam', priority: 'high' },
    { kind: 'seo-page', path: '/forces-jobs-tests', label: 'Forces Jobs Tests', reason: 'related-exam', priority: 'high' },
    { kind: 'exam', path: '/exams/nts', label: 'NTS Preparation', reason: 'prep-tool', priority: 'high' },
    { kind: 'exam', path: '/exams/fpsc', label: 'FPSC Preparation', reason: 'prep-tool', priority: 'medium' },
    { kind: 'exam', path: '/exams/ppsc', label: 'PPSC Preparation', reason: 'prep-tool', priority: 'medium' },
  ],
  'blog-hub': [
    { kind: 'seo-page', path: '/blog', label: 'All Articles', reason: 'related-exam', priority: 'high' },
    { kind: 'exam', path: '/exams/mdcat', label: 'MDCAT Preparation', reason: 'related-exam', priority: 'medium' },
    { kind: 'exam', path: '/exams/css', label: 'CSS Preparation', reason: 'related-exam', priority: 'medium' },
  ],
  'mdcat-syllabus-2026': [
    { kind: 'exam', path: '/exams/mdcat', label: 'MDCAT Preparation', reason: 'next-step', priority: 'high' },
    { kind: 'seo-page', path: '/mdcat-past-papers', label: 'MDCAT Past Papers', reason: 'past-papers', priority: 'high' },
    { kind: 'seo-page', path: '/ecat-preparation', label: 'ECAT Preparation', reason: 'related-exam', priority: 'low' },
  ],
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

export function getRelated(slug: string, kinds?: EntityKind[], limit = 6): Relation[] {
  const raw = semanticGraph[slug] ?? [];
  const filtered = kinds?.length ? raw.filter(r => kinds.includes(r.kind)) : raw;
  return [...filtered]
    .sort((a, b) => (PRIORITY_ORDER[a.priority ?? 'medium'] - PRIORITY_ORDER[b.priority ?? 'medium']))
    .slice(0, limit);
}
