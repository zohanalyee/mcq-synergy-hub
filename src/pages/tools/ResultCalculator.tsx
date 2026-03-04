import { useState } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';

const getGrade = (pct: number) => pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';

const ResultCalculator = () => {
  const [subjects, setSubjects] = useState([{ name: '', obtained: '', total: '' }]);
  const add = () => setSubjects([...subjects, { name: '', obtained: '', total: '' }]);
  const remove = (i: number) => setSubjects(subjects.filter((_, idx) => idx !== i));
  const update = (i: number, f: string, v: string) => { const n = [...subjects]; (n[i] as any)[f] = v; setSubjects(n); };

  const totalObt = subjects.reduce((s, sub) => s + (parseFloat(sub.obtained) || 0), 0);
  const totalMax = subjects.reduce((s, sub) => s + (parseFloat(sub.total) || 0), 0);
  const pct = totalMax > 0 ? totalObt / totalMax * 100 : 0;

  return (
    <Header>
      <ToolWrapper toolId="result-calculator" title="Result Calculator" description="Calculate exam results with grades" category="Student Tools">
        <div className="space-y-3">
          {subjects.map((sub, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1"><Label>Subject</Label><Input value={sub.name} onChange={e => update(i, 'name', e.target.value)} placeholder={`Subject ${i+1}`} /></div>
              <div className="w-24"><Label>Got</Label><Input type="number" value={sub.obtained} onChange={e => update(i, 'obtained', e.target.value)} /></div>
              <div className="w-24"><Label>Out of</Label><Input type="number" value={sub.total} onChange={e => update(i, 'total', e.target.value)} /></div>
              {subjects.length > 1 && <Button variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 className="h-4 w-4" /></Button>}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={add} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Subject</Button>
        </div>
        {totalMax > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2">
            <p className="text-sm text-muted-foreground">{totalObt} / {totalMax}</p>
            <p className="text-4xl font-bold text-foreground">{pct.toFixed(1)}%</p>
            <p className="text-2xl font-semibold text-primary">Grade: {getGrade(pct)}</p>
            <CopyButton text={`${pct.toFixed(1)}% - Grade ${getGrade(pct)}`} />
          </motion.div>
        )}
      </ToolWrapper>
    </Header>
  );
};
export default ResultCalculator;
