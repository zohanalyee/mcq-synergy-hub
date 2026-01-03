import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useLoading } from '@/contexts/LoadingContext';

const NavigationLoader = () => {
  const location = useLocation();
  const { showLoader } = useLoading();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip loader on initial page load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Show loader for 600ms on route change
    showLoader(600);
  }, [location.pathname, showLoader]);

  return null;
};

export default NavigationLoader;
