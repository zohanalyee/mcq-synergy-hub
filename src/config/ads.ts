/**
 * Google AdSense configuration — single source of truth.
 *
 * Density policy (deliberate, approval-first): ONE ad unit per page.
 * Never render ads inside a live exam (`/test-session/*`), auth, admin or
 * dashboard surfaces.
 *
 * SLOT IDS: create each unit once in the AdSense dashboard
 * (Ads → By ad unit → Display ad) and paste its `data-ad-slot` number below.
 * A slot left empty renders NOTHING in production (no broken/empty box) and a
 * clearly-labelled dev placeholder in preview, so the layout can be reviewed
 * before the IDs exist.
 */

export const AD_CLIENT = 'ca-pub-4978762286882236';

export type AdSurface =
  | 'board-topic'
  | 'blog-post'
  | 'test-results'
  | 'hub';

export const AD_SLOTS: Record<AdSurface, string> = {
  'board-topic': '1302556495',
  'blog-post': '5833542456',
  'test-results': '7676393152',
  hub: '6504460441',
};

/**
 * Ads only run on the real published domain. Preview/localhost never loads a
 * unit — AdSense policy forbids serving ads on non-approved hosts, and it keeps
 * the dev experience clean.
 */
export const AD_HOSTS = ['mcqsai.com', 'www.mcqsai.com'];

export const isAdHost = () =>
  typeof window !== 'undefined' && AD_HOSTS.includes(window.location.hostname);
