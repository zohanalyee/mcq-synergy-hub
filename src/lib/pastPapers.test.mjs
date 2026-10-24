import test from 'node:test';
import assert from 'node:assert/strict';
import { PAST_PAPER_PAGES, getPastPaperPage, PAST_PAPER_PATHS } from './pastPapers.js';

test('titles <= 60 and descriptions <= 155 characters', () => {
  for (const p of PAST_PAPER_PAGES) {
    assert.ok(p.title.length <= 60, `${p.title.length} ${p.title}`);
    assert.ok(p.description.length <= 155, `${p.description.length} ${p.description}`);
  }
});
test('NTHP page never mentions STS', () => {
  assert.doesNotMatch(JSON.stringify(getPastPaperPage('nthp')), /\bSTS\b/);
});
test('never calls our questions official or past papers', () => {
  for (const p of PAST_PAPER_PAGES) {
    assert.doesNotMatch(p.description, /official/i);
    assert.doesNotMatch(JSON.stringify(p), /our (official|past paper)|MCQsAI (official|past paper)/i);
  }
});
test('paths and FAQs', () => {
  assert.deepEqual(PAST_PAPER_PATHS, ['/nthp-past-papers', '/sthp-past-papers']);
  for (const p of PAST_PAPER_PAGES) assert.ok(p.faqs.length >= 5);
});
