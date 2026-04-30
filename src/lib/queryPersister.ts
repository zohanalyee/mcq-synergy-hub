/**
 * Lightweight sessionStorage persister for whitelisted React Query keys.
 *
 * Why not the official `persistQueryClient`? It persists EVERYTHING, including
 * authenticated/user-scoped queries — risky if a user signs out on a shared
 * device. This tiny helper opts-in only for clearly public, non-PII data
 * (subjects list, blog index, FAQ, social links, etc.) so we get instant
 * second-visit renders without leaking anything user-specific.
 *
 * Storage layout: one key per query, prefixed `rq:`. Each entry is
 * `{ data, ts }`. Entries older than TTL are ignored (and cleaned up).
 */

import type { QueryClient } from '@tanstack/react-query';

const PREFIX = 'rq:';
const TTL_MS = 30 * 60 * 1000; // 30 min — long enough to feel instant, short enough to stay fresh

const safeKey = (key: readonly unknown[]) => {
  try {
    return PREFIX + JSON.stringify(key);
  } catch {
    return null;
  }
};

const safeSession = () => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

/** Hydrate a single query from sessionStorage if present and fresh. */
export const hydrateQuery = (qc: QueryClient, key: readonly unknown[]) => {
  const ss = safeSession();
  if (!ss) return;
  const k = safeKey(key);
  if (!k) return;
  const raw = ss.getItem(k);
  if (!raw) return;
  try {
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > TTL_MS) {
      ss.removeItem(k);
      return;
    }
    if (qc.getQueryData(key) === undefined) {
      qc.setQueryData(key, data);
    }
  } catch {
    ss.removeItem(k);
  }
};

/** Persist a single query result to sessionStorage. */
export const persistQuery = (key: readonly unknown[], data: unknown) => {
  const ss = safeSession();
  if (!ss) return;
  const k = safeKey(key);
  if (!k) return;
  try {
    ss.setItem(k, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // Quota exceeded — drop oldest entries and retry once.
    try {
      const keys: string[] = [];
      for (let i = 0; i < ss.length; i++) {
        const kk = ss.key(i);
        if (kk?.startsWith(PREFIX)) keys.push(kk);
      }
      keys.slice(0, Math.ceil(keys.length / 2)).forEach((kk) => ss.removeItem(kk));
      ss.setItem(k, JSON.stringify({ data, ts: Date.now() }));
    } catch {
      /* give up silently */
    }
  }
};

/** Clear all persisted query entries (e.g. on sign-out). */
export const clearPersistedQueries = () => {
  const ss = safeSession();
  if (!ss) return;
  const keys: string[] = [];
  for (let i = 0; i < ss.length; i++) {
    const k = ss.key(i);
    if (k?.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach((k) => ss.removeItem(k));
};
