// Prerender entry point — used only when PRERENDER=true at build time.
// Strategy: set up Node-side browser API shims SYNCHRONOUSLY first, then
// dynamic-import App so its module-init document/window access is safe.
import './prerender-shims';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';

export async function prerender(data: { url: string }) {
  const helmetContext: any = {};
  (globalThis as any).__PRERENDER_URL__ = data.url;

  // Dynamic import ensures App's transitive component modules evaluate AFTER
  // shims (which ran at the top of this file via static import).
  const { default: App } = await import('./App');

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
