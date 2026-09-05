import type { QueryClient } from '@tanstack/react-query';

/**
 * Minimal localStorage persistence for a small whitelist of slow-changing,
 * app-shell queries (navigation, appearance, educational systems, header badges).
 * Keeps route changes from re-fetching config that rarely changes.
 * No visual behaviour changes — cache warming only.
 */
const STORAGE_KEY = 'rq-shell-cache-v1';
const MAX_AGE = 24 * 60 * 60 * 1000; // 24h

const PERSIST_KEYS = [
  'navigation-items',
  'new-content-counts',
  'boards-index',
  'global-appearance-settings',
  'educational-systems',
];

type Entry = { key: unknown[]; data: unknown; updatedAt: number };

const shouldPersist = (queryKey: readonly unknown[]) =>
  typeof queryKey[0] === 'string' && PERSIST_KEYS.includes(queryKey[0] as string);

export function hydrateQueryCache(client: QueryClient) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const entries = JSON.parse(raw) as Entry[];
    const now = Date.now();
    for (const entry of entries) {
      if (!entry?.key || now - entry.updatedAt > MAX_AGE) continue;
      if (client.getQueryData(entry.key) !== undefined) continue;
      client.setQueryData(entry.key, entry.data, { updatedAt: entry.updatedAt });
    }
  } catch {
    // ignore corrupt cache
  }
}

export function persistQueryCache(client: QueryClient) {
  if (typeof window === 'undefined') return () => {};

  let timer: ReturnType<typeof setTimeout> | null = null;

  const write = () => {
    try {
      const entries: Entry[] = client
        .getQueryCache()
        .getAll()
        .filter((q) => shouldPersist(q.queryKey) && q.state.data !== undefined && q.state.status === 'success')
        .map((q) => ({
          key: q.queryKey as unknown[],
          data: q.state.data,
          updatedAt: q.state.dataUpdatedAt || Date.now(),
        }));
      if (entries.length === 0) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // storage full / disabled — safe to ignore
    }
  };

  const unsubscribe = client.getQueryCache().subscribe((event) => {
    if (!shouldPersist(event.query.queryKey)) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(write, 1000);
  });

  return () => {
    if (timer) clearTimeout(timer);
    unsubscribe();
  };
}
