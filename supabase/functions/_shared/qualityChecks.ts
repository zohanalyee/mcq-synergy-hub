// Pure, deterministic quality rules for mock-test questions (no AI, no DB).
// Used by the quality-gate edge function; covered by qualityChecks_test.ts.

import { safetyReasons, nearDuplicateIds } from './contentSafety.js';

export const CHECKER_VERSION = 3; // v3: AI asked for exactly-one-correct, key match and explanation agreement
export const LETTERS = ['A', 'B', 'C', 'D'] as const;

export interface QuestionLike {
  id: string;
  question: string;
  options: unknown;
  correct_answer: string;
  explanation?: string | null;
  subject?: string | null;
  topic?: string | null;
}

export function normalizeOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((o) => String(o ?? '').trim());
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    return LETTERS.map((k) => String(o[k] ?? o[k.toLowerCase()] ?? '').trim());
  }
  return [];
}

/** Returns the correct letter (A-D) or null when the key is not among the options. */
export function correctLetter(q: QuestionLike): string | null {
  const opts = normalizeOptions(q.options);
  const key = String(q.correct_answer ?? '').trim();
  const up = key.toUpperCase();
  if (LETTERS.includes(up as any) && opts[LETTERS.indexOf(up as any)]) return up;
  const idx = opts.findIndex((o) => o.toLowerCase() === key.toLowerCase());
  return idx >= 0 && idx < 4 ? LETTERS[idx] : null;
}

const FIGURE_RE = /\b(see|refer to|shown in|given in|look at|in) (the )?(figure|diagram|graph|image|picture|table below|chart)\b|\bfigure \d|\bdiagram below\b/i;

export function normText(s: string): string {
  return String(s ?? '').toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ').trim();
}

export interface DetResult { ok: boolean; reasons: string[]; }

export function deterministicCheck(q: QuestionLike, bannedTopics: string[] = []): DetResult {
  const reasons: string[] = [];
  const opts = normalizeOptions(q.options);
  if (opts.length !== 4 || opts.some((o) => !o)) reasons.push('not_4_options');
  else if (new Set(opts.map((o) => o.toLowerCase())).size !== 4) reasons.push('duplicate_options');
  if (!correctLetter(q)) reasons.push('key_not_in_options');
  if (!String(q.explanation ?? '').trim()) reasons.push('missing_explanation');
  const text = String(q.question ?? '');
  if (FIGURE_RE.test(text)) reasons.push('figure_dependency');
  if (text.trim().length < 8) reasons.push('question_too_short');
  if (text.length > 600) reasons.push('question_too_long');
  if (opts.some((o) => o.length > 200)) reasons.push('option_too_long');
  const hay = normText(`${text} ${q.topic ?? ''}`);
  for (const b of bannedTopics) {
    const n = normText(b);
    if (n && hay.includes(n)) { reasons.push(`banned_topic:${b}`); break; }
  }
  return { ok: reasons.length === 0, reasons };
}

/** Ids of questions whose normalized text repeats an earlier one in the same test. */
export function findDuplicates(qs: QuestionLike[]): Set<string> {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const q of qs) {
    const n = normText(q.question);
    if (!n) continue;
    if (seen.has(n)) dup.add(q.id); else seen.add(n);
  }
  return dup;
}

/** Answer-letter skew: flagged when any letter is >40% or <10% of a pool of 20+. */
export function letterSkew(counts: Record<string, number>): { skewed: boolean; shares: Record<string, number> } {
  const total = LETTERS.reduce((s, l) => s + (counts[l] || 0), 0);
  const shares: Record<string, number> = {};
  let skewed = false;
  for (const l of LETTERS) {
    shares[l] = total ? (counts[l] || 0) / total : 0;
    if (total >= 20 && (shares[l] > 0.4 || shares[l] < 0.1)) skewed = true;
  }
  return { skewed, shares };
}

export function isNumericSubject(subject?: string | null, topic?: string | null): boolean {
  return /math|quant|arith|algebra|geometry|numer|statistic|accounting/i.test(`${subject ?? ''} ${topic ?? ''}`);
}

