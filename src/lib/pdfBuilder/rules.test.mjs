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
test('A1: no confident hub match leaves hub empty (JOA never gets air-university)', () => {
  const slugs = ['air-university', 'aku', 'nthp', 'sthp', 'sts'];
  assert.equal(R.defaultHubSlug('Junior Office Associate (BPS-13)', slugs), '');
  assert.equal(R.defaultHubSlug('IBA Karachi NTHP Mock Test 2027', slugs), 'nthp');
});
test('A2: clean test names', () => {
  assert.equal(R.cleanTestName('Junior Office Associate (BPS-13)'), 'Junior Office Associate (BPS-13)');
  assert.equal(R.cleanTestName(' FIA Assistant'), 'FIA Assistant');
  assert.equal(R.cleanTestName('IBA Karachi NTHP Mock Test 2027 – English & Mathematics Practice'), 'IBA Karachi NTHP');
  assert.equal(R.cleanTestName('Official ECAT Syllabus & Entry Test Pattern'), 'ECAT');
  assert.equal(R.setTitle('Junior Office Associate (BPS-13)', 50), 'Junior Office Associate (BPS-13) Free Practice Set – 50 Questions');
});
test('A2: next set number and mock test link', () => {
  assert.equal(R.nextSetNumber([]), 1);
  assert.equal(R.nextSetNumber([{ set_number: 1 }, { set_number: 3 }]), 4);
  assert.equal(R.mockTestUrl('junior-office-associate-bps-13', 50, 'joa'), 'https://mcqsai.com/mock-tests/junior-office-associate-bps-13?start=1&utm_source=pdf&utm_medium=free_pdf&utm_campaign=joa_50q');
});
test('A3: duplicate names get department added', () => {
  const l = R.testLabels([{ job_title: 'Assistant ', department: 'FIA', status: 'published', n: 300 }, { job_title: 'Assistant', department: 'SPSC', status: 'draft', n: 200 }]);
  assert.deepEqual(l, ['Assistant (FIA) · published · 300 Q', 'Assistant (SPSC) · draft · 200 Q']);
});
test('sweep rows: no-AI OK + AI pending is eligible, needs_review/fail/deterministic fail blocked; Gate-only needs AI pass', () => {
  const q = { admin_approved: true, options: { A: '1', B: '2', C: '3', D: '4' }, correct_answer: 'A' };
  assert.equal(R.isEligible(q, { deterministic_ok: true, ai_verdict: 'pending' }), true);
  assert.equal(R.isEligible(q, { deterministic_ok: true, ai_verdict: 'pending' }, { gateOnly: true }), false);
  assert.equal(R.isEligible(q, { deterministic_ok: true, ai_verdict: 'fail' }), false);
  assert.equal(R.isEligible(q, { deterministic_ok: false, ai_verdict: 'pending' }), false);
});
test('latest review prefers the higher checker version', () => {
  const r = R.latestReviews([{ question_id: 'a', checker_version: 2, checked_at: '2026-01-01', deterministic_ok: true, ai_verdict: 'pending' }, { question_id: 'a', checker_version: 1, checked_at: '2026-02-01', deterministic_ok: true, ai_verdict: 'pass' }]);
  assert.equal(r.a.checker_version, 2);
});

