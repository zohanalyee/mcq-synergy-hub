import test from 'node:test';
import assert from 'node:assert/strict';
import { whatsappChannelUrl, whatsappResultUrl, createAttemptTracker, scoreBand, normalizeGaPath, isAdminPath } from './growthRules.js';

test('empty channel has no link; unsafe URL is rejected', () => {
  assert.equal(whatsappChannelUrl(''), '');
  assert.equal(whatsappChannelUrl('javascript:alert(1)'), '');
  assert.equal(whatsappChannelUrl('https://whatsapp.com/channel/example'), 'https://whatsapp.com/channel/example');
});
test('result contains public name, percentage, apex own-page URL and WhatsApp UTM only', () => {
  const result = whatsappResultUrl('NTHP Mock Test', 80, '/mock-tests/nthp?lang=ur');
  assert.ok(result);
  assert.equal(new URL(result).searchParams.get('text'), 'NTHP Mock Test: I scored 80%. https://mcqsai.com/mock-tests/nthp?utm_source=whatsapp&utm_medium=result_share');
  assert.equal(whatsappResultUrl('Test', 80, '/test-session/guest-123'), null);
});
test('start once; visibility/pagehide dedupe; completed attempts never abandon', () => {
  const events = [];
  const tracker = createAttemptTracker({ test_slug: 'nthp', exam_category: 'nthp' }, (name, params) => events.push({ name, params }));
  tracker.abandon(); tracker.start(); tracker.start(); tracker.abandon(); tracker.abandon();
  assert.deepEqual(events.map(e => e.name), ['test_start', 'test_abandon']);
  assert.deepEqual(events[0].params, { test_slug: 'nthp', exam_category: 'nthp' });
  tracker.finish(); tracker.abandon();
  assert.equal(events.length, 2);
  assert.equal(tracker.resume, undefined);
});
test('abandon fires at most once per attempt, even after repeated leaves', () => {
  const events = [];
  const t = createAttemptTracker({ test_slug: 's', exam_category: 'sts' }, (n) => events.push(n));
  t.start(); t.abandon(); t.abandon(); t.abandon();
  assert.deepEqual(events, ['test_start', 'test_abandon']);
});
test('test_complete fires once with params; no abandon afterwards', () => {
  const events = [];
  const t = createAttemptTracker({ test_slug: 'nthp', exam_category: 'nthp' }, (n, p) => events.push({ n, p }));
  t.start();
  t.complete({ questions: 85, score_band: '60-79', is_guest: true });
  t.complete({ questions: 85, score_band: '60-79', is_guest: true });
  t.abandon();
  assert.deepEqual(events.map(e => e.n), ['test_start', 'test_complete']);
  assert.deepEqual(events[1].p, { test_slug: 'nthp', exam_category: 'nthp', questions: 85, score_band: '60-79', is_guest: true });
});
test('score bands: 0-39 / 40-59 / 60-79 / 80-100', () => {
  assert.equal(scoreBand(0), '0-39'); assert.equal(scoreBand(39), '0-39');
  assert.equal(scoreBand(40), '40-59'); assert.equal(scoreBand(59), '40-59');
  assert.equal(scoreBand(60), '60-79'); assert.equal(scoreBand(79), '60-79');
  assert.equal(scoreBand(80), '80-100'); assert.equal(scoreBand(100), '80-100');
});
test('GA4 path collapses session IDs; admin paths are excluded', () => {
  assert.equal(normalizeGaPath('/test-session/guest-abc123?x=1'), '/test-session/:id?x=1');
  assert.equal(normalizeGaPath('/mock-tests/nthp'), '/mock-tests/nthp');
  assert.ok(isAdminPath('/admin'));
  assert.ok(isAdminPath('/admin/content'));
  assert.ok(!isAdminPath('/administration-guide'));
});
