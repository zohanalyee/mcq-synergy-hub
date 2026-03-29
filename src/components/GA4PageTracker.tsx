import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  trackPageView,
  startHeartbeat,
  startScrollTracking,
  resetScrollTracking,
} from '@/utils/analytics';

const GA4PageTracker = () => {
  const location = useLocation();

  // Start heartbeat once on mount
  useEffect(() => {
    startHeartbeat();
    startScrollTracking();
  }, []);

  // Track page views and reset scroll on route change
  useEffect(() => {
    resetScrollTracking();
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
};

export default GA4PageTracker;
