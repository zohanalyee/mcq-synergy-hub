import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

const EquationSolver = () => {
  const [type, setType] = useState('linear');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const na = parseFloat(a), nb = parseFloat(b), nc = parseFloat(c);
      if (type === 'linear' && !isNaN(na) && !isNaN(nb) && na !== 0) {
        setResult(`x = ${(-nb / na).toFixed(4)}`);
      } else if (type === 'quadratic' && !isNaN(na) && !isNaN(nb) && !isNaN(nc) && na !== 0) {
        const disc = nb * nb - 4 * na * nc;
        if (disc > 0) setResult(`x₁ = ${((-nb + Math.sqrt(disc)) / (2 * na)).toFixed(4)}, x₂ = ${((-nb - Math.sqrt(disc)) / (2 * na)).toFixed(4)}`);
        else if (disc === 0) setResult(`x = ${(-nb / (2 * na)).toFixed(4)}`);
        else setResult('No real solutions');
      } else setResult(null);
    }, 300);
    return () => clearTimeout(t);
  }, [type, a, b, c]);

  return (
    <Header>
      <ToolWrapper toolId="equation-solver" title="Equation Solver" description="Solve linear & quadratic equations" category="Generators">
        <div className="space-y-4">
          <div><Label>Type</Label>
            <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="linear">Linear (ax + b = 0)</SelectItem><SelectItem value="quadratic">Quadratic (ax² + bx + c = 0)</SelectItem></SelectContent></Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>a</Label><Input type="number" value={a} onChange={e => setA(e.target.value)} placeholder="1" /></div>
            <div><Label>b</Label><Input type="number" value={b} onChange={e => setB(e.target.value)} placeholder="0" /></div>
            {type === 'quadratic' && <div><Label>c</Label><Input type="number" value={c} onChange={e => setC(e.target.value)} placeholder="0" /></div>}
          </div>
        </div>
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Solution</p>
              <p className="text-2xl font-bold font-mono text-foreground">{result}</p>
              <CopyButton text={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};
export default EquationSolver;
