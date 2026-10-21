// Deterministic content-safety rules (no AI, no DB). Shared by the admin PDF Builder
// and the Quality Gate. supabase/functions/_shared/contentSafety.js must be an exact
// copy of this file (a test enforces it).

export const SAFETY_LETTERS = ['A', 'B', 'C', 'D'];

export function safetyOptions(raw) {
  if (Array.isArray(raw)) return raw.map((o) => String(o ?? '').trim());
  if (raw && typeof raw === 'object') return SAFETY_LETTERS.map((k) => String(raw[k] ?? raw[k.toLowerCase()] ?? '').trim());
  return [];
}

/** Lower-case, strip punctuation and extra spaces. */
export function normStem(s) {
  return String(s ?? '').toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ').trim();
}
const squash = (s) => normStem(s).replace(/\s+/g, '');

/** Rule 5: four distinct options, none repeating the whole question. */
export function optionIssues(q) {
  const opts = safetyOptions(q.options);
  const out = [];
  if (opts.length === 4 && opts.every(Boolean) && new Set(opts.map(squash)).size !== 4) out.push('options_not_distinct');
  const stem = squash(q.question);
  if (stem && opts.some((o) => squash(o) === stem)) out.push('option_repeats_question');
  return out;
}

const DOUBT_RE = new RegExp([
  '\\bwait\\b', '\\blet me\\b', "\\blet'?s re-?evaluate\\b", '\\bre-?evaluat', '\\bre-?reading\\b', '\\brecheck', '\\brecalculat',
  '\\bthis contradicts\\b', '\\bquestion is flawed\\b', '\\bassuming the intent', '\\boptions? (provided |given )?(are|is) (not |in)correct',
  '\\bnone of the options\\b', '\\bnot among the options\\b', '\\bclosest option\\b',
].join('|'), 'i');
const COPY_RE = /\bthe document states\b|\bit states that\b|\bunder ['"‘“][^'"’”]{3,80}['"’”],? it states\b/i;
const ACCORDING_RE = /\baccording to the (document|passage|text)\b/i;
const HAS_PASSAGE_RE = /\b(passage|read the following|paragraph|extract|comprehension)\b/i;

/** Rule 6: self-doubt or copied-from-source explanations. */
export function explanationIssues(q) {
  const e = String(q.explanation ?? '');
  const out = [];
  if (DOUBT_RE.test(e)) out.push('doubtful_explanation');
  const hasPassage = HAS_PASSAGE_RE.test(String(q.question ?? '')) || String(q.question ?? '').length > 400;
  if (COPY_RE.test(e) || (ACCORDING_RE.test(e) && !hasPassage)) out.push('copied_from_source');
  return out;
}

export function isMathsLike(q) {
  return /math|quant|arith|algebra|geometry|numer|statistic|accounting|analytical|reasoning/i.test(`${q.subject ?? ''} ${q.topic ?? ''}`);
}

/**
 * Rule 9 (conservative): the explanation ENDS with a plain number
 * ("= 4.25", "answer is 50", "is 12."). Returns that number or null.
 * Fractions, units, percentages and words after the number are not judged.
 */
export function finalNumber(explanation) {
  const e = String(explanation ?? '').trim().replace(/\*+/g, '');
  const m = e.match(/(?:=|\bis|\bequals|\banswer:?)\s*(-?\d[\d,]*(?:\.\d+)?)\s*[.)]?\s*$/i);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}
const numbersIn = (s) => (String(s).match(/-?\d[\d,]*(?:\.\d+)?/g) || []).map((x) => Number(x.replace(/,/g, '')));

export function mathsIssues(q) {
  if (!isMathsLike(q)) return [];
  const n = finalNumber(q.explanation);
  if (n === null) return [];
  const opts = safetyOptions(q.options);
  const hit = opts.some((o) => {
    const nums = numbersIn(o);
    return nums.length === 1 && Math.abs(nums[0] - n) < 1e-9 && !/:/.test(o);
  });
  return hit ? [] : ['final_number_not_in_options'];
}

const LETTER_RE = /\b(?:option|choice|answer)\s*\(?([A-D])\)?(?![a-z])|\(([A-D])\)/g;

/** Distinct option letters an explanation mentions ("option C", "(C)"). */
export function letterRefs(explanation) {
  const set = new Set();
  for (const m of String(explanation ?? '').matchAll(LETTER_RE)) set.add((m[1] || m[2]).toUpperCase());
  return [...set];
}

/** Rule 10: more than one letter mentioned = unclear, exclude. One letter is remapped. */
export function letterIssues(q) {
  return letterRefs(q.explanation).length > 1 ? ['explanation_letter_unclear'] : [];
}

/** perm[k] = original letter now shown at position k. Rewrites "option C" to the shown letter. */
export function remapExplanation(explanation, perm) {
  return String(explanation ?? '').replace(LETTER_RE, (all, a, b) => {
    const orig = (a || b).toUpperCase();
    const shown = SAFETY_LETTERS[perm.indexOf(orig)];
    if (!shown) return all;
    return all.replace(/[A-D](?=\)?$|\)$)/, shown).replace(new RegExp(`\\b${orig}\\b`), shown);
  });
}

/** All per-question safety reasons (rules 5, 6, 9, 10-unclear). */
export function safetyReasons(q) {
  return [...optionIssues(q), ...explanationIssues(q), ...mathsIssues(q), ...letterIssues(q)];
}

const words = (s) => new Set(normStem(s).split(' ').filter((w) => w.length > 1));
export function overlap(a, b) {
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return 0;
  let n = 0;
  A.forEach((w) => { if (B.has(w)) n++; });
  return n / Math.min(A.size, B.size);
}
const answerText = (q) => {
  const opts = safetyOptions(q.options);
  const k = String(q.correct_answer ?? '').trim().toUpperCase();
  const i = SAFETY_LETTERS.indexOf(k);
  return normStem(i >= 0 ? opts[i] : q.correct_answer);
};

/** Rule 8: same normalised question, or same correct-answer text + ≥80% word overlap. */
export function isNearDuplicate(a, b) {
  const sa = normStem(a.question), sb = normStem(b.question);
  if (sa && sa === sb) return true;
  const ta = answerText(a);
  return !!ta && ta === answerText(b) && overlap(a.question, b.question) >= 0.8;
}

/** Ids of questions that near-duplicate an earlier one (input order wins). */
export function nearDuplicateIds(qs) {
  const dup = new Set();
  const byAnswer = new Map();
  const byStem = new Map();
  for (const q of qs) {
    const s = normStem(q.question);
    if (s && byStem.has(s)) { dup.add(q.id); continue; }
    if (s) byStem.set(s, q);
    const t = answerText(q);
    const group = byAnswer.get(t) || [];
    if (t && group.some((p) => overlap(p.question, q.question) >= 0.8)) { dup.add(q.id); continue; }
    group.push(q); byAnswer.set(t, group);
  }
  return dup;
}

/** Hide meaningless topic labels. */
export const displayTopic = (t) => (t && !/^\s*(unknown|general|n\/?a|none|-)\s*$/i.test(t) ? t : null);

export const REASON_LABELS = {
  options_not_distinct: 'Same options',
  option_repeats_question: 'Option repeats question',
  doubtful_explanation: 'Doubtful explanation',
  copied_from_source: 'Copied from a source',
  final_number_not_in_options: 'Maths answer not in options',
  explanation_letter_unclear: 'Unclear option letter',
  near_duplicate: 'Duplicate',
};
