import { useEffect, useState } from 'react';
import CreditExhaustedDialog from './CreditExhaustedDialog';
import { refreshCreditsBroadcast } from '@/hooks/useUserCredits';

const GlobalCreditExhaustedListener = () => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => { setOpen(true); refreshCreditsBroadcast(); };
    window.addEventListener('mcqsai:credits-exhausted', h);
    return () => window.removeEventListener('mcqsai:credits-exhausted', h);
  }, []);
  return <CreditExhaustedDialog open={open} onClose={() => setOpen(false)} />;
};

export default GlobalCreditExhaustedListener;
