import test from 'node:test';
import assert from 'node:assert/strict';
import { whatsappChannelUrl, whatsappResultUrl, createAttemptTracker } from './growthRules.js';

test('empty channel has no link; unsafe URL is rejected', () => {
  assert.equal(whatsappChannelUrl(''), '');
  assert.equal(whatsappChannelUrl('javascript:alert(1)'), '');
  assert.equal(whatsappChannelUrl('https://whatsapp.com/channel/example'), 'https://whatsapp.com/channel/example');
});
test('result contains public name, percentage, apex own-page URL and WhatsApp UTM only', () => {
  const result = whatsappResultUrl('NTHP Mock Test', 80, '/mock-tests/nthp?lang=ur');
  assert.ok(result);
  assert.equal(new URL(result).searchParams.get('text'), 'NTHP Mock Test: I scored 80%. https://mcqsai.com/mock-tests/nthp?utm_source=whatsapp');
  assert.equal(whatsappResultUrl('Test', 80, '/test-session/guest-123'), null);
});
test('start once; visibility/pagehide dedupe; completed attempts never abandon', () => {
  const events = [];
  const tracker = createAttemptTracker({ test_slug: 'nthp', exam_category: 'nthp' }, (name, params) => events.push({ name, params }));
  tracker.abandon(); tracker.start(); tracker.start(); tracker.abandon(); tracker.abandon();
  assert.deepEqual(events.map(e => e.name), ['test_start', 'test_abandon']);
  assert.deepEqual(events[0].params, { test_slug: 'nthp', exam_category: 'nthp' });
  tracker.resume(); tracker.finish(); tracker.abandon();
  assert.equal(events.length, 2);
});