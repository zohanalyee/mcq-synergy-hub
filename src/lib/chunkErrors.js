// Shared rules for "file of an old/new deploy is missing" failures (no React, unit-tested).

const CHUNK_RE = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk [\w-]+ failed|Unable to preload CSS/i;

/** True when an error means a code file could not be downloaded. */
export function isChunkLoadError(err) {
  return CHUNK_RE.test(String(err?.message ?? err ?? '')) || err?.name === 'ChunkLoadError';
}

export const RELOAD_KEY = 'mcqsai:chunk-reload-at';
const WINDOW_MS = 30000;

/**
 * One automatic reload per 30 s, guarded by sessionStorage so it can never loop.
 * Returns true when a reload was started.
 */
export function reloadOnce(storage, reload, now = Date.now()) {
  try {
    const last = Number(storage.getItem(RELOAD_KEY) || 0);
    if (now - last <= WINDOW_MS) return false;
    storage.setItem(RELOAD_KEY, String(now));
  } catch {
    return false;
  }
  reload();
  return true;
}

const Nothing = () => null;

/** For non-critical widgets: if the file fails, render nothing instead of crashing the page. */
export function safeImport(factory) {
  return factory().catch((err) => {
    if (typeof console !== 'undefined') console.warn('[optional widget skipped]', err?.message ?? err);
    return { default: Nothing };
  });
}
