import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RandomNumber = () => {
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('100');
  const [count, setCount] = useState('1');
  const [results, setResults] = useState<number[]>([]);

  const generate = useCallback(() => {
    const lo = parseInt(min) || 0, hi = parseInt(max) || 100, c = Math.min(parseInt(count) || 1, 100);
    const nums: number[] = [];
    for (let i = 0; i < c; i++) nums.push(Math.floor(Math.random() * (hi - lo + 1)) + lo);
    setResults(nums);
  }, [min, max, count]);

  return (
    <Header>
      <ToolWrapper toolId="random-number" title="Random Number Generator" description="Generate random numbers in a range" category="Generators">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div><Label>Min</Label><Input type="number" value={min} onChange={e => setMin(e.target.value)} /></div>
          <div><Label>Max</Label><Input type="number" value={max} onChange={e => setMax(e.target.value)} /></div>
          <div><Label>Count</Label><Input type="number" value={count} onChange={e => setCount(e.target.value)} /></div>
        </div>
        <Button onClick={generate} className="w-full gap-2"><RefreshCw className="h-4 w-4" /> Generate</Button>
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2">
              <div className="flex flex-wrap justify-center gap-3">
                {results.map((n, i) => (
                  <span key={i} className="text-3xl font-bold text-foreground">{n}</span>
                ))}
              </div>
              <CopyButton text={results.join(', ')} />
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};
export default RandomNumber;
