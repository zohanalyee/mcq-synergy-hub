import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const DateCalculator = () => {
  const [date1, setDate1] = useState('');
  const [date2, setDate2] = useState('');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (date1 && date2) {
        const d = Math.abs(new Date(date2).getTime() - new Date(date1).getTime());
        const days = Math.ceil(d / 86400000);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30.44);
        setResult(`${days} days (${weeks} weeks, ~${months} months)`);
      } else setResult(null);
    }, 300);
    return () => clearTimeout(t);
  }, [date1, date2]);

  return (
    <Header>
      <ToolWrapper toolId="date-calculator" title="Date Calculator" description="Find days between two dates" category="Calculators">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Start Date</Label><Input type="date" value={date1} onChange={e => setDate1(e.target.value)} /></div>
          <div><Label>End Date</Label><Input type="date" value={date2} onChange={e => setDate2(e.target.value)} /></div>
        </div>
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Difference</p>
              <p className="text-2xl font-bold text-foreground">{result}</p>
              <CopyButton text={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};

export default DateCalculator;
