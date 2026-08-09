/**
 * Offline campaign tracking (QR banners, flyers, posters).
 *
 * A campaign is detected from the URL — either a dedicated landing path
 * (e.g. `/larkana`) or `utm_campaign` / `ref` / `src` query params. The
 * detected campaign is:
 *   1. logged once per browser session into `campaign_visits` (guests too), and
 *   2. persisted in localStorage for 30 days so a later signup can be
 *      attributed to the campaign that brought the student in.
 *
 * URL-strip proof: in-app browsers (Google Lens, iPhone Camera, Android QR
 * scanners) often drop the query string, so the path alone is enough.
 */

import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/utils/analytics';

const STORE_KEY = 'mcqsai_campaign_attribution';
const SESSION_KEY_PREFIX = 'mcqsai_campaign_logged_';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Dedicated landing paths that always map to a campaign. */
const PATH_CAMPAIGNS: Record<string, string> = {
  '/larkana': 'larkana_library',
};

/** Campaign aliases coming in via ?src= / ?ref= / ?utm_campaign=. */
const CAMPAIGN_ALIASES: Record<string, string> = {
  larkana_library: 'larkana_library',
  'larkana-library': 'larkana_library',
  library_banner: 'larkana_library',
};

export interface CampaignAttribution {
  campaign: string;
  utm_source?: string;
  utm_medium?: string;
  landing_path: string;
  savedAt: number;
}

const normalisePath = (pathname: string): string =>
  (pathname || '').toLowerCase().replace(/\/+$/, '') || '/';

const sanitise = (value: string | null): string | undefined => {
  if (!value) return undefined;
  const clean = value.trim().toLowerCase().slice(0, 64);
  return clean.length >= 2 ? clean : undefined;
};

/** Detect the campaign for the current URL, or null when there is none. */
export const detectCampaign = (
  pathname: string,
  search: string,
): { campaign: string; utm_source?: string; utm_medium?: string } | null => {
  const path = normalisePath(pathname);
  const params = new URLSearchParams(search || '');
  const utm_source = sanitise(params.get('utm_source'));
  const utm_medium = sanitise(params.get('utm_medium'));

  const explicit =
    sanitise(params.get('utm_campaign')) ||
    sanitise(params.get('ref')) ||
    sanitise(params.get('src'));

  if (explicit) {
    return { campaign: CAMPAIGN_ALIASES[explicit] || explicit, utm_source, utm_medium };
  }

  if (PATH_CAMPAIGNS[path]) {
    return { campaign: PATH_CAMPAIGNS[path], utm_source, utm_medium };
  }

  // Fallback for scanners that mangle the "?" but keep the raw string.
  const raw = `${path}${search || ''}`.toLowerCase();
  const alias = Object.keys(CAMPAIGN_ALIASES).find((k) => raw.includes(k));
  return alias
    ? { campaign: CAMPAIGN_ALIASES[alias], utm_source, utm_medium }
    : null;
};

export const loadAttribution = (): CampaignAttribution | null => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CampaignAttribution;
    if (!parsed?.campaign || !parsed?.savedAt) return null;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(STORE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const saveAttribution = (a: Omit<CampaignAttribution, 'savedAt'>): void => {
  try {
    // First-touch wins: never overwrite an existing, still-valid attribution.
    if (loadAttribution()) return;
    localStorage.setItem(STORE_KEY, JSON.stringify({ ...a, savedAt: Date.now() }));
  } catch {
    // private mode — attribution simply won't persist
  }
};

const deviceType = (): string => {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile';
  return 'desktop';
};

/** Stable, non-identifying per-browser id used only to de-duplicate visits. */
const visitorHash = (): string => {
  try {
    const existing = localStorage.getItem('mcqsai_visitor_hash');
    if (existing) return existing;
    const fresh =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    localStorage.setItem('mcqsai_visitor_hash', fresh);
    return fresh;
  } catch {
    return 'unknown';
  }
};

/**
 * Record a campaign visit (once per browser session per campaign) and store
 * the attribution for later signup stamping.
 */
export const recordCampaignVisit = async (
  pathname: string,
  search: string,
): Promise<void> => {
  const detected = detectCampaign(pathname, search);
  if (!detected) return;

  saveAttribution({
    campaign: detected.campaign,
    utm_source: detected.utm_source,
    utm_medium: detected.utm_medium,
    landing_path: normalisePath(pathname),
  });

  const sessionKey = `${SESSION_KEY_PREFIX}${detected.campaign}`;
  try {
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, '1');
  } catch {
    // keep going — worst case the visit is logged twice
  }

  trackEvent('campaign_visit', {
    campaign: detected.campaign,
    utm_source: detected.utm_source,
    utm_medium: detected.utm_medium,
  });

  try {
    const { data } = await supabase.auth.getSession();
    await (supabase.from('campaign_visits') as any).insert({
      campaign: detected.campaign,
      utm_source: detected.utm_source ?? null,
      utm_medium: detected.utm_medium ?? null,
      landing_path: normalisePath(pathname),
      referrer:
        typeof document !== 'undefined' && document.referrer
          ? document.referrer.slice(0, 300)
          : null,
      device_type: deviceType(),
      visitor_hash: visitorHash(),
      user_id: data.session?.user?.id ?? null,
    });
  } catch {
    // analytics must never break the page
  }
};

/**
 * Stamp the stored campaign onto the signed-in user's profile, once.
 * Only fills an empty value, so the first campaign keeps the credit.
 */
export const attributeSignup = async (userId: string): Promise<void> => {
  const attribution = loadAttribution();
  if (!userId || !attribution) return;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('signup_campaign')
      .eq('id', userId)
      .maybeSingle();

    if (!profile || (profile as any).signup_campaign) return;

    const { error } = await (supabase.from('profiles') as any)
      .update({ signup_campaign: attribution.campaign })
      .eq('id', userId)
      .is('signup_campaign', null);

    if (!error) {
      trackEvent('campaign_signup', { campaign: attribution.campaign });
    }
  } catch {
    // non-fatal
  }
};
