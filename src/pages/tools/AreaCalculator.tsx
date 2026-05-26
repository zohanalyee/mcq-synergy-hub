import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

const AreaCalculator = () => {
  const [shape, setShape] = useState('rectangle');
  const [d1, setD1] = useState('');
  const [d2, setD2] = useState('');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const a = parseFloat(d1), b = parseFloat(d2);
      let area: number | null = null;
      if (shape === 'rectangle' && a > 0 && b > 0) area = a * b;
      else if (shape === 'circle' && a > 0) area = Math.PI * a * a;
      else if (shape === 'triangle' && a > 0 && b > 0) area = 0.5 * a * b;
      else if (shape === 'square' && a > 0) area = a * a;
      setResult(area !== null ? `${area.toFixed(2)} sq units` : null);
    }, 300);
    return () => clearTimeout(t);
  }, [d1, d2, shape]);

  return (
    <Header>
      <ToolWrapper toolId="area-calculator" title="Area Calculator" description="Calculate area of shapes" category="Calculators">
        <div className="space-y-4">
          <div><Label>Shape</Label>
            <Select value={shape} onValueChange={v => { setShape(v); setD1(''); setD2(''); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rectangle">Rectangle</SelectItem><SelectItem value="circle">Circle</SelectItem><SelectItem value="triangle">Triangle</SelectItem><SelectItem value="square">Square</SelectItem></SelectContent></Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>{shape === 'circle' ? 'Radius' : shape === 'square' ? 'Side' : shape === 'triangle' ? 'Base' : 'Length'}</Label><Input type="number" inputMode="decimal" value={d1} onChange={e => setD1(e.target.value)} /></div>
            {(shape === 'rectangle' || shape === 'triangle') && <div><Label>{shape === 'triangle' ? 'Height' : 'Width'}</Label><Input type="number" inputMode="decimal" value={d2} onChange={e => setD2(e.target.value)} /></div>}
          </div>
        </div>
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Area</p>
              <p className="text-3xl font-bold text-foreground">{result}</p>
              <CopyButton text={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};

export default AreaCalculator;
