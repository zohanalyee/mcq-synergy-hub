import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const PercentageCalculator = () => {
  const [value, setValue] = useState('');
  const [total, setTotal] = useState('');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const v = parseFloat(value), tot = parseFloat(total);
      if (!isNaN(v) && !isNaN(tot) && tot !== 0) setResult(((v / tot) * 100).toFixed(2));
      else setResult(null);
    }, 300);
    return () => clearTimeout(t);
  }, [value, total]);

  return (
    <Header>
      <ToolWrapper toolId="percentage-calculator" title="Percentage Calculator" description="Calculate percentages easily" category="Calculators">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Value</Label><Input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="25" /></div>
          <div><Label>Total</Label><Input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="200" /></div>
        </div>
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Result</p>
              <p className="text-4xl font-bold text-foreground">{result}%</p>
              <CopyButton text={`${result}%`} />
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};

export default PercentageCalculator;
