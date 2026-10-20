import test from 'node:test';
import assert from 'node:assert/strict';
import { pkToday, cardState, parseDateText, resolveDeadline, visibleCards, isValidHref } from './featuredCards.js';

const facts = {
  sthp: { applyBy: '29 October 2026' },
  nthp: { rounds: [{ closesIso: '2026-12-15' }, { closesIso: '2027-02-01' }] },
};
const card = (o) => ({ title: 't', subtitle: '', badge: 'APPLY NOW', href: '/exams/x', is_active: true, placements: 'both', ...o });

test('Pakistan day rolls over at 19:00 UTC', () => {
  assert.equal(pkToday(Date.parse('2026-10-20T18:59:00Z')), '2026-10-20');
  assert.equal(pkToday(Date.parse('2026-10-20T19:00:00Z')), '2026-10-21');
});
test('days left counted in Pakistan days', () => {
  assert.equal(cardState(card({ deadline_date: '2026-10-29' }), {}, '2026-10-01').note, '28 days left');
});
test('CLOSING SOON at 7 days or fewer', () => {
  assert.equal(cardState(card({ deadline_date: '2026-10-29' }), {}, '2026-10-22').badge, 'CLOSING SOON');
  assert.equal(cardState(card({ deadline_date: '2026-10-29' }), {}, '2026-10-21').badge, 'APPLY NOW');
});
test('hidden day after deadline when closed_days=0', () => {
  assert.equal(cardState(card({ deadline_date: '2026-10-29' }), {}, '2026-10-29').note, 'Last day');
  assert.equal(cardState(card({ deadline_date: '2026-10-29' }), {}, '2026-10-30'), null);
});
test('Closed kept for N days then hidden', () => {
  assert.equal(cardState(card({ deadline_date: '2026-10-29', closed_days: 3 }), {}, '2026-11-01').badge, 'CLOSED');
  assert.equal(cardState(card({ deadline_date: '2026-10-29', closed_days: 3 }), {}, '2026-11-02'), null);
});
test('STHP applyBy text becomes 2026-10-29', () => {
  assert.equal(parseDateText('29 October 2026'), '2026-10-29');
  assert.equal(resolveDeadline(card({ exam_slug: 'sthp' }), facts, '2026-10-20'), '2026-10-29');
});
test('NTHP resolves to 2026-12-15', () => {
  assert.equal(resolveDeadline(card({ exam_slug: 'nthp' }), facts, '2026-10-20'), '2026-12-15');
});
test('own deadline wins over exam page date', () => {
  assert.equal(resolveDeadline(card({ exam_slug: 'sthp', deadline_date: '2026-11-05' }), facts, '2026-10-20'), '2026-11-05');
});
test('inactive, empty or disabled shows nothing', () => {
  assert.equal(visibleCards([card({ is_active: false })], 'home', {}, '2026-10-20').length, 0);
  assert.equal(visibleCards([], 'home', {}, '2026-10-20').length, 0);
  assert.equal(visibleCards([card({})], 'home', {}, '2026-10-20', false).length, 0);
});
test('bad links rejected', () => {
  assert.equal(isValidHref('http://x.com'), false);
  assert.equal(isValidHref('//evil.com'), false);
  assert.equal(isValidHref('javascript:alert(1)'), false);
  assert.equal(isValidHref('/exams/sts'), true);
  assert.equal(isValidHref('https://sts.net.pk'), true);
});
