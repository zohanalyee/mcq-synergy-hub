// Every sitemap URL must match a real route (never only the "*" not-found route),
// and legacy forwards must never shadow a real page or point to a missing test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { LEGACY_MOCK_TEST_REDIRECTS, NOT_FOUND_POPULAR_TESTS } from '../src/lib/legacyRedirects.js';

const root = new URL('..', import.meta.url);
const app = readFileSync(new URL('src/App.tsx', root), 'utf8');
const routes = [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== '*');
const matchers = routes.map((p) => new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/:[A-Za-z]+/g, '[^/]+') + '/?$'));

const dir = new URL('public/sitemaps/', root);
const urls = readdirSync(dir).filter((f) => f.endsWith('.xml')).flatMap((f) =>
  [...readFileSync(new URL(f, dir), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname));
const mockSlugs = new Set(urls.filter((u) => u.startsWith('/mock-tests/')).map((u) => u.split('/')[2]));

test('sitemaps are not empty', () => assert.ok(urls.length > 1000, `only ${urls.length} URLs`));

test('every sitemap URL matches a real route', () => {
  const miss = urls.filter((u) => !matchers.some((r) => r.test(decodeURI(u))));
  console.log(`[route-coverage] ${urls.length - miss.length}/${urls.length} sitemap URLs matched a real route`);
  assert.deepEqual(miss.slice(0, 10), []);
});

test('legacy forwards never shadow a sitemap page and always land on one', () => {
  for (const [from, to] of Object.entries(LEGACY_MOCK_TEST_REDIRECTS)) {
    assert.ok(!mockSlugs.has(from), `${from} is a real page`);
    assert.ok(mockSlugs.has(to), `${to} missing from mock-test sitemap`);
  }
});

test('junior-office-associate forwards to the BPS-13 test', () => {
  assert.equal(LEGACY_MOCK_TEST_REDIRECTS['junior-office-associate'], 'junior-office-associate-bps-13');
});

test('not-found popular tests all exist', () => {
  for (const [slug] of NOT_FOUND_POPULAR_TESTS) assert.ok(mockSlugs.has(slug), slug);
});
