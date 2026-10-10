import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'
import { supabase } from './integrations/supabase/client'

// Stale-chunk recovery: after a new deploy, old tabs request chunk files that
// no longer exist. Reload once (at most every 30s) to pick up the new build
// instead of freezing on a blank page.
if (typeof window !== 'undefined') {
  const KEY = 'mcqsai:chunk-reload-at';
  const recover = (e?: Event) => {
    try {
      const last = Number(sessionStorage.getItem(KEY) || 0);
      if (Date.now() - last < 30000) return;
      sessionStorage.setItem(KEY, String(Date.now()));
    } catch { /* storage blocked — still try once */ }
    e?.preventDefault?.();
    window.location.reload();
  };
  window.addEventListener('vite:preloadError', recover);
  window.addEventListener('unhandledrejection', (e) => {
    const msg = String((e as PromiseRejectionEvent).reason?.message || '');
    if (/dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk/i.test(msg)) recover(e);
  });
}

// Global hook: detect AI-credit exhaustion responses from edge functions
// and surface the "Daily AI Limit Reached" dialog without touching every call site.
const _origInvoke = supabase.functions.invoke.bind(supabase.functions);
(supabase.functions as any).invoke = async (fn: string, opts?: any) => {
  const result = await _origInvoke(fn as any, opts);
  try {
    const data: any = (result as any)?.data;
    if (data && (data.credits_exhausted === true || data.error_type === 'user_credits_exhausted')) {
      window.dispatchEvent(new CustomEvent('mcqsai:credits-exhausted'));
    }
    if (data && typeof data === 'object' && 'questions' in data) {
      // Any successful AI gen likely changed credits — nudge the meter.
      window.dispatchEvent(new CustomEvent('mcqsai:credits-changed'));
    }
  } catch {}
  return result;
};

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
