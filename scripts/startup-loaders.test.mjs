import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
const delays = new Map([
  ['adsbygoogle.js', 6000],
  ['clarity.ms', 10000],
  ['gtag/js', 4000],
  ['OneSignalSDK.page.js', 15000],
]);

function harness({ idle = true, ready = 'loading', hostname = 'mcqsai.com' } = {}) {
  let now = 0;
  let id = 0;
  const timers = new Map();
  const listeners = new Map();
  const idleTasks = [];
  const appended = [];
  const window = {
    setTimeout(fn, delay) { const key = ++id; timers.set(key, { fn, at: now + delay }); return key; },
    clearTimeout(key) { timers.delete(key); },
    addEventListener(event, fn) { const list = listeners.get(event) || []; list.push(fn); listeners.set(event, list); },
  };
  if (idle) window.requestIdleCallback = fn => idleTasks.push(fn);
  const document = {
    readyState: ready,
    createElement: () => ({}),
    head: { appendChild: element => appended.push({ src: element.src, at: now }) },
  };
  Object.assign(window, { window, document, location: { hostname }, Date });
  const context = vm.createContext(window);
  for (const script of scripts) vm.runInContext(script, context);
  function advance(target) {
    for (;;) {
      const next = [...timers].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      now = next[1].at;
      timers.delete(next[0]);
      next[1].fn();
    }
    now = target;
  }
  return { appended, listeners, advance, emit: event => (listeners.get(event) || []).forEach(fn => fn()),
    flushIdle: () => idleTasks.splice(0).forEach(fn => fn()), window };
}

for (const [marker, delay] of delays) {
  test(`${marker}: waits for load + ${delay}ms and idle, never input`, () => {
    const h = harness();
    h.advance(20000);
    for (const event of ['pointerdown', 'touchstart', 'keydown', 'scroll', 'wheel', 'mousemove', 'pagehide', 'visibilitychange']) {
      assert.equal(h.listeners.has(event), false);
      h.emit(event);
    }
    assert.equal(h.appended.length, 0);
    h.emit('load');
    h.advance(20000 + delay - 1);
    h.flushIdle();
    assert.equal(h.appended.some(item => item.src.includes(marker)), false);
    h.advance(20000 + delay);
    h.flushIdle();
    assert.equal(h.appended.filter(item => item.src.includes(marker)).length, 1);
    assert.equal(h.appended.find(item => item.src.includes(marker)).at, 20000 + delay);
    h.advance(40000);
    assert.equal(h.appended.filter(item => item.src.includes(marker)).length, 1);
  });
  test(`${marker}: bounded fallback if idle is starved`, () => {
    const h = harness({ ready: 'complete' });
    h.advance(delay + 1999);
    assert.equal(h.appended.some(item => item.src.includes(marker)), false);
    h.advance(delay + 2000);
    assert.equal(h.appended.filter(item => item.src.includes(marker)).length, 1);
    h.flushIdle();
    assert.equal(h.appended.filter(item => item.src.includes(marker)).length, 1);
  });
  test(`${marker}: timer-only fallback without requestIdleCallback`, () => {
    const h = harness({ idle: false, ready: 'complete' });
    h.advance(delay - 1);
    assert.equal(h.appended.some(item => item.src.includes(marker)), false);
    h.advance(delay);
    assert.equal(h.appended.filter(item => item.src.includes(marker)).length, 1);
  });
}

test('OneSignal stays disabled in preview; GA4 and Clarity retain queue stubs', () => {
  const h = harness({ ready: 'complete', hostname: 'localhost' });
  h.advance(20000);
  h.flushIdle();
  assert.equal(h.appended.some(item => item.src.includes('OneSignal')), false);
  assert.equal(h.window.dataLayer.length, 2);
  h.window.clarity('event', 'queued');
  assert.equal(h.window.clarity.q.length, 1);
});

test('notification opt-in sends no token or identifier and ignores token refresh', () => {
  const h = harness();
  let listener;
  const sdk = { User: { PushSubscription: { addEventListener: (event, fn) => { listener = fn; } } }, init: () => {} };
  h.window.OneSignalDeferred[0](sdk);
  listener({ previous: { optedIn: false }, current: { optedIn: true, token: 'private-token', id: 'private-id' } });
  listener({ previous: { optedIn: true }, current: { optedIn: true, token: 'new-token' } });
  const events = h.window.dataLayer.filter(x => x[1] === 'notification_optin');
  assert.equal(events.length, 1);
  assert.equal(events[0].length, 2);
});