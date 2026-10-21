import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as S from './contentSafety.js';

const q = (o) => ({ id: 'x', subject: 'Mathematics', topic: 'Averages', question: 'What is the average of 2, 4?', options: { A: '1', B: '3', C: '4', D: '6' }, correct_answer: 'B', explanation: 'Sum 6 / 2 = 3', ...o });

test('edge copy is identical', () => {
  assert.equal(readFileSync(new URL('../../supabase/functions/_shared/contentSafety.js', import.meta.url), 'utf8'), readFileSync(new URL('./contentSafety.js', import.meta.url), 'utf8'));
});
test('rule 5: Q10 four identical options excluded', () => assert.deepEqual(S.optionIssues(q({ options: { A: 'Ctrl + S', B: 'ctrl+s', C: 'Ctrl+S', D: 'CTRL + S' } })), ['options_not_distinct']));
test('rule 5: Q24 options A and D identical excluded', () => assert.ok(S.optionIssues(q({ options: { A: '=A2*B1', B: '=A2*B2', C: '=A1*B2', D: '=A2 * B1' } })).includes('options_not_distinct')));
test('rule 5: option repeating the stem excluded', () => assert.ok(S.optionIssues(q({ question: 'Capital of Sindh', options: ['Karachi', 'Capital of Sindh', 'Hyderabad', 'Sukkur'] })).includes('option_repeats_question')));
test('rule 5: normal options pass', () => assert.deepEqual(S.optionIssues(q({})), []));
test('rule 6: Q16 "Let\'s re-evaluate… Re-reading" excluded', () => assert.ok(S.explanationIssues(q({ explanation: "Let's re-evaluate. Re-reading the clue, I is left of K." })).includes('doubtful_explanation')));
test('rule 6: "question is flawed" excluded', () => assert.ok(S.explanationIssues(q({ explanation: 'All options are the same, so the question is flawed.' })).includes('doubtful_explanation')));
test('rule 6: Q45 "The document states" excluded', () => assert.ok(S.explanationIssues(q({ explanation: 'The document states that plants make food.' })).includes('copied_from_source')));
test('rule 6: "according to the passage" allowed when the question has a passage', () => {
  assert.deepEqual(S.explanationIssues(q({ question: 'Read the following passage and answer: ...', explanation: 'According to the passage, rain fell.' })), []);
  assert.ok(S.explanationIssues(q({ explanation: 'According to the passage, rain fell.' })).includes('copied_from_source'));
});
test('rule 6: clean explanation passes', () => assert.deepEqual(S.explanationIssues(q({})), []));
test('rule 7: Unknown topic hidden', () => { assert.equal(S.displayTopic('Unknown'), null); assert.equal(S.displayTopic('Algebra'), 'Algebra'); });
test('rule 8: Q23/Q28 same CPU question is a duplicate', () => {
  const a = q({ id: '1', question: 'Which part is called the brain of the computer?', options: ['RAM', 'CPU', 'Hard disk', 'Monitor'], correct_answer: 'B' });
  const b = q({ id: '2', question: 'Which part of a computer is called the brain of the computer?', options: ['CPU', 'ROM', 'Mouse', 'Printer'], correct_answer: 'A' });
  const c = q({ id: '3', question: 'Which key combination undoes the last action?', options: ['Ctrl+Y', 'Ctrl+Z', 'Ctrl+X', 'Ctrl+V'], correct_answer: 'B' });
  assert.equal(S.isNearDuplicate(a, b), true);
  assert.equal(S.isNearDuplicate(a, c), false);
  assert.deepEqual([...S.nearDuplicateIds([a, b, c])], ['2']);
});
test('rule 9: Q42 average 4.25 not among options excluded', () => assert.deepEqual(S.mathsIssues(q({ options: ['3.5', '4.0', '4.5', '5.0'], correct_answer: 'B', explanation: 'Sum = 17, so average = 17/4 = 4.25' })), ['final_number_not_in_options']));
test('rule 9: Q39 answer 50 but options are ratios excluded', () => assert.deepEqual(S.mathsIssues(q({ options: ['3:4', '2:3', '5:6', '4:5'], correct_answer: 'D', explanation: 'So the larger number is 50' })), ['final_number_not_in_options']));
test('rule 9: matching number passes; units / non-maths not judged', () => {
  assert.deepEqual(S.mathsIssues(q({})), []);
  assert.deepEqual(S.mathsIssues(q({ explanation: 'Speed is 50 km' })), []);
  assert.deepEqual(S.mathsIssues(q({ subject: 'English', explanation: 'It is 9' })), []);
});
test('rule 10: one letter remapped to the shuffled letter', () => {
  // original C now shown at position A
  assert.equal(S.remapExplanation('Option C is right; (C) shows it.', ['C', 'A', 'B', 'D']), 'Option A is right; (A) shows it.');
  assert.deepEqual(S.letterIssues(q({ explanation: 'Option C is right.' })), []);
});
test('rule 10: two letters mentioned is unclear and excluded', () => assert.deepEqual(S.letterIssues(q({ explanation: 'Option A is wrong, option C is right.' })), ['explanation_letter_unclear']));
