import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const FuelCalculator = () => {
  const [distance, setDistance] = useState('');
  const [mileage, setMileage] = useState('');
  const [price, setPrice] = useState('');
  const [result, setResult] = useState<{ fuel: string; cost: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const d = parseFloat(distance), m = parseFloat(mileage), p = parseFloat(price);
      if (d > 0 && m > 0) {
        const fuel = d / m;
        setResult({ fuel: fuel.toFixed(2), cost: p > 0 ? (fuel * p).toFixed(2) : '—' });
      } else setResult(null);
    }, 300);
    return () => clearTimeout(t);
  }, [distance, mileage, price]);

  return (
    <Header>
      <ToolWrapper toolId="fuel-calculator" title="Fuel Calculator" description="Calculate fuel consumption & cost" category="Calculators">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><Label>Distance (km)</Label><Input type="number" inputMode="decimal" value={distance} onChange={e => setDistance(e.target.value)} placeholder="500" /></div>
          <div><Label>Mileage (km/L)</Label><Input type="number" inputMode="decimal" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="15" /></div>
          <div><Label>Fuel Price/L</Label><Input type="number" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} placeholder="280" /></div>
        </div>
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-accent/30 text-center"><p className="text-xs text-muted-foreground">Fuel Needed</p><p className="text-2xl font-bold text-foreground">{result.fuel} L</p></div>
              <div className="p-4 rounded-xl bg-accent/30 text-center"><p className="text-xs text-muted-foreground">Total Cost</p><p className="text-2xl font-bold text-foreground">₹{result.cost}</p></div>
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};

export default FuelCalculator;
