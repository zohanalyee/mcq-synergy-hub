import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const TipCalculator = () => {
  const [bill, setBill] = useState('');
  const [tipPct, setTipPct] = useState('15');
  const [people, setPeople] = useState('1');
  const [result, setResult] = useState<{ tip: string; total: string; perPerson: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const b = parseFloat(bill), tp = parseFloat(tipPct), p = parseInt(people);
      if (b > 0 && tp >= 0 && p > 0) {
        const tip = b * tp / 100;
        setResult({ tip: tip.toFixed(2), total: (b + tip).toFixed(2), perPerson: ((b + tip) / p).toFixed(2) });
      } else setResult(null);
    }, 300);
    return () => clearTimeout(t);
  }, [bill, tipPct, people]);

  return (
    <Header>
      <ToolWrapper toolId="tip-calculator" title="Tip Calculator" description="Calculate tip amounts quickly" category="Calculators">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><Label>Bill Amount</Label><Input type="number" value={bill} onChange={e => setBill(e.target.value)} placeholder="100" /></div>
          <div><Label>Tip %</Label><Input type="number" value={tipPct} onChange={e => setTipPct(e.target.value)} /></div>
          <div><Label>Split Between</Label><Input type="number" value={people} onChange={e => setPeople(e.target.value)} min="1" /></div>
        </div>
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-accent/30 text-center"><p className="text-xs text-muted-foreground">Tip</p><p className="text-xl font-bold text-foreground">${result.tip}</p></div>
              <div className="p-3 rounded-xl bg-accent/30 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold text-foreground">${result.total}</p></div>
              <div className="p-3 rounded-xl bg-accent/30 text-center"><p className="text-xs text-muted-foreground">Per Person</p><p className="text-xl font-bold text-foreground">${result.perPerson}</p></div>
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};

export default TipCalculator;
