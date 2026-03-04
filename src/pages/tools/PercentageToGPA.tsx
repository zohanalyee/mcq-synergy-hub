import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const PercentageToGPA = () => {
  const [pct, setPct] = useState('');
  const [result, setResult] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const p = parseFloat(pct);
      if (p >= 0 && p <= 100) setResult((p / 25 + 0.5).toFixed(2));
      else setResult(null);
    }, 300);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <Header>
      <ToolWrapper toolId="percentage-to-gpa" title="Percentage to GPA" description="Convert percentage to GPA" category="Student Tools">
        <div><Label>Percentage</Label><Input type="number" value={pct} onChange={e => setPct(e.target.value)} placeholder="85" className="max-w-xs" /></div>
        <AnimatePresence>{result && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2"><p className="text-sm text-muted-foreground">GPA (4.0 Scale)</p><p className="text-4xl font-bold text-foreground">{result}</p><CopyButton text={result} /></motion.div>}</AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};
export default PercentageToGPA;
