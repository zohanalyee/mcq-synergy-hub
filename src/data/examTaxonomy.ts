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
