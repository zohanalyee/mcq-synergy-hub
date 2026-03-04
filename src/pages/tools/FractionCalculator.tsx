import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

const FractionCalculator = () => {
  const [n1, setN1] = useState('');
  const [d1, setD1] = useState('');
  const [op, setOp] = useState('+');
  const [n2, setN2] = useState('');
  const [d2, setD2] = useState('');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const a = parseInt(n1), b = parseInt(d1), c = parseInt(n2), d = parseInt(d2);
      if (!isNaN(a) && b && !isNaN(c) && d) {
        let rn: number, rd: number;
        if (op === '+') { rn = a * d + c * b; rd = b * d; }
        else if (op === '-') { rn = a * d - c * b; rd = b * d; }
        else if (op === '×') { rn = a * c; rd = b * d; }
        else { rn = a * d; rd = b * c; }
        if (rd !== 0) {
          const g = gcd(Math.abs(rn), Math.abs(rd));
          setResult(`${rn / g}/${rd / g}`);
        } else setResult(null);
      } else setResult(null);
    }, 300);
    return () => clearTimeout(t);
  }, [n1, d1, op, n2, d2]);

  return (
    <Header>
      <ToolWrapper toolId="fraction-calculator" title="Fraction Calculator" description="Add, subtract, multiply, divide fractions" category="Calculators">
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1"><Label>Num</Label><Input className="w-16" type="number" value={n1} onChange={e => setN1(e.target.value)} /></div>
          <span className="text-2xl text-muted-foreground pb-1">/</span>
          <div className="space-y-1"><Label>Den</Label><Input className="w-16" type="number" value={d1} onChange={e => setD1(e.target.value)} /></div>
          <Select value={op} onValueChange={setOp}><SelectTrigger className="w-16"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="+">+</SelectItem><SelectItem value="-">−</SelectItem><SelectItem value="×">×</SelectItem><SelectItem value="÷">÷</SelectItem></SelectContent></Select>
          <div className="space-y-1"><Label>Num</Label><Input className="w-16" type="number" value={n2} onChange={e => setN2(e.target.value)} /></div>
          <span className="text-2xl text-muted-foreground pb-1">/</span>
          <div className="space-y-1"><Label>Den</Label><Input className="w-16" type="number" value={d2} onChange={e => setD2(e.target.value)} /></div>
        </div>
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Result</p>
              <p className="text-4xl font-bold text-foreground">{result}</p>
              <CopyButton text={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};

export default FractionCalculator;
