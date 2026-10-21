import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { noAiReview, deterministicCheck, letterSkew, combineVerdict, poolFloor, findDuplicates } from './qualityChecks.ts';

const base = { id: '1', question: 'What is 2 + 2 equal to?', options: { A: '3', B: '4', C: '5', D: '6' }, correct_answer: 'B', explanation: 'Simple sum.' };

Deno.test('valid question passes', () => assertEquals(deterministicCheck(base).ok, true));
Deno.test('3 options fails', () => assertEquals(deterministicCheck({ ...base, options: ['3', '4', '5'] }).reasons.includes('not_4_options'), true));
Deno.test('duplicate options fails', () => assertEquals(deterministicCheck({ ...base, options: ['4', '4', '5', '6'] }).reasons.includes('duplicate_options'), true));
Deno.test('key not in options fails', () => assertEquals(deterministicCheck({ ...base, correct_answer: 'seven' }).reasons.includes('key_not_in_options'), true));
Deno.test('missing explanation fails', () => assertEquals(deterministicCheck({ ...base, explanation: '' }).reasons.includes('missing_explanation'), true));
Deno.test('figure dependency fails', () => assertEquals(deterministicCheck({ ...base, question: 'Refer to the figure and find x.' }).reasons.includes('figure_dependency'), true));
Deno.test('NTHP-like letter skew flagged', () => assertEquals(letterSkew({ A: 76, B: 73, C: 43, D: 9 }).skewed, true));
Deno.test('balanced letters not flagged', () => assertEquals(letterSkew({ A: 25, B: 25, C: 25, D: 25 }).skewed, false));
Deno.test('maths solve disagrees -> fail', () => assertEquals(combineVerdict('B', ['C'], true), 'fail'));
Deno.test('one of two factual disagrees -> needs_review', () => assertEquals(combineVerdict('B', ['B', 'C'], false), 'needs_review'));
Deno.test('AI unsure -> needs_review', () => assertEquals(combineVerdict('B', [null], true), 'needs_review'));
Deno.test('two factual agree -> pass', () => assertEquals(combineVerdict('B', ['B', 'B'], false), 'pass'));
Deno.test('pool floor 100 session, 140 pass of 300', () => assertEquals(poolFloor(100, 140, 300), { floor: 150, keepExtra: 10, shortfall: 10 }));
Deno.test('duplicate text found', () => assertEquals([...findDuplicates([base, { ...base, id: '2', question: 'what is 2+2 equal to' }])], ['2']));
Deno.test('v2: identical options -> needs_review', () => assertEquals(noAiReview([{ ...base, options: ['x', 'X', 'x ', 'y'] }])[0].ai_verdict, 'needs_review'));
Deno.test('v2: doubtful explanation -> needs_review', () => assertEquals(noAiReview([{ ...base, explanation: "Wait, let me recheck." }])[0].reasons.includes('doubtful_explanation'), true));
Deno.test('v2: maths answer not in options -> needs_review', () => assertEquals(noAiReview([{ ...base, subject: 'Mathematics', explanation: 'So the sum = 4.25' }])[0].reasons, ['final_number_not_in_options']));
Deno.test('v2: second copy marked near_duplicate', () => assertEquals(noAiReview([base, { ...base, id: '2' }])[1].reasons, ['near_duplicate']));
Deno.test('v2: clean question stays pending for AI', () => assertEquals(noAiReview([base])[0], { question_id: '1', deterministic_ok: true, reasons: [], ai_verdict: 'pending' }));
Deno.test('v2: missing explanation still fail', () => assertEquals(noAiReview([{ ...base, explanation: '' }])[0].ai_verdict, 'fail'));
