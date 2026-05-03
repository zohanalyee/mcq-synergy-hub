import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const DAILY_LIMIT = 100;
const TOAST_KEY = 'mcqsai_credit_toast_date';

interface CreditState {
  remaining: number;
  used: number;
  loading: boolean;
}

let lastBroadcast = 0;

export const refreshCreditsBroadcast = () => {
  lastBroadcast = Date.now();
  window.dispatchEvent(new CustomEvent('mcqsai:credits-changed'));
};

export const useUserCredits = () => {
  const { user } = useAuth();
  const [state, setState] = useState<CreditState>({ remaining: DAILY_LIMIT, used: 0, loading: true });

  const fetch = useCallback(async () => {
    if (!user) { setState({ remaining: DAILY_LIMIT, used: 0, loading: false }); return; }
    const { data, error } = await (supabase as any).rpc('get_my_credits');
    if (error || !Array.isArray(data) || data.length === 0) {
      setState(s => ({ ...s, loading: false }));
      return;
    }
    const row = data[0];
    const remaining = row.credits_remaining ?? DAILY_LIMIT;
    const used = row.credits_used_today ?? 0;
    setState({ remaining, used, loading: false });

    // Threshold toasts (once per day)
    const today = new Date().toISOString().slice(0, 10);
    const lastToast = localStorage.getItem(TOAST_KEY);
    if (lastToast !== `${today}:75` && used >= 75 && remaining > 0) {
      toast.warning('Running Low', { description: `Only ${remaining} AI questions left today. Resets at midnight.` });
      localStorage.setItem(TOAST_KEY, `${today}:75`);
    } else if (lastToast !== `${today}:25` && used >= 25 && used < 75) {
      toast.info(`AI Questions: ${used}/${DAILY_LIMIT} used today.`);
      localStorage.setItem(TOAST_KEY, `${today}:25`);
    }
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const handler = () => fetch();
    window.addEventListener('mcqsai:credits-changed', handler);
    return () => window.removeEventListener('mcqsai:credits-changed', handler);
  }, [fetch]);

  return { ...state, dailyLimit: DAILY_LIMIT, refresh: fetch };
};
