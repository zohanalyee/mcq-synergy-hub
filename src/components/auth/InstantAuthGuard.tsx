import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { saveIntentRaw } from '@/hooks/useAuthIntent';
import Header from '@/components/Header';
import { getFeatureForPath } from '@/config/features';

interface InstantAuthGuardProps {
  children: ReactNode;
  /** Kept for backwards compatibility — no longer rendered. */
  title?: string;
  description?: string;
  actionName?: string;
}

/**
 * Protected-route guard.
 * - While the auth session is loading: show a minimal spinner.
 * - When unauthenticated: save intent and redirect immediately to /auth
 *   (no intermediate "Sign In Required" card).
 * - When authenticated: render children.
 */
const InstantAuthGuard = ({
  children,
  actionName,
}: InstantAuthGuardProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Header>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Header>
    );
  }

  if (!user) {
    // Guest policy resolves from FEATURE_CONFIG (single source of truth).
    const feature = getFeatureForPath(location.pathname);
    const pathParts = location.pathname.split('/');
    const featureName =
      actionName ||
      feature?.name ||
      pathParts[pathParts.length - 1]?.replace(/-/g, ' ') ||
      'this feature';

    saveIntentRaw({
      action: `Access ${featureName}`,
      path: location.pathname + location.search,
    });

    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default InstantAuthGuard;
