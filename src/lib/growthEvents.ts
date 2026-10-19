import { trackEvent } from '@/utils/analytics';

const GUEST_KEY = 'mcqsai_growth_guest_attempt';

export function markGuestAttempt() {
  try { sessionStorage.setItem(GUEST_KEY, String(Date.now())); } catch { /* optional measurement */ }
}

/** Only a successful new signup consumes this guest-attempt marker. */
export function trackGuestSignup() {
  try {
    const at = Number(sessionStorage.getItem(GUEST_KEY));
    if (!at || Date.now() - at > 24 * 60 * 60 * 1000) return;
    sessionStorage.removeItem(GUEST_KEY);
    trackEvent('guest_to_signup');
  } catch { /* optional measurement */ }
}

/** OAuth new-account success only; a returning user's login is not signup. */
export function trackGuestOAuthSignup(createdAt: string, provider?: string) {
  if (provider !== 'google' && provider !== 'facebook') return;
  try {
    const guestAt = Number(sessionStorage.getItem(GUEST_KEY));
    const created = Date.parse(createdAt);
    if (guestAt && created >= guestAt && Date.now() - created < 5 * 60 * 1000) trackGuestSignup();
  } catch { /* optional measurement */ }
}

export const trackWhatsAppJoin = (placement: string) => trackEvent('whatsapp_join_click', { placement });
export const trackResultShare = (method: string) => trackEvent('result_share', { method });