// Google Analytics 4 utility
const GA_MEASUREMENT_ID = 'G-92HVL8ZQFC';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export const trackPageView = (url: string) => {
  if (typeof window.gtag === 'function') {
    window.gtag('config', GA_MEASUREMENT_ID, { page_path: url });
  }
};

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
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
