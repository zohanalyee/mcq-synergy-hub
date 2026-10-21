// Pure rules for the admin PDF Builder (no DOM, no network) — unit-tested.
import { isNthpTest, isStsTest } from '../programStatus.js';

export const SITE = 'https://mcqsai.com';
export const CHANNEL_FALLBACK = 'https://whatsapp.com/channel/0029Vb9DgAk8KMqkSpdiWV32';
export const LETTERS = ['A', 'B', 'C', 'D'];

/** Deterministic PRNG (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const newSeed = () => Math.floor(Math.random() * 2 ** 31);

/** Exam identity — STHP is checked before STS (STHP titles say "Sukkur IBA"). */
export function examKind(title, hubSlug) {
  const t = `${title || ''}`;
  if (hubSlug === 'nthp' || isNthpTest('', t)) return 'nthp';
  if (hubSlug === 'sthp' || /\bsthp\b|sindh talent hunt/i.test(t)) return 'sthp';
  if (hubSlug === 'sts' || isStsTest('', t)) return 'sts';
  return 'generic';
}

const ORIGINAL = 'Questions are original and were not copied from any official document.';
export function disclaimerFor(kind) {
  switch (kind) {
    case 'nthp': return `MCQsAI is an independent practice platform, not affiliated with IBA Karachi. ${ORIGINAL}`;
    case 'sthp': return `MCQsAI is an independent practice platform, not affiliated with Sukkur IBA University. ${ORIGINAL}`;
    case 'sts': return `MCQsAI is an independent practice platform, not affiliated with SIBA Testing Service (STS). ${ORIGINAL}`;
    default: return `MCQsAI is an independent practice platform and is not affiliated with any examining body. ${ORIGINAL}`;
  }
}
export function programLine(kind) {
  return { nthp: 'IBA Karachi National Talent Hunt Program', sthp: 'Sukkur IBA Sindh Talent Hunt Program', sts: 'SIBA Testing Service (STS)' }[kind] || '';
}

/** Default hub slug from the test identity, only if that slug exists. */
export function defaultHubSlug(title, slugs) {
  const kind = examKind(title, '');
  if (kind !== 'generic' && slugs.includes(kind)) return kind;
  const t = (title || '').toLowerCase();
  const hit = slugs.find((s) => new RegExp(`\\b${s.replace(/-/g, '[ -]')}\\b`).test(t));
  return hit || slugs[0] || '';
}

const BANNED = /\bofficial\b|past\s*papers?/i;
export const hasBannedWording = (text) => BANNED.test(text || '');

export function fileName(examLabel, n, setNo) {
  const exam = String(examLabel || 'Exam').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'Exam';
  return `${exam}-Free-Practice-Set-${n}-Questions-MCQsAI-set${setNo}.pdf`;
}
export const hubUrl = (slug, n) => `${SITE}/exams/${slug}?utm_source=pdf&utm_medium=free_pdf&utm_campaign=${slug}_${n}q`;
export function shareUrl(slug, label) {
  const url = `${SITE}/exams/${slug}?utm_source=whatsapp&utm_medium=pdf_share`;
  return `https://wa.me/?text=${encodeURIComponent(`Free ${label} practice set with answer key: ${url}`)}`;
}
export const suggestedMinutes = (n) => Math.max(10, Math.round(n * 1.2));

/** Latest-review status. "passed" = deterministic OK + AI pass; any other review = blocked. */
export function reviewStatus(review) {
  if (!review) return 'unreviewed';
  return review.deterministic_ok && review.ai_verdict === 'pass' ? 'passed' : 'blocked';
}
export function isEligible(q, review, { gateOnly = false, requireExplanation = false } = {}) {
  const st = reviewStatus(review);
  if (st === 'blocked') return false;
  if (gateOnly && st !== 'passed') return false;
  if (!gateOnly && !(q.admin_approved || st === 'passed')) return false;
  if (requireExplanation && !String(q.explanation || '').trim()) return false;
  return optionTexts(q.options).length === 4 && correctLetter(q) !== null;
}

export function optionTexts(options) {
  if (Array.isArray(options)) return options.map(String);
  if (options && typeof options === 'object') return LETTERS.map((k) => options[k]).filter((v) => v != null).map(String);
  return [];
}
export function correctLetter(q) {
  const raw = String(q.correct_answer || '').trim();
  if (LETTERS.includes(raw.toUpperCase()) && raw.length === 1) return raw.toUpperCase();
  const i = optionTexts(q.options).findIndex((o) => o.trim().toLowerCase() === raw.toLowerCase());
  return i >= 0 ? LETTERS[i] : null;
}

/** Largest-remainder split of n across sections by percentage. */
export function splitCounts(sections, n) {
  const total = sections.reduce((s, x) => s + (Number(x.percentage) || 0), 0) || sections.length;
  const raw = sections.map((x) => ((Number(x.percentage) || (total === sections.length ? 1 : 0)) / total) * n);
  const out = raw.map(Math.floor);
  let left = n - out.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
  return sections.map((x, i) => ({ subject: x.subject, count: out[i] }));
}

/** Pick per section from shuffled eligible pools. Never fills a short section. */
export function pickSet(poolsBySubject, split, seed) {
  const rand = rng(seed);
  const sections = split.map(({ subject, count }) => {
    const pool = shuffle(poolsBySubject[subject] || [], rand);
    return { subject, wanted: count, picked: pool.slice(0, count), reserve: pool.slice(count), short: Math.max(0, count - pool.length) };
  });
  return sections;
}

/**
 * Shuffle options per question, then balance correct letters across the set
 * (targets cycle A–D in a seeded order). Returns permutations: perm[k] = original letter shown at position k.
 */
export function balanceOptions(questions, seed) {
  const rand = rng(seed ^ 0x5bd1e995);
  const n = questions.length;
  const targets = shuffle(Array.from({ length: n }, (_, i) => LETTERS[i % 4]), rand);
  return questions.map((q, i) => {
    const orig = correctLetter(q);
    const others = shuffle(LETTERS.filter((l) => l !== orig), rand);
    const pos = LETTERS.indexOf(targets[i]);
    const perm = [];
    let o = 0;
    for (let k = 0; k < 4; k++) perm.push(k === pos ? orig : others[o++]);
    return perm;
  });
}
export function applyPerm(q, perm) {
  const texts = optionTexts(q.options);
  const orig = correctLetter(q);
  return { options: perm.map((l) => texts[LETTERS.indexOf(l)]), answer: LETTERS[perm.indexOf(orig)] };
}
export function letterCounts(answers) {
  const c = { A: 0, B: 0, C: 0, D: 0 };
  answers.forEach((a) => { c[a]++; });
  return c;
}
