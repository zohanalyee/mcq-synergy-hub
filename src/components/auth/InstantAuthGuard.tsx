import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { saveIntentRaw } from '@/hooks/useAuthIntent';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';

interface InstantAuthGuardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actionName?: string;
}

const InstantAuthGuard = ({
  children,
  title = 'Sign In Required',
  description = 'Please sign in to access this feature',
  actionName,
}: InstantAuthGuardProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // During initial session check, show a minimal centered spinner (brief)
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
    const pathParts = location.pathname.split('/');
    const featureName = actionName || pathParts[pathParts.length - 1]?.replace(/-/g, ' ') || 'this feature';

    // Save intent so user returns here after sign-in
    saveIntentRaw({
      action: `Access ${featureName}`,
      path: location.pathname + location.search,
    });

    return (
      <Header>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <Card className="p-8 text-center shadow-lg border-border/50">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Lock className="h-8 w-8 text-primary" />
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
              <p className="text-muted-foreground mb-6">{description}</p>

              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  What you'll get after signing in:
                </div>
                {[
                  'Full access to this feature',
                  'Save your progress automatically',
                  'Access detailed analytics',
                  'Track your improvement',
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    {benefit}
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full"
                  size="lg"
                >
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    onClick={() => navigate('/auth?tab=signup')}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up free
                  </button>
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  After signing in, we'll bring you right back here to continue
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </Header>
    );
  }

  return <>{children}</>;
};

export default InstantAuthGuard;
