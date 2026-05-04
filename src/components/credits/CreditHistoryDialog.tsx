import { useEffect, useState } from 'react';
import { Sparkles, TrendingDown, TrendingUp, RefreshCw, History } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useUserCredits } from '@/hooks/useUserCredits';
import { cn } from '@/lib/utils';

interface CreditTx {
  id: string;
  amount: number;
  action_type: string;
  details: string | null;
  balance_after: number | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const CreditHistoryDialog = ({ open, onOpenChange }: Props) => {
  const { remaining, used, dailyLimit, refresh } = useUserCredits();
  const [txs, setTxs] = useState<CreditTx[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc('get_my_credit_history', { p_limit: 100 });
    if (!error && Array.isArray(data)) setTxs(data as CreditTx[]);
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      load();
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const usagePct = Math.min(100, Math.round((used / dailyLimit) * 100));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Credit History
          </DialogTitle>
          <DialogDescription className="text-xs">
            Your daily AI question allowance and recent activity.
          </DialogDescription>
        </DialogHeader>

        {/* Balance card */}
        <div className="px-5 pt-4">
          <div className="rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Remaining today</div>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-primary">{remaining}</span>
                  <span className="text-sm text-muted-foreground">/ {dailyLimit}</span>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>Used: <span className="font-medium text-foreground">{used}</span></div>
                <div className="mt-0.5">Resets at midnight</div>
              </div>
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all',
                  remaining === 0 ? 'bg-destructive'
                    : remaining < 25 ? 'bg-orange-500'
                    : 'bg-primary'
                )}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="px-5 pt-4 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <History className="h-3.5 w-3.5" /> Activity
          </div>
          <button
            onClick={load}
            className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} /> Refresh
          </button>
        </div>

        <ScrollArea className="max-h-[340px] px-5 pb-5">
          {loading && txs.length === 0 ? (
            <div className="space-y-2 py-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : txs.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No credit activity yet. Generate a test to see your history here.
            </div>
          ) : (
            <ul className="divide-y">
              {txs.map(tx => {
                const isDebit = tx.amount < 0;
                return (
                  <li key={tx.id} className="py-2.5 flex items-start gap-3">
                    <div className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                      isDebit ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    )}>
                      {isDebit ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium truncate">{tx.action_type}</div>
                        <div className={cn(
                          'text-sm font-semibold tabular-nums shrink-0',
                          isDebit ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
                        )}>
                          {isDebit ? '' : '+'}{tx.amount}
                        </div>
                      </div>
                      {tx.details && (
                        <div className="text-[12px] text-muted-foreground truncate">{tx.details}</div>
                      )}
                      <div className="text-[11px] text-muted-foreground/80 mt-0.5 flex items-center gap-2">
                        <span>{formatDate(tx.created_at)}</span>
                        {tx.balance_after != null && (
                          <span className="text-muted-foreground/60">• Balance: {tx.balance_after}</span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CreditHistoryDialog;
