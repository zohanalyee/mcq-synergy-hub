import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';

/**
 * Route-scoped crash guard: shows the branded error screen when a page
 * crashes, and automatically recovers when the user navigates elsewhere.
 */
const RouteErrorBoundary = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  return (
    <GlobalErrorBoundary scope="route" resetKey={location.pathname}>
      {children}
    </GlobalErrorBoundary>
  );
};

export default RouteErrorBoundary;
