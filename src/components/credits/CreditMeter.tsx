import { Sparkles } from 'lucide-react';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const CreditMeter = ({ className }: { className?: string }) => {
  const { user } = useAuth();
  const { remaining, dailyLimit, loading } = useUserCredits();
  if (!user || loading) return null;

  const tone =
    remaining === 0 ? 'bg-destructive/15 text-destructive border-destructive/30'
    : remaining < 25 ? 'bg-orange-500/15 text-orange-600 border-orange-500/30 dark:text-orange-400'
    : 'bg-primary/10 text-primary border-primary/20';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        tone,
        className
      )}
      title="Daily AI question allowance — resets at midnight"
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>AI {remaining}/{dailyLimit}</span>
    </div>
  );
};

export default CreditMeter;
