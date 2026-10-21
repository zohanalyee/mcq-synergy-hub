import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from './rules.js';

const mkQ = (i, subject, extra = {}) => ({ id: `q${i}`, subject, admin_approved: true, explanation: 'x', options: { A: `a${i}`, B: `b${i}`, C: `c${i}`, D: `d${i}` }, correct_answer: 'A', ...extra });

test('same seed rebuilds the same set and option order', () => {
  const pools = { M: Array.from({ length: 40 }, (_, i) => mkQ(i, 'M')) };
  const a = R.pickSet(pools, [{ subject: 'M', count: 20 }], 42)[0].picked.map((q) => q.id);
  const b = R.pickSet(pools, [{ subject: 'M', count: 20 }], 42)[0].picked.map((q) => q.id);
  assert.deepEqual(a, b);
  const qs = pools.M.slice(0, 20);
  assert.deepEqual(R.balanceOptions(qs, 7), R.balanceOptions(qs, 7));
});
test('answer letters balanced within ±1 even when every source answer is A', () => {
  const qs = Array.from({ length: 50 }, (_, i) => mkQ(i, 'M'));
  const perms = R.balanceOptions(qs, 123);
  const answers = qs.map((q, i) => R.applyPerm(q, perms[i]).answer);
  const c = Object.values(R.letterCounts(answers));
  assert.ok(Math.max(...c) - Math.min(...c) <= 1, JSON.stringify(c));
  qs.forEach((q, i) => { const r = R.applyPerm(q, perms[i]); assert.equal(r.options[R.LETTERS.indexOf(r.answer)], `a${i}`); });
});
test('short section is reported and never filled', () => {
  const s = R.pickSet({ M: [mkQ(1, 'M'), mkQ(2, 'M')] }, [{ subject: 'M', count: 5 }], 1)[0];
  assert.equal(s.picked.length, 2);
  assert.equal(s.short, 3);
});
test('needs_review and failed questions are excluded; unchecked unapproved excluded', () => {
  const q = mkQ(1, 'M');
  assert.equal(R.isEligible(q, { deterministic_ok: true, ai_verdict: 'needs_review' }), false);
  assert.equal(R.isEligible(q, { deterministic_ok: false, ai_verdict: 'pass' }), false);
  assert.equal(R.isEligible({ ...q, admin_approved: false }, null), false);
  assert.equal(R.isEligible(q, null), true);
});
test('Gate-passed only toggle keeps only passed questions', () => {
  const q = mkQ(1, 'M');
  assert.equal(R.isEligible(q, null, { gateOnly: true }), false);
  assert.equal(R.isEligible(q, { deterministic_ok: true, ai_verdict: 'pass' }, { gateOnly: true }), true);
});
test('only-with-explanation filter', () => {
  assert.equal(R.isEligible(mkQ(1, 'M', { explanation: ' ' }), null, { requireExplanation: true }), false);
});
test('"official" and "past paper" wording blocked; "Unofficial" allowed', () => {
  assert.ok(R.hasBannedWording('Official MDCAT set'));
  assert.ok(R.hasBannedWording('MDCAT Past Papers'));
  assert.equal(R.hasBannedWording('Unofficial practice set'), false);
});
test('NTHP disclaimer names IBA Karachi only (no STS, no Sukkur IBA)', () => {
  const d = R.disclaimerFor(R.examKind('IBA Karachi NTHP Mock Test 2027', 'nthp'));
  assert.match(d, /IBA Karachi/);
  assert.doesNotMatch(d, /\bSTS\b|Sukkur|SIBA/);
});
test('STHP disclaimer names Sukkur IBA University (not STS)', () => {
  const k = R.examKind('Sukkur IBA Sindh Talent Hunt Program (STHP) 2027', '');
  assert.equal(k, 'sthp');
  assert.match(R.disclaimerFor(k), /Sukkur IBA University/);
  assert.doesNotMatch(R.disclaimerFor(k), /\bSTS\b/);
});
test('STS disclaimer names SIBA Testing Service (STS)', () => {
  const k = R.examKind('IBA Community Colleges Teacher (STS)', 'sts');
  assert.equal(k, 'sts');
  assert.match(R.disclaimerFor(k), /SIBA Testing Service \(STS\)/);
});
test('generic disclaimer names no institution', () => {
  const d = R.disclaimerFor(R.examKind('Junior Clerk BPS 11', 'ppsc'));
  assert.doesNotMatch(d, /IBA|STS|Sukkur|Karachi|SIBA/);
});
test('default hub slugs: NTHP→nthp, STHP→sthp, STS→sts', () => {
  const slugs = ['mdcat', 'nthp', 'sthp', 'sts'];
  assert.equal(R.defaultHubSlug('IBA Karachi NTHP Mock Test 2027', slugs), 'nthp');
  assert.equal(R.defaultHubSlug('Sukkur IBA Sindh Talent Hunt Program (STHP) 2027', slugs), 'sthp');
  assert.equal(R.defaultHubSlug('Sindh High Court Steno (STS)', slugs), 'sts');
});
test('file name and UTM links', () => {
  assert.equal(R.fileName('NTHP', 50, 1), 'NTHP-Free-Practice-Set-50-Questions-MCQsAI-set1.pdf');
  assert.equal(R.hubUrl('nthp', 50), 'https://mcqsai.com/exams/nthp?utm_source=pdf&utm_medium=free_pdf&utm_campaign=nthp_50q');
  assert.match(decodeURIComponent(R.shareUrl('nthp', 'NTHP')), /mcqsai\.com\/exams\/nthp\?utm_source=whatsapp&utm_medium=pdf_share/);
});
test('split follows section ratio exactly (NTHP 53/47 → 26/24 of 50... largest remainder)', () => {
  assert.deepEqual(R.splitCounts([{ subject: 'M', percentage: 53 }, { subject: 'E', percentage: 47 }], 50).map((s) => s.count), [27, 23]);
  assert.deepEqual(R.splitCounts([{ subject: 'E', percentage: 40 }, { subject: 'M', percentage: 40 }, { subject: 'I', percentage: 20 }], 50).map((s) => s.count), [20, 20, 10]);
});
