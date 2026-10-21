import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldAutoStart, withoutStartParam } from './autoStart.js';

const phone = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36';
test('real visitor with ?start=1 auto-starts', () => assert.equal(shouldAutoStart('?start=1&utm_source=pdf', phone, false), true));
test('no auto-start without the flag', () => assert.equal(shouldAutoStart('?utm_source=pdf', phone, false), false));
test('bots and prerender never auto-start', () => {
  assert.equal(shouldAutoStart('?start=1', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', false), false);
  assert.equal(shouldAutoStart('?start=1', 'Mozilla/5.0 (compatible; bingbot/2.0)', false), false);
  assert.equal(shouldAutoStart('?start=1', phone, true), false);
});
test('start flag removed, UTM kept', () => {
  assert.equal(withoutStartParam('/mock-tests/x', '?start=1&utm_source=pdf&utm_medium=free_pdf'), '/mock-tests/x?utm_source=pdf&utm_medium=free_pdf');
  assert.equal(withoutStartParam('/mock-tests/x', '?start=1'), '/mock-tests/x');
});
