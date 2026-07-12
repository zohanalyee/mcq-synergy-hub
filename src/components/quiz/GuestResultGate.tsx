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
import BrandMark from '@/components/BrandMark';

interface GuestResultGateProps {
  open: boolean;
  onClose: () => void;
  score: number;
  total: number;
  correctCount: number;
  returnPath?: string;
}

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
    { icon: CheckCircle, en: 'Detailed answer explanations', ur: 'ہر سوال کی مکمل وضاحت' },
    { icon: TrendingUp, en: 'Track your progress over time', ur: 'اپنی کارکردگی ٹریک کریں' },
    { icon: Target, en: 'AI weak-area analysis', ur: 'کمزور شعبے AI سے دیکھیں' },
    { icon: Zap, en: '100 fresh AI questions daily', ur: 'روزانہ 100 تازہ AI سوالات' },
    { icon: BarChart3, en: 'Dashboard & AI Coach', ur: 'ڈیش بورڈ اور AI کوچ' },
  ];

  const handleSignIn = () => {
    saveIntentRaw({ action: 'View detailed quiz results', path: location.pathname });
    navigate('/auth');
  };

  const handleTryAgain = () => {
    onClose();
    navigate(returnPath);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleTryAgain()}>
      <DialogContent className="max-w-md p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 via-violet-500/10 to-cyan-500/10 px-5 pt-4 pb-3 text-center border-b border-border">
          <div className="mx-auto w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center mb-1.5 shadow-lg">
            <Trophy className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="text-base font-bold leading-tight">Great Job! 🎉</h2>
          <p className="text-xs text-muted-foreground leading-tight" dir="rtl">بہترین کارکردگی!</p>
          <div className="mt-1.5 text-3xl font-bold leading-none bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
            {percentage}%
          </div>
          <p className="text-xs font-medium mt-1">{correctCount} / {total} correct</p>
          <p className="text-[11px] text-muted-foreground" dir="rtl">
            آپ نے {correctCount} میں سے {total} درست کیے
          </p>
        </div>

        {/* Sign In CTA */}
        <div className="px-5 pt-3">
          <Button
            className="w-full h-10 bg-brand-gradient text-white shadow-brand hover:brightness-110 text-sm font-semibold"
            onClick={handleSignIn}
          >
            Sign In / سائن ان
          </Button>
        </div>

        {/* Benefits */}
        <div className="px-5 pt-2 pb-2">
          <div className="rounded-lg bg-slate-50 dark:bg-muted/40 border border-border/60 p-3 space-y-1.5">
            {benefits.map((b) => (
              <div key={b.en} className="flex items-start gap-2">
                <b.icon className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 flex items-start justify-between gap-2">
                  <p className="text-xs font-medium leading-tight">{b.en}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight" dir="rtl">{b.ur}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Try Again */}
        <div className="px-5 pb-3">
          <Button variant="outline" size="sm" className="w-full h-9" onClick={handleTryAgain}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Try Again
          </Button>
        </div>

        {/* Trust badge */}
        <div className="border-t border-border px-5 py-1.5 text-center bg-muted/30">
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <Lock className="h-2.5 w-2.5" />
            Your data is safe & secure · آپ کا ڈیٹا محفوظ ہے
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestResultGate;
