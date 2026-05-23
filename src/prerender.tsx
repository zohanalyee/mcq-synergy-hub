// Prerender entry point — used only when PRERENDER=true at build time.
// Renders the app to a static HTML string per route. Anonymous-only:
// auth/session state is forced to logged-out so JSX matches the eventual
// hydration on the client (where the real session loads after mount).
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

// Flag consumed by context providers to short-circuit browser-only side effects
// (window/localStorage/Supabase auth listeners) during static render.
(globalThis as any).__PRERENDER__ = true;

export async function prerender(data: { url: string }) {
  const helmetContext: any = {};
  // App already mounts BrowserRouter internally; for prerender we wrap with
  // StaticRouter via a side-channel. Simpler: rely on App's own router which
  // reads window.location — at prerender time we set it via globalThis.
  (globalThis as any).__PRERENDER_URL__ = data.url;

  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      {/* StaticRouter wins because App's BrowserRouter is replaced via env check */}
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
