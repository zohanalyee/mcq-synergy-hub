// Prerender entry point — used only when PRERENDER=true at build time.
// IMPORTANT: shims MUST be the first import so DOM globals exist before
// any component module (which may touch document/localStorage at top level)
// is evaluated.
import './prerender-shims';

import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

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
