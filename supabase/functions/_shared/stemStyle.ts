/**
 * Exam-MCQ stem style rules (shared by the generator and the quality gate).
 *
 * Why this exists: AI batches for clerical posts (e.g. "Junior Office Associate
 * BPS-13") were producing 400-550 character comprehension passages and
 * multi-line puzzle set-ups. Those are the wrong GENRE for a one-line Pakistani
 * recruitment MCQ, even though they are structurally valid 4-option questions.
 *
 * The caps are per-subject: reasoning subjects legitimately need a longer stem,
 * everything else must stay a single short sentence.
 */

/** Subjects allowed a longer stem (condition-based puzzles). */
const REASONING_PATTERNS = [
  "analytical",
  "logical",
  " iq",
  "iq ",
  "reasoning",
  "intelligence",
  "mental ability",
  "quantitative",
  "math",
];

export const REASONING_STEM_MAX = 320;
export const STANDARD_STEM_MAX = 180;

export function isReasoningSubject(subject?: string | null): boolean {
  const s = (subject || "").toLowerCase();
  return REASONING_PATTERNS.some((p) => s.includes(p.trim()));
}

/** Maximum allowed stem length for a subject. */
export function stemLimitFor(subject?: string | null): number {
  return isReasoningSubject(subject) ? REASONING_STEM_MAX : STANDARD_STEM_MAX;
}

/** Essay / comprehension genres that are never valid in an exam MCQ stem. */
const BANNED_GENRE_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "comprehension_passage", re: /read the following (passage|paragraph|text|extract)/i },
  { label: "comprehension_passage", re: /\b(passage|extract) (below|above|given)\b/i },
  { label: "essay_prompt", re: /\bwrite (a|an|short|down) (essay|note|paragraph|letter|application|summary)\b/i },
  { label: "essay_prompt", re: /\b(essay|precis|précis) (writing|question|topic)\b/i },
  { label: "open_ended", re: /\b(discuss|elaborate|describe in detail|explain in detail|critically analyse|critically analyze)\b/i },
  { label: "open_ended", re: /\bin your own words\b/i },
];

export interface StemCheck {
  ok: boolean;
  /** Machine-readable reason, e.g. "stem_too_long" or "genre:essay_prompt". */
  reason?: string;
  length: number;
  limit: number;
}

/**
 * Validate one question stem against its subject's style rules.
 * `allowMultiLine` is true for reasoning subjects, where numbered conditions
 * are a normal part of the stem.
 */
export function checkStemStyle(question: string, subject?: string | null): StemCheck {
  const text = (question || "").trim();
  const limit = stemLimitFor(subject);
  const length = text.length;

  for (const g of BANNED_GENRE_PATTERNS) {
    if (g.re.test(text)) {
      return { ok: false, reason: `genre:${g.label}`, length, limit };
    }
  }

  if (length > limit) {
    return { ok: false, reason: "stem_too_long", length, limit };
  }

  // Multi-line numbered condition lists only belong in reasoning subjects.
  if (!isReasoningSubject(subject)) {
    const lines = text.split(/\n+/).filter((l) => l.trim().length > 0);
    if (lines.length > 2) {
      return { ok: false, reason: "multiline_stem", length, limit };
    }
  }

  return { ok: true, length, limit };
}

/** Prompt text injected into every generation request. */
export function stemStyleRules(subject?: string | null): string {
  const limit = stemLimitFor(subject);
  const reasoning = isReasoningSubject(subject);
  return `STEM STYLE RULES (STRICT — questions breaking these are discarded):
- The question stem must be ONE short sentence, at most ${limit} characters.
- Real Pakistani recruitment papers use direct one-line items. NEVER write a comprehension passage, a story, a case study, or an essay prompt.
- BANNED openings/verbs: "Read the following passage", "Read the following paragraph", "Write a note/essay/paragraph/letter", "Discuss", "Explain in detail", "Describe in detail", "In your own words", "Precis".
- Do not put the answer content inside the stem; keep the facts in the options.
${
    reasoning
      ? "- This is a reasoning subject: a compact set of conditions is allowed, but keep the whole stem under the character limit."
      : "- Single line only: no numbered condition lists, no multi-line set-ups."
  }`;
}
