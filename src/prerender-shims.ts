// Browser-API shims for Node-side prerender. Must be imported BEFORE any
// app code (React components, contexts, etc.) so that module-top-level
// access to `document`/`window`/`localStorage` does not crash SSR.
const g: any = globalThis as any;

const memStore = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => { m.set(k, String(v)); },
    removeItem: (k: string) => { m.delete(k); },
    clear: () => m.clear(),
    key: (i: number) => Array.from(m.keys())[i] ?? null,
    get length() { return m.size; },
  };
};

if (typeof g.localStorage === 'undefined') g.localStorage = memStore();
if (typeof g.sessionStorage === 'undefined') g.sessionStorage = memStore();
if (typeof g.matchMedia === 'undefined') {
  g.matchMedia = (q: string) => ({
    matches: false, media: q, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

if (typeof g.document === 'undefined') {
  const noop = () => {};
  const elStub: any = {
    style: {},
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    setAttribute: noop, removeAttribute: noop, getAttribute: () => null,
    appendChild: (x: any) => x, removeChild: (x: any) => x,
    addEventListener: noop, removeEventListener: noop,
    querySelector: () => null, querySelectorAll: () => [],
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }),
  };
  g.document = {
    documentElement: elStub,
    body: elStub,
    head: elStub,
    createElement: () => ({ ...elStub }),
    createTextNode: (t: string) => ({ nodeValue: t }),
    getElementById: () => null,
    getElementsByTagName: () => [],
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: noop, removeEventListener: noop,
    cookie: '',
    readyState: 'complete',
    visibilityState: 'visible',
    hidden: false,
  };
}

// Node 22+ has a read-only `navigator` on globalThis. We cannot overwrite it,
// but we can READ from it; that's enough for libraries doing feature detection.
const _nav: any = (typeof g.navigator !== 'undefined' && g.navigator) || { userAgent: 'node-prerender', language: 'en' };
try { _nav.maxTouchPoints = _nav.maxTouchPoints ?? 0; _nav.hardwareConcurrency = _nav.hardwareConcurrency ?? 4; } catch {}

// Minimal `window` shim. We initially avoided defining window so framer-motion
// would take its SSR branch — but the bundled prerender chunk references
// `window` at module-init in transitive deps (radix/react-router internals),
// triggering a hard ReferenceError before any guards can run. A bare-object
// window with no-op listeners is safe: libraries only ATTACH listeners at
// init; measurements/observers fire in effects, which never run in SSR.
if (typeof g.window === 'undefined') {
  const noop = () => {};
  // Use a fresh object, NOT globalThis — Node 22+ has read-only getters on
  // globalThis (e.g. `navigator`) we cannot reassign.
  const win: any = {};
  win.innerWidth = 1024;
  win.innerHeight = 768;
  win.scrollX = 0;
  win.scrollY = 0;
  win.pageXOffset = 0;
  win.pageYOffset = 0;
  win.devicePixelRatio = 1;
  win.addEventListener = noop;
  win.removeEventListener = noop;
  win.dispatchEvent = () => false;
  win.requestAnimationFrame = (_cb: any) => 0;
  win.cancelAnimationFrame = noop;
  win.getComputedStyle = () => ({ getPropertyValue: () => '' });
  win.location = { href: 'https://mcqsai.com/', origin: 'https://mcqsai.com', pathname: '/', search: '', hash: '', protocol: 'https:', host: 'www.mcqsai.com', assign: noop, replace: noop, reload: noop };
  win.history = { pushState: noop, replaceState: noop, back: noop, forward: noop, go: noop, state: null, length: 1 };
  win.matchMedia = g.matchMedia;
  win.localStorage = g.localStorage;
  win.sessionStorage = g.sessionStorage;
  win.navigator = _nav;
  win.document = g.document;
  win.requestIdleCallback = (_cb: any) => 0;
  win.cancelIdleCallback = noop;
  win.CSS = { supports: () => false, escape: (s: string) => s };
  win.performance = { now: () => Date.now(), mark: noop, measure: noop, getEntriesByType: () => [], getEntriesByName: () => [] };
  win.scrollTo = noop;
  win.scroll = noop;
  win.IntersectionObserver = function() { return { observe: noop, unobserve: noop, disconnect: noop, takeRecords: () => [] }; } as any;
  win.ResizeObserver = function() { return { observe: noop, unobserve: noop, disconnect: noop }; } as any;
  win.MutationObserver = function() { return { observe: noop, disconnect: noop, takeRecords: () => [] }; } as any;
  win.self = win;
  win.window = win;
  g.window = win;
  g.HTMLElement = function() {} as any;
  g.Element = function() {} as any;
  g.Node = function() {} as any;
  g.IntersectionObserver = win.IntersectionObserver;
  g.ResizeObserver = win.ResizeObserver;
  g.MutationObserver = win.MutationObserver;
  if (typeof g.requestAnimationFrame === 'undefined') g.requestAnimationFrame = win.requestAnimationFrame;
  if (typeof g.cancelAnimationFrame === 'undefined') g.cancelAnimationFrame = win.cancelAnimationFrame;
  if (typeof g.requestIdleCallback === 'undefined') g.requestIdleCallback = win.requestIdleCallback;
  if (typeof g.cancelIdleCallback === 'undefined') g.cancelIdleCallback = win.cancelIdleCallback;
  if (typeof g.getComputedStyle === 'undefined') g.getComputedStyle = win.getComputedStyle;
}

g.__PRERENDER__ = true;

export {};
