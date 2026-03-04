import { useState } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';

const GradeCalculator = () => {
  const [items, setItems] = useState([{ name: 'Assignment', score: '', weight: '' }]);
  const add = () => setItems([...items, { name: '', score: '', weight: '' }]);
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const update = (i: number, f: string, v: string) => { const n = [...items]; (n[i] as any)[f] = v; setItems(n); };

  const totalWeight = items.reduce((s, it) => s + (parseFloat(it.weight) || 0), 0);
  const weightedScore = items.reduce((s, it) => s + (parseFloat(it.score) || 0) * (parseFloat(it.weight) || 0) / 100, 0);
  const finalGrade = totalWeight > 0 ? (weightedScore / totalWeight * 100).toFixed(1) : null;

  return (
    <Header>
      <ToolWrapper toolId="grade-calculator" title="Grade Calculator" description="Calculate your final weighted grade" category="Student Tools">
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1"><Label>Name</Label><Input value={item.name} onChange={e => update(i, 'name', e.target.value)} /></div>
              <div className="w-20"><Label>Score %</Label><Input type="number" value={item.score} onChange={e => update(i, 'score', e.target.value)} /></div>
              <div className="w-20"><Label>Weight %</Label><Input type="number" value={item.weight} onChange={e => update(i, 'weight', e.target.value)} /></div>
              {items.length > 1 && <Button variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 className="h-4 w-4" /></Button>}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={add} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Item</Button>
        </div>
        {finalGrade && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Final Grade</p>
            <p className="text-4xl font-bold text-foreground">{finalGrade}%</p>
            <CopyButton text={`${finalGrade}%`} />
          </motion.div>
        )}
      </ToolWrapper>
    </Header>
  );
};
export default GradeCalculator;
