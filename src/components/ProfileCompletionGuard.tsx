import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import BrandingLoader from '@/components/BrandingLoader';

interface ProfileCompletionGuardProps {
  children: React.ReactNode;
}

const ALLOWED_ROUTES = [
  '/complete-profile',
  '/auth',
  '/sign-in',
  '/signin',
  '/sign-up',
  '/signup',
  '/privacy-policy',
  '/terms-of-service',
  '/about',
  '/contact',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/verify-email-sent',
];

const IS_SSR = typeof window === 'undefined' || !!(globalThis as any).__PRERENDER__;

const ProfileCompletionGuard = ({ children }: ProfileCompletionGuardProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (loading) return;

      if (!user) {
        setChecking(false);
        return;
      }

      const isAllowed = ALLOWED_ROUTES.some(r => location.pathname.startsWith(r));
      if (isAllowed) {
        setChecking(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('profiles')
          .select('profile_completed')
          .eq('id', user.id)
          .single();

        if (data && !data.profile_completed) {
          navigate('/complete-profile', {
            state: { from: location.pathname },
            replace: true,
          });
          return;
        }
      } catch (e) {
        console.error('Profile check error:', e);
      }

      setChecking(false);
    };

    check();
  }, [user, loading, location.pathname, navigate]);

  if (!IS_SSR && (loading || checking)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BrandingLoader message="Checking profile..." size="sm" inline />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProfileCompletionGuard;
