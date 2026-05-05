import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  CheckCircle,
  TrendingUp,
  Target,
  BarChart3,
  Zap,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { saveIntentRaw } from '@/hooks/useAuthIntent';

interface GuestResultGateProps {
  open: boolean;
  onClose: () => void;
  score: number;
  total: number;
  correctCount: number;
  /** Where "Try Again" should go. Defaults to /quizzes. */
  returnPath?: string;
}

/**
 * Unified bilingual sign-in gate shown to guest users at the end of any
 * quiz / test / mock test. Replaces the legacy QuizSignInGate and the
 * full premium results screen for unauthenticated users.
 */
export const GuestResultGate = ({
  open,
  onClose,
  score,
  total,
  correctCount,
  returnPath = '/quizzes',
}: GuestResultGateProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  const benefits = [
    {
      icon: CheckCircle,
      en: 'Detailed answer explanations',
      ur: 'ہر سوال کی مکمل وضاحت',
    },
    {
      icon: TrendingUp,
      en: 'Track your progress over time',
      ur: 'اپنی کارکردگی ٹریک کریں',
    },
    {
      icon: Target,
      en: 'AI weak-area analysis',
      ur: 'کمزور شعبے AI سے دیکھیں',
    },
    {
      icon: Zap,
      en: '100 fresh AI questions daily',
      ur: 'روزانہ 100 تازہ AI سوالات',
    },
    {
      icon: BarChart3,
      en: 'Dashboard & AI Coach',
      ur: 'ڈیش بورڈ اور AI کوچ',
    },
  ];

  const handleSignIn = () => {
    saveIntentRaw({
      action: 'View detailed quiz results',
      path: location.pathname,
    });
    navigate('/auth');
  };

  const handleTryAgain = () => {
    onClose();
    navigate(returnPath);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleTryAgain()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 via-violet-500/10 to-cyan-500/10 px-6 pt-6 pb-4 text-center border-b border-border">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center mb-2 shadow-lg">
            <Trophy className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold">Great Job! 🎉</h2>
          <p className="text-sm text-muted-foreground" dir="rtl">
            بہترین کارکردگی!
          </p>
          <div className="mt-3 text-5xl font-bold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
            {percentage}%
          </div>
          <p className="text-sm font-medium mt-1">
            {correctCount} / {total} correct
          </p>
          <p className="text-xs text-muted-foreground mt-0.5" dir="rtl">
            آپ نے {correctCount} میں سے {total} درست کیے
          </p>
        </div>

        {/* Primary Sign In CTA */}
        <div className="px-6 pt-4">
          <Button
            className="w-full h-12 bg-brand-gradient text-white shadow-brand hover:brightness-110 text-base font-semibold"
            onClick={handleSignIn}
          >
            Sign In / سائن ان
          </Button>
        </div>

        {/* Benefits container */}
        <div className="px-6 pt-3 pb-4">
          <div className="rounded-xl bg-slate-50 dark:bg-muted/40 border border-border/60 p-4 space-y-2.5">
            {benefits.map((b) => (
              <div key={b.en} className="flex items-start gap-2.5">
                <b.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">{b.en}</p>
                  <p
                    className="text-xs text-muted-foreground leading-tight"
                    dir="rtl"
                  >
                    {b.ur}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Try Again */}
        <div className="px-6 pb-4">
          <Button variant="outline" className="w-full" onClick={handleTryAgain}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Try Again
          </Button>
        </div>

        {/* Trust badge */}
        <div className="border-t border-border px-6 py-2.5 text-center bg-muted/30">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />
            Your data is safe & secure · آپ کا ڈیٹا محفوظ ہے
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestResultGate;
