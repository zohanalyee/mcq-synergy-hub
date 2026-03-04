import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

const AttendanceCalculator = () => {
  const [total, setTotal] = useState('');
  const [attended, setAttended] = useState('');
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const tot = parseInt(total), att = parseInt(attended);
      if (tot > 0 && att >= 0 && att <= tot) setResult(att / tot * 100);
      else setResult(null);
    }, 300);
    return () => clearTimeout(t);
  }, [total, attended]);

  return (
    <Header>
      <ToolWrapper toolId="attendance-calculator" title="Attendance Calculator" description="Track your attendance percentage" category="Student Tools">
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Total Classes</Label><Input type="number" value={total} onChange={e => setTotal(e.target.value)} placeholder="100" /></div>
          <div><Label>Classes Attended</Label><Input type="number" value={attended} onChange={e => setAttended(e.target.value)} placeholder="85" /></div>
        </div>
        <AnimatePresence>
          {result !== null && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-3">
              <p className="text-4xl font-bold text-foreground">{result.toFixed(1)}%</p>
              <Progress value={result} className="h-3" />
              <p className={`text-sm font-medium ${result >= 75 ? 'text-green-500' : 'text-red-500'}`}>
                {result >= 75 ? '✓ Above minimum requirement' : '✗ Below 75% requirement'}
              </p>
              <CopyButton text={`${result.toFixed(1)}%`} />
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};
export default AttendanceCalculator;
