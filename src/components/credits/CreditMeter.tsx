import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useUserCredits } from '@/hooks/useUserCredits';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import CreditHistoryDialog from './CreditHistoryDialog';

const CreditMeter = ({ className }: { className?: string }) => {
  const { user } = useAuth();
  const { remaining, dailyLimit, loading } = useUserCredits();
  const [open, setOpen] = useState(false);
  if (!user || loading) return null;

  const tone =
    remaining === 0 ? 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25'
    : remaining < 25 ? 'bg-orange-500/15 text-orange-600 border-orange-500/30 dark:text-orange-400 hover:bg-orange-500/25'
    : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer',
          tone,
          className
        )}
        title="View AI credit history"
        aria-label="Open AI credit history"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>AI {remaining}/{dailyLimit}</span>
      </button>
      <CreditHistoryDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

export default CreditMeter;
