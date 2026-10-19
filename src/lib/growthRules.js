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
  url.search = '?utm_source=whatsapp';
  url.hash = '';
  const text = `${testName}: I scored ${Math.round(percentage)}%. ${url.href}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** One abandonment per inactive episode; resume is not a second start. */
export function createAttemptTracker(params, emit) {
  let started = false;
  let finished = false;
  let abandoned = false;
  return {
    start() { if (started) return; started = true; emit('test_start', params); },
    finish() { finished = true; },
    abandon() {
      if (!started || finished || abandoned) return;
      abandoned = true;
      emit('test_abandon', params);
    },
    resume() { abandoned = false; },
  };
}