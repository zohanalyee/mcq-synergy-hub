import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

const SalaryCalculator = () => {
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [results, setResults] = useState<{ hourly: string; daily: string; weekly: string; monthly: string; annual: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const a = parseFloat(amount);
      if (a > 0) {
        let annual = period === 'annual' ? a : period === 'monthly' ? a * 12 : period === 'weekly' ? a * 52 : period === 'daily' ? a * 260 : a * 2080;
        setResults({ hourly: (annual / 2080).toFixed(0), daily: (annual / 260).toFixed(0), weekly: (annual / 52).toFixed(0), monthly: (annual / 12).toFixed(0), annual: annual.toFixed(0) });
      } else setResults(null);
    }, 300);
    return () => clearTimeout(t);
  }, [amount, period]);

  return (
    <Header>
      <ToolWrapper toolId="salary-calculator" title="Salary Calculator" description="Calculate monthly & annual salary breakdowns" category="Calculators">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Amount</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="50000" /></div>
          <div><Label>Period</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <AnimatePresence>
          {results && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(results).map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-accent/30 text-center">
                  <p className="text-xs text-muted-foreground capitalize">{k}</p>
                  <p className="text-lg font-bold text-foreground">{v}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};

export default SalaryCalculator;
