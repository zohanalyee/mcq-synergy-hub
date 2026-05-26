import { useState } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';

const CGPACalculator = () => {
  const [semesters, setSemesters] = useState([{ gpa: '', credits: '' }]);
  const addSemester = () => setSemesters([...semesters, { gpa: '', credits: '' }]);
  const removeSemester = (i: number) => setSemesters(semesters.filter((_, idx) => idx !== i));
  const update = (i: number, field: string, val: string) => { const s = [...semesters]; (s[i] as any)[field] = val; setSemesters(s); };

  const totalCredits = semesters.reduce((s, sem) => s + (parseFloat(sem.credits) || 0), 0);
  const weightedSum = semesters.reduce((s, sem) => s + (parseFloat(sem.gpa) || 0) * (parseFloat(sem.credits) || 0), 0);
  const cgpa = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(2) : null;

  return (
    <Header>
      <ToolWrapper toolId="cgpa-calculator" title="CGPA Calculator" description="Calculate cumulative GPA across semesters" category="Student Tools">
        <div className="space-y-3">
          {semesters.map((sem, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1"><Label>Semester {i + 1} GPA</Label><Input type="number" inputMode="decimal" value={sem.gpa} onChange={e => update(i, 'gpa', e.target.value)} placeholder="3.5" /></div>
              <div className="flex-1"><Label>Credits</Label><Input type="number" inputMode="decimal" value={sem.credits} onChange={e => update(i, 'credits', e.target.value)} placeholder="18" /></div>
              {semesters.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeSemester(i)}><Trash2 className="h-4 w-4" /></Button>}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addSemester} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Semester</Button>
        </div>
        {cgpa && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Your CGPA</p>
            <p className="text-4xl font-bold text-foreground">{cgpa}</p>
            <CopyButton text={cgpa} />
          </motion.div>
        )}
      </ToolWrapper>
    </Header>
  );
};
export default CGPACalculator;
