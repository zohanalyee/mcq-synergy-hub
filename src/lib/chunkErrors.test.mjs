import test from 'node:test';
import assert from 'node:assert/strict';
import { isChunkLoadError, reloadOnce, safeImport } from './chunkErrors.js';

const store = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };

test('missing widget file renders nothing instead of crashing', async () => {
  const mod = await safeImport(() => Promise.reject(new TypeError('Failed to fetch dynamically imported module: https://mcqsai.com/assets/CookieConsent-Dnk8GYcN.js')));
  assert.equal(mod.default(), null);
});
test('the CookieConsent error is recognised as a missing-file error', () => {
  assert.equal(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://mcqsai.com/assets/CookieConsent-Dnk8GYcN.js')), true);
  assert.equal(isChunkLoadError(new Error('Cannot read properties of undefined')), false);
});
test('only one automatic reload within 30 seconds (no loop)', () => {
  const s = store(); let n = 0;
  assert.equal(reloadOnce(s, () => n++, 1_000_000), true);
  assert.equal(reloadOnce(s, () => n++, 1_010_000), false);
  assert.equal(n, 1);
  assert.equal(reloadOnce(s, () => n++, 1_040_001), true);
});
