import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const EMICalculator = () => {
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [tenure, setTenure] = useState('');
  const [emi, setEmi] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const p = parseFloat(principal), r = parseFloat(rate) / 12 / 100, n = parseFloat(tenure) * 12;
      if (p > 0 && r > 0 && n > 0) {
        const e = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        setEmi(e.toFixed(0));
      } else setEmi(null);
    }, 300);
    return () => clearTimeout(t);
  }, [principal, rate, tenure]);

  return (
    <Header>
      <ToolWrapper toolId="emi-calculator" title="EMI Calculator" description="Calculate loan EMI payments" category="Calculators">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><Label>Loan Amount</Label><Input type="number" value={principal} onChange={e => setPrincipal(e.target.value)} placeholder="500000" /></div>
          <div><Label>Interest Rate (%/yr)</Label><Input type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="8.5" /></div>
          <div><Label>Tenure (years)</Label><Input type="number" value={tenure} onChange={e => setTenure(e.target.value)} placeholder="5" /></div>
        </div>
        <AnimatePresence>
          {emi && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Monthly EMI</p>
              <p className="text-4xl font-bold text-foreground">₹{parseInt(emi).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total: ₹{(parseInt(emi) * parseFloat(tenure) * 12).toLocaleString()}</p>
              <CopyButton text={`₹${parseInt(emi).toLocaleString()}`} />
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};

export default EMICalculator;
