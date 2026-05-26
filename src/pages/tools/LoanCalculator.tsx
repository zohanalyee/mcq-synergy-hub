import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const LoanCalculator = () => {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [years, setYears] = useState('');
  const [result, setResult] = useState<{ monthly: string; totalInterest: string; total: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const p = parseFloat(principal), r = parseFloat(rate) / 12 / 100, n = parseFloat(years) * 12;
      if (p > 0 && r > 0 && n > 0) {
        const m = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        const total = m * n;
        setResult({ monthly: m.toFixed(0), totalInterest: (total - p).toFixed(0), total: total.toFixed(0) });
      } else setResult(null);
    }, 300);
    return () => clearTimeout(t);
  }, [principal, rate, years]);

  return (
    <Header>
      <ToolWrapper toolId="loan-calculator" title="Loan Calculator" description="Calculate loan payments & interest" category="Calculators">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><Label>Loan Amount</Label><Input type="number" inputMode="decimal" value={principal} onChange={e => setPrincipal(e.target.value)} placeholder="1000000" /></div>
          <div><Label>Interest Rate (%/yr)</Label><Input type="number" inputMode="decimal" value={rate} onChange={e => setRate(e.target.value)} placeholder="10" /></div>
          <div><Label>Loan Term (years)</Label><Input type="number" inputMode="decimal" value={years} onChange={e => setYears(e.target.value)} placeholder="10" /></div>
        </div>
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-accent/30 text-center"><p className="text-xs text-muted-foreground">Monthly</p><p className="text-xl font-bold text-foreground">₹{parseInt(result.monthly).toLocaleString()}</p></div>
              <div className="p-3 rounded-xl bg-accent/30 text-center"><p className="text-xs text-muted-foreground">Interest</p><p className="text-xl font-bold text-foreground">₹{parseInt(result.totalInterest).toLocaleString()}</p></div>
              <div className="p-3 rounded-xl bg-accent/30 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold text-foreground">₹{parseInt(result.total).toLocaleString()}</p></div>
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};

export default LoanCalculator;
