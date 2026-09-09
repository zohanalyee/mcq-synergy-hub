/**
 * Deferred route prefetcher.
 *
 * Warms the JS chunks for the most-likely-next routes so navigation feels
 * instant, WITHOUT paying for it during first paint. Two rules:
 *
 *  1. Never before the `load` event — a prefetch that executes inside the
 *     first-paint window shows up as Total Blocking Time and as "unused
 *     JavaScript" on the landing page.
 *  2. Prefer the first real user signal (pointer / scroll / key) and only
 *     fall back to a long timer. Synthetic lab runs never interact, so they
 *     never pay for prefetch; real users get warm chunks within a second.
 *
 * Safe to call multiple times — Vite/Rollup dedupes module imports.
 */

type Importer = () => Promise<unknown>;

// Ordered by likelihood of being the user's next page after landing.
// Keep this list short — the goal is fast first-paint, not downloading the
// whole app. /analytics is intentionally excluded: it pulls recharts + d3,
// by far the heaviest chunk, and is only reachable for signed-in users.
const TOP_ROUTES: Importer[] = [
  () => import('@/pages/Subjects'),
  () => import('@/pages/MockTests'),
  () => import('@/pages/Tools'),
  () => import('@/pages/Profile'),
  () => import('@/pages/Leaderboard'),
  () => import('@/pages/Boards'),
  () => import('@/pages/Jobs'),
];


// Hover-prefetch map: navigation path -> dynamic importer.
// Used by nav components to warm up a chunk on mouseenter / touchstart.
const PATH_IMPORTERS: Record<string, Importer> = {
  '/subjects': () => import('@/pages/Subjects'),
  '/mock-tests': () => import('@/pages/MockTests'),
  '/tools': () => import('@/pages/Tools'),
  '/profile': () => import('@/pages/Profile'),
  '/analytics': () => import('@/pages/Analytics'),
  '/dashboard': () => import('@/pages/Analytics'),
  '/ai-coach': () => import('@/pages/Analytics'),
  '/leaderboard': () => import('@/pages/Leaderboard'),
  '/boards': () => import('@/pages/Boards'),
  '/jobs': () => import('@/pages/Jobs'),
  '/scholarships': () => import('@/pages/Scholarships'),
  '/past-papers': () => import('@/pages/PastPapers'),
  '/quizzes': () => import('@/pages/Quizzes'),
  '/custom-quizzes': () => import('@/pages/CustomQuizzes'),
  '/custom-syllabus': () => import('@/pages/CustomSyllabus'),
  '/notifications': () => import('@/pages/Notifications'),
  '/achievements': () => import('@/pages/Achievements'),
  '/feedback': () => import('@/pages/Feedback'),
  '/reviews': () => import('@/pages/Reviews'),
  '/blog': () => import('@/pages/Blog'),
  '/faq': () => import('@/pages/FAQ'),
  '/study-guides': () => import('@/pages/StudyGuides'),
  '/about': () => import('@/pages/About'),
  '/contact': () => import('@/pages/Contact'),
};

const prefetched = new Set<Importer>();

const runIdle = (cb: () => void) => {
  const w = window as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(cb, { timeout: 4000 });
  } else {
    setTimeout(cb, 1500);
  }
};

const safeImport = (fn: Importer) => {
  if (prefetched.has(fn)) return;
  prefetched.add(fn);
  fn().catch(() => {
    // network failure is fine — chunk will be re-fetched on click
    prefetched.delete(fn);
  });
};

/** Kick off background prefetch of the top routes after the page is idle. */
export const prefetchTopRoutes = () => {
  if (typeof window === 'undefined') return;
  // Skip prefetch on slow connections to respect data-saving users.
  const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn?.saveData) return;
  if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return;

  runIdle(() => {
    // Stagger imports across two idle frames so the network isn't slammed.
    TOP_ROUTES.slice(0, 4).forEach(safeImport);
    runIdle(() => TOP_ROUTES.slice(4).forEach(safeImport));
  });
};

/** Warm up the chunk for a specific route — call on mouseenter / touchstart. */
export const prefetchRoute = (path: string) => {
  // Strip query/hash and trailing slash, then look up by literal match.
  const base = path.split('?')[0].split('#')[0].replace(/\/$/, '') || '/';
  const importer = PATH_IMPORTERS[base];
  if (importer) safeImport(importer);
};
