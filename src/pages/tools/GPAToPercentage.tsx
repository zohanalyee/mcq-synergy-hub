import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const GPAToPercentage = () => {
  const [gpa, setGpa] = useState('');
  const [result, setResult] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const g = parseFloat(gpa);
      if (g >= 0 && g <= 4) setResult(((g - 0.5) * 25).toFixed(1));
      else setResult(null);
    }, 300);
    return () => clearTimeout(t);
  }, [gpa]);

  return (
    <Header>
      <ToolWrapper toolId="gpa-to-percentage" title="GPA to Percentage" description="Convert GPA to percentage" category="Student Tools">
        <div><Label>GPA (0-4 scale)</Label><Input type="number" value={gpa} onChange={e => setGpa(e.target.value)} placeholder="3.5" className="max-w-xs" /></div>
        <AnimatePresence>{result && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2"><p className="text-sm text-muted-foreground">Percentage</p><p className="text-4xl font-bold text-foreground">{result}%</p><CopyButton text={`${result}%`} /></motion.div>}</AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};
export default GPAToPercentage;
