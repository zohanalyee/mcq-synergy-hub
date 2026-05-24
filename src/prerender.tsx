// Prerender entry point — used only when PRERENDER=true at build time.
// Renders the app to a static HTML string per route. Anonymous-only:
// auth/session state is forced to logged-out so JSX matches the eventual
// hydration on the client (where the real session loads after mount).

// --- Minimal browser-API shims for Node-side prerender ---
// Many components touch `localStorage`/`sessionStorage`/`matchMedia` at render
// time. Rather than refactor every one, we provide inert in-memory shims so
// the static render is crash-safe. Real browser APIs replace these at hydration.
const g: any = globalThis as any;
if (typeof g.window === 'undefined') {
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

import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

// Flag consumed by context providers to short-circuit browser-only side effects
(globalThis as any).__PRERENDER__ = true;

export async function prerender(data: { url: string }) {
  const helmetContext: any = {};
  (globalThis as any).__PRERENDER_URL__ = data.url;

  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={data.url}>
        <App />
      </StaticRouter>
    </HelmetProvider>
  );

  const { helmet } = helmetContext;
  const head = helmet
    ? [
        helmet.title?.toString() ?? '',
        helmet.meta?.toString() ?? '',
        helmet.link?.toString() ?? '',
        helmet.script?.toString() ?? '',
      ].join('\n')
    : '';

  return { html, head: { elements: new Set([{ type: 'raw', value: head }]) } };
}
