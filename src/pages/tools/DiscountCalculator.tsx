import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const DiscountCalculator = () => {
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [result, setResult] = useState<{ savings: string; final: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const p = parseFloat(price), d = parseFloat(discount);
      if (p > 0 && d >= 0 && d <= 100) {
        const savings = p * d / 100;
        setResult({ savings: savings.toFixed(2), final: (p - savings).toFixed(2) });
      } else setResult(null);
    }, 300);
    return () => clearTimeout(t);
  }, [price, discount]);

  return (
    <Header>
      <ToolWrapper toolId="discount-calculator" title="Discount Calculator" description="Calculate discounted prices" category="Calculators">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Original Price</Label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="1000" /></div>
          <div><Label>Discount %</Label><Input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="20" /></div>
        </div>
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-accent/30 text-center"><p className="text-xs text-muted-foreground">You Save</p><p className="text-2xl font-bold text-green-500">${result.savings}</p></div>
              <div className="p-4 rounded-xl bg-accent/30 text-center"><p className="text-xs text-muted-foreground">Final Price</p><p className="text-2xl font-bold text-foreground">${result.final}</p></div>
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};

export default DiscountCalculator;
