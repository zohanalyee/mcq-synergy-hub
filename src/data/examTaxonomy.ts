// Canonical Pakistan exam taxonomy.
// Mirrors the `exam_category` column on public.content_items.
// Used to tag, filter, and reuse questions while protecting exam relevance.

export const EXAM_CATEGORIES = [
  'FIA',
  'ASF',
  'FPSC',
  'PPSC',
  'NTS',
  'STS',
  'SPSC',
  'MDCAT',
  'ECAT',
  'CSS',
  'PMS',
  'BOARDS',
  'UNI_ENTRY',
] as const;

export type ExamCategory = (typeof EXAM_CATEGORIES)[number];

export const EXAM_CATEGORY_LABELS: Record<ExamCategory, string> = {
  FIA: 'FIA (Federal Investigation Agency)',
  ASF: 'ASF (Airport Security Force)',
  FPSC: 'FPSC (Federal Public Service Commission)',
  PPSC: 'PPSC (Punjab Public Service Commission)',
  NTS: 'NTS (National Testing Service)',
  STS: 'STS (SIBA Testing Service)',
  SPSC: 'SPSC (Sindh Public Service Commission)',
  MDCAT: 'MDCAT (Medical College Admission Test)',
  ECAT: 'ECAT (Engineering College Admission Test)',
  CSS: 'CSS (Central Superior Services)',
  PMS: 'PMS (Provincial Management Service)',
  BOARDS: 'Boards (Matric / FSc / Intermediate)',
  UNI_ENTRY: 'University Entry Tests (NUST, NUMS, COMSATS, etc.)',
};

// Quality grades that gate reuse. A/B reusable, C low priority, D/F excluded.
export type QualityGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export const REUSABLE_GRADES: QualityGrade[] = ['A', 'B', 'C'];
export const EXCLUDED_GRADES: QualityGrade[] = ['D', 'F'];

export const isReusableGrade = (grade?: string | null): boolean =>
  grade == null || REUSABLE_GRADES.includes(grade as QualityGrade);

// Phase 3 — DB Reuse Safety helper.
// Infer the exam category for a given exam/job-test context (organisation,
// title, or department text). Used to scope DB reuse so a question is only
// reused inside the same exam family — never leaked across exams.
// Returns undefined when no confident match is found (gate is then skipped
// and subject/topic/difficulty matching still protects relevance).
const EXAM_KEYWORDS: Record<ExamCategory, RegExp> = {
  FIA: /\bfia\b|federal investigation/i,
  ASF: /\basf\b|airport security/i,
  FPSC: /\bfpsc\b|federal public service|\bcss\b screening/i,
  PPSC: /\bppsc\b|punjab public service/i,
  NTS: /\bnts\b|national testing/i,
  STS: /\bsts\b|siba testing/i,
  SPSC: /\bspsc\b|sindh public service/i,
  MDCAT: /\bmdcat\b|medical college/i,
  ECAT: /\becat\b|engineering college/i,
  CSS: /\bcss\b|central superior/i,
  PMS: /\bpms\b|provincial management/i,
  BOARDS: /\bboard\b|matric|inter(mediate)?|\bf\.?sc\b|9th|10th|11th|12th/i,
  UNI_ENTRY: /entry test|\bnust\b|\bnums\b|comsats|university/i,
};

export const inferExamCategory = (...parts: (string | null | undefined)[]): ExamCategory | undefined => {
  const blob = parts.filter(Boolean).join(' ');
  if (!blob.trim()) return undefined;
  // Check specific exams before generic BOARDS/UNI_ENTRY.
  const ordered: ExamCategory[] = [
    'FIA', 'ASF', 'MDCAT', 'ECAT', 'PPSC', 'FPSC', 'SPSC', 'STS', 'NTS', 'CSS', 'PMS', 'UNI_ENTRY', 'BOARDS',
  ];
  for (const cat of ordered) {
    if (EXAM_KEYWORDS[cat].test(blob)) return cat;
  }
  return undefined;
};

