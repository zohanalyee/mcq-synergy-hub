import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const code = html.match(/<script id="boot-recovery">([\s\S]*?)<\/script>/)[1];

function boot({ ua = 'Mozilla/5.0 Android Chrome', prerender = false, store = {} } = {}) {
  let handler; const replaced = [];
  const w = {
    __PRERENDER__: prerender,
    navigator: { userAgent: ua },
    location: { origin: 'https://mcqsai.com', pathname: '/mock-tests/x', search: '?utm_source=pdf', hash: '', replace: (u) => replaced.push(u) },
    sessionStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } },
    addEventListener: (_t, fn) => { handler = fn; },
  };
  vm.runInNewContext(code, { window: w, URLSearchParams, Date, String });
  return { fire: (target) => handler({ target }), replaced };
}
const js = { tagName: 'SCRIPT', src: 'https://mcqsai.com/assets/index-old.js' };
const css = { tagName: 'LINK', rel: 'stylesheet', href: 'https://mcqsai.com/assets/index-old.css' };

test('failed main script reloads once with ?v and keeps other params', () => {
  const b = boot(); b.fire(js);
  assert.equal(b.replaced.length, 1);
  assert.match(b.replaced[0], /^\/mock-tests\/x\?utm_source=pdf&v=\d+$/);
});
test('failed stylesheet also reloads once', () => { const b = boot(); b.fire(css); assert.equal(b.replaced.length, 1); });
test('one-shot: second failure in same session does not reload again', () => {
  const store = {}; const b = boot({ store }); b.fire(js); b.fire(css);
  assert.equal(b.replaced.length, 1);
  const again = boot({ store }); again.fire(js);
  assert.equal(again.replaced.length, 0);
});
test('no reload for bots', () => { const b = boot({ ua: 'Googlebot/2.1' }); b.fire(js); assert.equal(b.replaced.length, 0); });
test('no reload during prerender', () => { const b = boot({ prerender: true }); b.fire(js); assert.equal(b.replaced.length, 0); });
test('no reload when nothing failed or a third-party/image error fires', () => {
  const b = boot();
  b.fire({ tagName: 'SCRIPT', src: 'https://pagead2.googlesyndication.com/x.js' });
  b.fire({ tagName: 'IMG', src: 'https://mcqsai.com/assets/a.png' });
  b.fire(undefined);
  assert.equal(b.replaced.length, 0);
});
