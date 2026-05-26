import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

const BMRCalculator = () => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [bmr, setBmr] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const w = parseFloat(weight), h = parseFloat(height), a = parseFloat(age);
      if (w > 0 && h > 0 && a > 0) {
        const val = gender === 'male' ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a : 447.593 + 9.247 * w + 3.098 * h - 4.330 * a;
        setBmr(val.toFixed(0));
      } else setBmr(null);
    }, 300);
    return () => clearTimeout(t);
  }, [weight, height, age, gender]);

  return (
    <Header>
      <ToolWrapper toolId="bmr-calculator" title="BMR Calculator" description="Calculate Basal Metabolic Rate" category="Calculators">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div><Label>Weight (kg)</Label><Input type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} placeholder="70" /></div>
          <div><Label>Height (cm)</Label><Input type="number" inputMode="decimal" value={height} onChange={e => setHeight(e.target.value)} placeholder="175" /></div>
          <div><Label>Age</Label><Input type="number" inputMode="decimal" value={age} onChange={e => setAge(e.target.value)} placeholder="25" /></div>
          <div><Label>Gender</Label>
            <Select value={gender} onValueChange={setGender}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select>
          </div>
        </div>
        <AnimatePresence>
          {bmr && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Your BMR</p>
              <p className="text-4xl font-bold text-foreground">{bmr} cal/day</p>
              <CopyButton text={`${bmr} cal/day`} />
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};

export default BMRCalculator;