// ---- Batch 8.2 ----
test('identity from organization: Admission & Examination Officer is STS', () => {
  const org = 'SIBA Testing Services (STS) / Sukkur IBA University';
  assert.equal(R.examKind('Admission & Examination Officer', '', org), 'sts');
  assert.equal(R.defaultHubSlug('Admission & Examination Officer', ['air-university', 'sts'], org), 'sts');
  assert.equal(R.announcementSite('sts'), 'iba-suk.edu.pk/sts');
  assert.match(R.disclaimerFor(R.examKind('Admission & Examination Officer', '', org)), /SIBA Testing Service/);
});
test('identity: NTHP from organization never STS; STHP; generic', () => {
  assert.equal(R.examKind('Fall 2027 test', '', 'IBA Karachi National Talent Hunt Program'), 'nthp');
  assert.doesNotMatch(R.disclaimerFor('nthp'), /STS|Sukkur/);
  assert.equal(R.examKind('Entry test', '', 'Sukkur IBA Sindh Talent Hunt Program (STHP)'), 'sthp');
  assert.equal(R.examKind('Assistant', '', 'Election Commission'), 'generic');
  assert.equal(R.announcementSite('generic'), '');
});
test('draft warning only when no public mock-test page exists', () => {
  const jt = [{ definition_id: 'd1' }];
  assert.equal(R.hasPublicPage('d1', jt), true);
  assert.equal(R.hasPublicPage('d2', jt), false);
});
test('footer keeps the site name with a long title', () => {
  const m = (s) => s.length;
  const f = R.fitFooter('MCQsAI · ', 'A'.repeat(200), ' · mcqsai.com', m, 80);
  assert.ok(f.endsWith(' · mcqsai.com') && f.length <= 80 && f.includes('…'));
  assert.equal(R.fitFooter('x ', 'short', ' y', m, 80), 'x short y');
});
test('sections joined with " · "', () => assert.equal(R.joinSections(['English', 'Computer / ICT', 'Admin & Office']), 'English · Computer / ICT · Admin & Office'));
test('all/none of the above and "both A and B" keep original order; letters stay balanced', () => {
  const lockedQs = [
    mkQ(1, 'M', { options: { A: 'x', B: 'y', C: 'z', D: 'All of the above' }, correct_answer: 'D' }),
    mkQ(2, 'M', { options: { A: 'x', B: 'y', C: 'Both A and B', D: 'w' }, correct_answer: 'C' }),
    mkQ(3, 'M', { options: { A: 'x', B: 'y', C: 'z', D: 'None of these' }, correct_answer: 'A' }),
    mkQ(4, 'M', { options: { A: 'x', B: 'y', C: 'z', D: 'A and C' }, correct_answer: 'D' }),
  ];
  lockedQs.forEach((q) => assert.equal(R.isOrderLocked(q), true));
  assert.equal(R.isOrderLocked(mkQ(9, 'M')), false);
  const qs = [...lockedQs, ...Array.from({ length: 36 }, (_, i) => mkQ(i + 10, 'M'))];
  const perms = R.balanceOptions(qs, 5);
  lockedQs.forEach((_, i) => assert.deepEqual(perms[i], ['A', 'B', 'C', 'D']));
  const c = Object.values(R.letterCounts(qs.map((q, i) => R.applyPerm(q, perms[i]).answer)));
  assert.ok(Math.max(...c) - Math.min(...c) <= 1, JSON.stringify(c));
});
test('topic cap: at most 2 per known topic, unknown topics not capped', () => {
  const t = (topic) => ({ topic });
  assert.equal(R.overTopicCap([t('Mail Merge'), t('mail merge')], t('Mail Merge')), true);
  assert.equal(R.overTopicCap([t('Mail Merge')], t('Mail Merge')), false);
  assert.equal(R.overTopicCap([t('General'), t('General')], t('General')), false);
});
test('same answer text + shared key term counts as duplicate', () => {
  const a = mkQ(1, 'M', { question: 'Outgoing letters are entered in which register?', options: { A: 'Dispatch register', B: 'x', C: 'y', D: 'z' } });
  const b = mkQ(2, 'M', { question: 'Which register records letters sent out of the office?', options: { A: 'p', B: 'Dispatch register', C: 'y', D: 'z' }, correct_answer: 'B' });
  const c = mkQ(3, 'M', { question: 'Name the book kept for visitors', options: { A: 'Dispatch register', B: 'x', C: 'y', D: 'z' } });
  assert.equal(R.sameAnswerAndTerm(a, b), true);
  assert.equal(R.sameAnswerAndTerm(a, c), false);
});
