/** Reject non-channel URLs and active URL schemes; empty settings stay hidden. */
export function whatsappChannelUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && ['whatsapp.com', 'www.whatsapp.com'].includes(url.hostname)
      && /^\/channel\/[^/]+\/?$/.test(url.pathname) ? url.href : '';
  } catch { return ''; }
}

export function whatsappResultUrl(testName, percentage, path) {
  if (!path || !path.startsWith('/') || path.startsWith('//') || /^\/(test-session|quiz-player)\//.test(path)) return null;
  const url = new URL(path, 'https://mcqsai.com');
  url.search = '?utm_source=whatsapp&utm_medium=result_share';
  url.hash = '';
  const text = `${testName}: I scored ${Math.round(percentage)}%. ${url.href}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** Score band for analytics: 0-39 / 40-59 / 60-79 / 80-100. */
export function scoreBand(percentage) {
  const p = Math.max(0, Math.min(100, Math.round(Number(percentage) || 0)));
  return p >= 80 ? '80-100' : p >= 60 ? '60-79' : p >= 40 ? '40-59' : '0-39';
}

/**
 * One start, at most one abandon, at most one complete per attempt.
 * Abandon is only for really leaving (pagehide / in-app route change), never after complete.
 */
export function createAttemptTracker(params, emit) {
  let started = false;
  let finished = false;
  let abandoned = false;
  return {
    start() { if (started) return; started = true; emit('test_start', params); },
    finish() { finished = true; },
    complete(extra) {
      if (!started || finished || abandoned) { finished = true; return; }
      finished = true;
      emit('test_complete', { ...params, ...extra });
    },
    abandon() {
      if (!started || finished || abandoned) return;
      abandoned = true;
      emit('test_abandon', params);
    },
  };
}
/** GA4 page path: collapse session IDs so they never create unique pages. */
export function normalizeGaPath(path) {
  return String(path || '/').replace(/^\/test-session\/[^/?#]+/, '/test-session/:id');
}
/** No analytics on admin routes. */
export const isAdminPath = (path) => /^\/admin(\/|$|\?)/.test(String(path || ''));
