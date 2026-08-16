/**
 * Exam TIER classification — keeps question REUSE inside the right difficulty
 * band.
 *
 * Why this exists: the concept-group reuse layer matched on subject NAME only
 * ("English" == "English"), so a CSS-level comprehension item could be linked
 * into a BPS-13 court-clerk paper. Subject equality is not scope equality.
 *
 * Tiers are ordered but reuse is STRICT same-tier only (plus untagged legacy
 * rows), by product decision — no cross-tier borrowing in either direction.
 */

export type ExamTier =
  | "clerical" // BPS 1-14: clerk, junior/assistant associate, naib qasid, LDC/UDC
  | "mid" // BPS 15-17: sub inspector, assistant director, ESE/SSE, tehsildar
  | "competitive" // CSS / PMS / PCS
  | "entry_test" // MDCAT / ECAT / NTS-NAT university entry
  | "academic"; // board classes 9-12

export const EXAM_TIERS: ExamTier[] = [
  "clerical",
  "mid",
  "competitive",
  "entry_test",
  "academic",
];

export function isExamTier(v: unknown): v is ExamTier {
  return typeof v === "string" && (EXAM_TIERS as string[]).includes(v);
}

const COMPETITIVE_PATTERNS = [
  /\bcss\b/i,
  /\bpms\b/i,
  /\bpcs\b/i,
  /central superior services/i,
  /provincial management service/i,
];

const ENTRY_TEST_PATTERNS = [
  /\bmdcat\b/i,
  /\becat\b/i,
  /\bnat\b/i,
  /\bnust\b/i,
  /\bnet\b(?!work)/i,
  /entry test/i,
  /admission test/i,
];

const ACADEMIC_PATTERNS = [
  /class\s*(9|10|11|12|ix|x|xi|xii)\b/i,
  /\b(9th|10th|11th|12th)\b/i,
  /\b(matric|inter|intermediate|fsc|f\.sc|hssc|ssc)\b/i,
  /\bboard\b/i,
];

const MID_PATTERNS = [
  /sub[- ]inspector/i,
  /assistant director/i,
  /\basi\b/i,
  /inspector/i,
  /tehsildar/i,
  /naib tehsildar/i,
  /\b(ese|sse|set|jest|pst|sst)\b/i,
  /lecturer/i,
  /\bofficer\b/i,
  /\bsupervisor\b/i,
  /\bsuperintendent\b/i,
  /\bauditor\b/i,
  /\binspector\b/i,
];

const CLERICAL_PATTERNS = [
  /\bclerk\b/i,
  /\bjunior\b/i,
  /\bassistant\b/i,
  /\bassociate\b/i,
  /\bnaib qasid\b/i,
  /\bldc\b/i,
  /\budc\b/i,
  /\bsteno/i,
  /\btypist\b/i,
  /\bdata entry\b/i,
  /\bconstable\b/i,
  /\bdriver\b/i,
  /\bcomputer operator\b/i,
];

/** Extract a BPS/BS grade number from a free-text job title. */
export function extractBps(title?: string | null): number | null {
  const t = String(title || "");
  const m = t.match(/\b(?:bps|bs|basic pay scale)\s*[-–:]?\s*(\d{1,2})\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n >= 1 && n <= 22 ? n : null;
}

/**
 * Derive the tier of a job test from its title (+ optional department).
 * BPS number wins when present; otherwise keyword rules; default "clerical"
 * because the bulk of the recruitment catalogue is BPS 5-14.
 */
export function tierForJobTest(jobTitle?: string | null, department?: string | null): ExamTier {
  const text = `${jobTitle || ""} ${department || ""}`.trim();

  for (const re of COMPETITIVE_PATTERNS) if (re.test(text)) return "competitive";
  for (const re of ENTRY_TEST_PATTERNS) if (re.test(text)) return "entry_test";
  for (const re of ACADEMIC_PATTERNS) if (re.test(text)) return "academic";

  const bps = extractBps(text);
  if (bps !== null) {
    if (bps >= 18) return "competitive";
    if (bps >= 15) return "mid";
    return "clerical";
  }

  for (const re of MID_PATTERNS) if (re.test(text)) return "mid";
  for (const re of CLERICAL_PATTERNS) if (re.test(text)) return "clerical";

  return "clerical";
}

/** Derive the tier of a content_items row from its exam metadata. */
export function tierForContentItem(
  examCategory?: string | null,
  governmentLevel?: string | null,
  subject?: string | null,
): ExamTier | null {
  const cat = String(examCategory || "").trim().toUpperCase();
  switch (cat) {
    case "CSS":
    case "PMS":
    case "PCS":
      return "competitive";
    case "UNI_ENTRY":
    case "MDCAT":
    case "ECAT":
      return "entry_test";
    case "BOARDS":
      return "academic";
    case "ASF":
      return "clerical";
    case "FPSC":
    case "PPSC":
    case "SPSC":
    case "KPPSC":
    case "BPSC":
    case "NTS":
      return "mid";
    default:
      break;
  }

  const text = `${governmentLevel || ""} ${subject || ""}`;
  for (const re of ACADEMIC_PATTERNS) if (re.test(text)) return "academic";
  return null;
}

/**
 * STRICT reuse compatibility: same tier only. Untagged (null) rows stay usable
 * so the legacy bank is not orphaned, but they are still style-checked.
 */
export function tierAllowsReuse(targetTier: ExamTier, sourceTier?: string | null): boolean {
  if (!sourceTier) return true; // legacy / untagged
  return sourceTier === targetTier;
}
