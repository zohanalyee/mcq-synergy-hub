import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const DurationCalculator = () => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (start && end) {
        const s = new Date(start).getTime(), e = new Date(end).getTime();
        if (e > s) {
          const diff = e - s;
          const days = Math.floor(diff / 86400000);
          const hrs = Math.floor((diff % 86400000) / 3600000);
          const mins = Math.floor((diff % 3600000) / 60000);
          setResult(`${days} days, ${hrs} hours, ${mins} minutes`);
        } else setResult(null);
      } else setResult(null);
    }, 300);
    return () => clearTimeout(t);
  }, [start, end]);

  return (
    <Header>
      <ToolWrapper toolId="duration-calculator" title="Duration Calculator" description="Calculate time duration between two dates/times" category="Calculators">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Start</Label><Input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} /></div>
          <div><Label>End</Label><Input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} /></div>
        </div>
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-2xl font-bold text-foreground">{result}</p>
              <CopyButton text={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};

export default DurationCalculator;
