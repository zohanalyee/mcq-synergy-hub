// Browser-API shims for Node-side prerender. Must be imported BEFORE any
// app code (React components, contexts, etc.) so that module-top-level
// access to `document`/`window`/`localStorage` does not crash SSR.
const g: any = globalThis as any;

const hadWindow = typeof g.window !== 'undefined';
if (!hadWindow) {
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
  g.localStorage = memStore();
  g.sessionStorage = memStore();
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
  };
}

if (typeof g.navigator === 'undefined') {
  g.navigator = { userAgent: 'node-prerender', language: 'en' };
}

// Expose `window` last so component code that does `typeof window !== 'undefined'`
// will see one and use the shimmed APIs above (rather than bare ReferenceError).
if (!hadWindow) g.window = g;

g.__PRERENDER__ = true;

export {};
