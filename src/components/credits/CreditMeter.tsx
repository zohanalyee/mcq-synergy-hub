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
    remaining < 10
      ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-transparent shadow-md shadow-red-500/30 animate-pulse hover:brightness-110'
      : remaining <= 50
      ? 'bg-gradient-to-r from-orange-400 to-amber-500 text-white border-transparent shadow-md shadow-orange-500/30 animate-pulse hover:brightness-110'
      : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white border-transparent shadow-md shadow-purple-500/30 hover:brightness-110';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 cursor-pointer',
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
