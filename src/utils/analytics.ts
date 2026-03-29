// Google Analytics 4 utility
const GA_MEASUREMENT_ID = 'G-92HVL8ZQFC';
const isDev = import.meta.env.DEV;

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const debugLog = (...args: any[]) => {
  if (isDev) console.log('[GA4]', ...args);
};

export const trackPageView = (url: string) => {
  if (typeof window.gtag === 'function') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      send_page_view: true,
    });
    debugLog('page_view', url);
  }
};

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
    debugLog('event', eventName, params);
  }
};

export const trackSignUp = (method = 'email') => {
  trackEvent('sign_up', { method });
};

export const trackTestCompletion = (params: {
  score: number;
  totalQuestions: number;
  testType: string;
  percentage: number;
}) => {
  trackEvent('test_completion', params);
};

export const trackEmptyTopicView = (params: {
  board: string;
  subject: string;
  topic: string;
  classNumber: string;
  url: string;
}) => {
  trackEvent('empty_topic_view', params);
};

// --- Engagement Signals for GA4 Session Duration ---

let heartbeatStarted = false;
let scrollTrackingStarted = false;
const firedScrollDepths = new Set<number>();

/**
 * Heartbeat timer: fires user_engagement events at 10s, 30s, 60s
 * so GA4 registers active session time.
 */
export const startHeartbeat = () => {
  if (heartbeatStarted) return;
  heartbeatStarted = true;

  const milestones = [10_000, 30_000, 60_000];
  const sessionStart = Date.now();

  const checkMilestones = () => {
    const elapsed = Date.now() - sessionStart;
    milestones.forEach((ms) => {
      if (elapsed >= ms && !firedHeartbeats.has(ms)) {
        firedHeartbeats.add(ms);
        trackEvent('user_engagement', {
          engagement_time_msec: ms,
          engagement_milestone: `${ms / 1000}s`,
        });
      }
    });
    if (firedHeartbeats.size < milestones.length) {
      requestAnimationFrame(checkMilestones);
    }
  };

  const firedHeartbeats = new Set<number>();

  // Only tick when tab is visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && firedHeartbeats.size < milestones.length) {
      requestAnimationFrame(checkMilestones);
    }
  });

  requestAnimationFrame(checkMilestones);
  debugLog('heartbeat started');
};

/**
 * Scroll depth tracking: fires at 25%, 50%, 75%, 90%.
 */
export const startScrollTracking = () => {
  if (scrollTrackingStarted) return;
  scrollTrackingStarted = true;

  const thresholds = [25, 50, 75, 90];

  const onScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const pct = Math.round((scrollTop / docHeight) * 100);

    thresholds.forEach((t) => {
      if (pct >= t && !firedScrollDepths.has(t)) {
        firedScrollDepths.add(t);
        trackEvent('scroll', {
          percent_scrolled: t,
          engagement_time_msec: Date.now() - performance.timing.navigationStart,
        });
      }
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  debugLog('scroll tracking started');
};

/** Reset scroll depths on route change */
export const resetScrollTracking = () => {
  firedScrollDepths.clear();
};
