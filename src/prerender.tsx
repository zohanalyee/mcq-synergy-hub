// Prerender entry point — used only when PRERENDER=true at build time.
import './prerender-shims';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';

/**
 * Parse a Helmet-emitted HTML string (e.g. '<title data-rh="true">X</title><meta data-rh="true" name="description" content="...">')
 * into an array of {type, props, children} elements consumed by vite-prerender-plugin.
 */
function parseHelmetHtml(html: string): Array<{ type: string; props: Record<string, string>; children?: string }> {
  const out: Array<{ type: string; props: Record<string, string>; children?: string }> = [];
  if (!html) return out;
  // Helmet's toString() already HTML-escapes attribute values, and
  // vite-prerender-plugin escapes them AGAIN when it serializes the props.
  // Decode once here so "Matric & FSc" does not become "Matric &amp;amp; FSc".
  const decodeEntities = (v: string) =>
    v
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  const parseAttrs = (s: string) => {
    const props: Record<string, string> = {};
    const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s/>]+)))?/g;
    let a: RegExpExecArray | null;
    while ((a = attrRe.exec(s)) !== null) {
      const name = a[1];
      // Keep the data-rh / data-react-helmet markers so react-helmet-async
      // recognizes prerendered tags on hydration and reconciles them in place
      // instead of appending a second copy (which caused duplicate FAQPage
      // and other JSON-LD scripts in the rendered DOM).
      if (name === 'data-react-helmet') {
        props['data-rh'] = 'true';
        continue;
      }
      props[name] = decodeEntities(a[2] ?? a[3] ?? a[4] ?? '');
    }
    return props;
  };
  // Void elements
  const voidRe = /<(meta|link|base)\b([^>]*?)\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = voidRe.exec(html)) !== null) {
    out.push({ type: m[1].toLowerCase(), props: parseAttrs(m[2]) });
  }
  // Paired elements
  const pairRe = /<(title|script|style)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  while ((m = pairRe.exec(html)) !== null) {
    out.push({ type: m[1].toLowerCase(), props: parseAttrs(m[2]), children: m[3] });
  }
  return out;
}


export async function prerender(data: { url: string }) {
  const helmetContext: { helmet?: any } = {};
  (globalThis as any).__PRERENDER_URL__ = data.url;
  (globalThis as any).__PRERENDER__ = true;

  let App: any;
  try {
    App = (await import('./App')).default;
  } catch (err) {
    console.error(`[prerender] FAILED loading App for ${data.url}:`, err);
    throw err;
  }

  let html = '';
  try {
    html = renderToString(
      <HelmetProvider context={helmetContext}>
        <StaticRouter location={data.url}>
          <App />
        </StaticRouter>
      </HelmetProvider>
    );
  } catch (err) {
    const e = err as Error;
    console.error(`[prerender] RENDER FAILED ${data.url}: ${e.message}\n${e.stack}`);
    throw err;
  }

  const elements = new Set<any>();
  const { helmet } = helmetContext;
  if (helmet) {
    const sources = [
      helmet.title?.toString?.() ?? '',
      helmet.meta?.toString?.() ?? '',
      helmet.link?.toString?.() ?? '',
      helmet.script?.toString?.() ?? '',
      helmet.style?.toString?.() ?? '',
      helmet.base?.toString?.() ?? '',
    ].join('');
    for (const el of parseHelmetHtml(sources)) elements.add(el);
    if (!sources || elements.size === 0) {
      console.warn(`[prerender] WARN ${data.url}: Helmet produced no head tags`);
    }
  } else {
    console.warn(`[prerender] WARN ${data.url}: helmetContext.helmet is undefined`);
  }

  return { html, head: { elements } };
}