export type Verdict = 'pass' | 'fail' | 'needs_review';

/**
 * Combine blind AI answers with the key.
 * Numeric: one solve; disagree -> fail, unsure -> needs_review.
 * Factual: two answers must both match; any disagreement/unsure -> needs_review.
 */
export function combineVerdict(key: string, answers: (string | null)[], numeric: boolean): Verdict {
  const clean = answers.map((a) => (a ? a.trim().toUpperCase() : null));
  if (clean.length === 0 || clean.some((a) => !a || !LETTERS.includes(a as any))) return 'needs_review';
  if (numeric) return clean[0] === key ? 'pass' : 'fail';
  return clean.every((a) => a === key) ? 'pass' : 'needs_review';
}

/** v3 AI fields per question. */
export interface AiCheck { answer?: string | null; correct_options?: unknown; key_matches?: unknown; explanation_agrees?: unknown }

/**
 * v3 verdict: combineVerdict, then needs_review when the AI reports more than one
 * correct option, says the stated key is wrong, or says the explanation disagrees.
 * A numeric "fail" stays "fail".
 */
export function strictVerdict(key: string, per: (AiCheck | null)[], numeric: boolean): { verdict: Verdict; reasons: string[] } {
  const base = combineVerdict(key, per.map((x) => x?.answer ?? null), numeric);
  const reasons: string[] = [];
  const multi = per.some((x) => Array.isArray(x?.correct_options) && new Set((x!.correct_options as unknown[]).map((l) => String(l).trim().toUpperCase()).filter((l) => (LETTERS as readonly string[]).includes(l))).size > 1);
  if (multi) reasons.push('multiple_correct');
  if (per.some((x) => x?.key_matches === false)) reasons.push('key_mismatch');
  if (per.some((x) => x?.explanation_agrees === false)) reasons.push('explanation_disagrees');
  if (base === 'fail') return { verdict: 'fail', reasons };
  return { verdict: reasons.length ? 'needs_review' : base, reasons };
}

/**
 * Pool floor: strict filtering may never leave fewer than ceil(1.5 x session).
 * Returns how many non-pass questions must be kept back and the shortfall.
 */
export function poolFloor(sessionSize: number, passCount: number, totalCount: number) {
  const floor = Math.ceil(sessionSize * 1.5);
  const keepExtra = Math.max(0, Math.min(floor - passCount, totalCount - passCount));
  const shortfall = Math.max(0, floor - passCount);
  return { floor, keepExtra, shortfall };
}

/** Reasons from v1 that mean "broken" (fail); safety-rule reasons only mean needs_review. */
const SAFETY = new Set(['options_not_distinct', 'option_repeats_question', 'doubtful_explanation', 'copied_from_source', 'final_number_not_in_options', 'explanation_letter_unclear', 'near_duplicate']);

/**
 * Checker v2 no-AI result for every question of one test.
 * verdict: 'pending' (AI still to check), 'needs_review' (safety rules only) or 'fail'.
 */
export function noAiReview(qs: QuestionLike[], bannedTopics: string[] = []) {
  const dups = nearDuplicateIds(qs as any);
  return qs.map((q) => {
    const d = deterministicCheck(q, bannedTopics);
    const reasons = [...d.reasons.filter((r) => r !== 'duplicate_options'), ...safetyReasons(q as any)];
    if (d.reasons.includes('duplicate_options') && !reasons.includes('options_not_distinct')) reasons.push('options_not_distinct');
    if (dups.has(q.id)) reasons.push('near_duplicate');
    const uniq = [...new Set(reasons)];
    // A missing explanation is noted but does not block (the PDF has its own explanation switch).
    const ok = uniq.every((r) => r === 'missing_explanation');
    const verdict = ok ? 'pending' : uniq.every((r) => SAFETY.has(r) || r === 'missing_explanation') ? 'needs_review' : 'fail';
    return { question_id: q.id, deterministic_ok: ok, reasons: uniq, ai_verdict: verdict };
  });
}
