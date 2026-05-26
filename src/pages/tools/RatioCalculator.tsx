import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

const RatioCalculator = () => {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const na = parseInt(a), nb = parseInt(b);
      if (na > 0 && nb > 0) {
        const g = gcd(na, nb);
        setResult(`${na / g} : ${nb / g}`);
      } else setResult(null);
    }, 300);
    return () => clearTimeout(t);
  }, [a, b]);

  return (
    <Header>
      <ToolWrapper toolId="ratio-calculator" title="Ratio Calculator" description="Calculate and simplify ratios" category="Calculators">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>First Value</Label><Input type="number" inputMode="decimal" value={a} onChange={e => setA(e.target.value)} placeholder="12" /></div>
          <div><Label>Second Value</Label><Input type="number" inputMode="decimal" value={b} onChange={e => setB(e.target.value)} placeholder="8" /></div>
        </div>
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Simplified Ratio</p>
              <p className="text-4xl font-bold text-foreground">{result}</p>
              <CopyButton text={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};

export default RatioCalculator;
