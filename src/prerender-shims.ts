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

if (typeof g.navigator === 'undefined') {
  g.navigator = { userAgent: 'node-prerender', language: 'en', maxTouchPoints: 0, hardwareConcurrency: 4 };
}

// Minimal `window` shim. We initially avoided defining window so framer-motion
// would take its SSR branch — but the bundled prerender chunk references
// `window` at module-init in transitive deps (radix/react-router internals),
// triggering a hard ReferenceError before any guards can run. A bare-object
// window with no-op listeners is safe: libraries only ATTACH listeners at
// init; measurements/observers fire in effects, which never run in SSR.
if (typeof g.window === 'undefined') {
  const noop = () => {};
  g.window = g;
  g.window.innerWidth = 1024;
  g.window.innerHeight = 768;
  g.window.scrollX = 0;
  g.window.scrollY = 0;
  g.window.pageXOffset = 0;
  g.window.pageYOffset = 0;
  g.window.devicePixelRatio = 1;
  g.window.addEventListener = noop;
  g.window.removeEventListener = noop;
  g.window.dispatchEvent = () => false;
  g.window.requestAnimationFrame = (_cb: any) => 0;
  g.window.cancelAnimationFrame = noop;
  g.window.getComputedStyle = () => ({ getPropertyValue: () => '' });
  g.window.location = { href: 'https://www.mcqsai.com/', origin: 'https://www.mcqsai.com', pathname: '/', search: '', hash: '', protocol: 'https:', host: 'www.mcqsai.com', assign: noop, replace: noop, reload: noop };
  g.window.history = { pushState: noop, replaceState: noop, back: noop, forward: noop, go: noop, state: null, length: 1 };
  g.window.matchMedia = g.matchMedia;
  g.window.localStorage = g.localStorage;
  g.window.sessionStorage = g.sessionStorage;
  g.window.navigator = g.navigator;
  g.window.document = g.document;
  g.window.requestIdleCallback = (_cb: any) => 0;
  g.window.cancelIdleCallback = noop;
  g.window.CSS = { supports: () => false, escape: (s: string) => s };
  g.window.performance = { now: () => Date.now(), mark: noop, measure: noop, getEntriesByType: () => [], getEntriesByName: () => [] };
  g.window.scrollTo = noop;
  g.window.scroll = noop;
  g.window.IntersectionObserver = function() { return { observe: noop, unobserve: noop, disconnect: noop, takeRecords: () => [] }; } as any;
  g.window.ResizeObserver = function() { return { observe: noop, unobserve: noop, disconnect: noop }; } as any;
  g.window.MutationObserver = function() { return { observe: noop, disconnect: noop, takeRecords: () => [] }; } as any;
  g.HTMLElement = function() {} as any;
  g.Element = function() {} as any;
  g.Node = function() {} as any;
  g.IntersectionObserver = g.window.IntersectionObserver;
  g.ResizeObserver = g.window.ResizeObserver;
  g.MutationObserver = g.window.MutationObserver;
  g.requestAnimationFrame = g.window.requestAnimationFrame;
  g.cancelAnimationFrame = g.window.cancelAnimationFrame;
  g.requestIdleCallback = g.window.requestIdleCallback;
  g.cancelIdleCallback = g.window.cancelIdleCallback;
  g.getComputedStyle = g.window.getComputedStyle;
}

g.__PRERENDER__ = true;

export {};
