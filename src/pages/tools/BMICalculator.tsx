import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const BMICalculator = () => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [category, setCategory] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      const w = parseFloat(weight), h = parseFloat(height) / 100;
      if (w > 0 && h > 0) {
        const val = w / (h * h);
        setBmi(val);
        setCategory(val < 18.5 ? 'Underweight' : val < 25 ? 'Normal' : val < 30 ? 'Overweight' : 'Obese');
      } else { setBmi(null); }
    }, 300);
    return () => clearTimeout(t);
  }, [weight, height]);

  return (
    <Header>
      <ToolWrapper toolId="bmi-calculator" title="BMI Calculator" description="Calculate your Body Mass Index" category="Calculators">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Weight (kg)</Label><Input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="70" /></div>
          <div><Label>Height (cm)</Label><Input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="175" /></div>
        </div>
        <AnimatePresence>
          {bmi !== null && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Your BMI</p>
              <p className="text-4xl font-bold text-foreground">{bmi.toFixed(1)}</p>
              <p className={`text-lg font-semibold ${category === 'Normal' ? 'text-green-500' : category === 'Underweight' ? 'text-blue-500' : category === 'Overweight' ? 'text-orange-500' : 'text-red-500'}`}>{category}</p>
              <CopyButton text={bmi.toFixed(1)} />
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};

export default BMICalculator;
