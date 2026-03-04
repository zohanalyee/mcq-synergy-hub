import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

const SpeedCalculator = () => {
  const [mode, setMode] = useState('speed');
  const [v1, setV1] = useState('');
  const [v2, setV2] = useState('');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const a = parseFloat(v1), b = parseFloat(v2);
      if (a > 0 && b > 0) {
        if (mode === 'speed') setResult(`${(a / b).toFixed(2)} km/h`);
        else if (mode === 'distance') setResult(`${(a * b).toFixed(2)} km`);
        else setResult(`${(a / b).toFixed(2)} hours`);
      } else setResult(null);
    }, 300);
    return () => clearTimeout(t);
  }, [v1, v2, mode]);

  const labels = mode === 'speed' ? ['Distance (km)', 'Time (hours)'] : mode === 'distance' ? ['Speed (km/h)', 'Time (hours)'] : ['Distance (km)', 'Speed (km/h)'];

  return (
    <Header>
      <ToolWrapper toolId="speed-calculator" title="Speed Calculator" description="Calculate speed, distance, or time" category="Calculators">
        <div className="space-y-4">
          <div><Label>Solve for</Label>
            <Select value={mode} onValueChange={setMode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="speed">Speed</SelectItem><SelectItem value="distance">Distance</SelectItem><SelectItem value="time">Time</SelectItem></SelectContent></Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>{labels[0]}</Label><Input type="number" value={v1} onChange={e => setV1(e.target.value)} /></div>
            <div><Label>{labels[1]}</Label><Input type="number" value={v2} onChange={e => setV2(e.target.value)} /></div>
          </div>
        </div>
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2">
              <p className="text-sm text-muted-foreground capitalize">{mode}</p>
              <p className="text-3xl font-bold text-foreground">{result}</p>
              <CopyButton text={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </ToolWrapper>
    </Header>
  );
};

export default SpeedCalculator;
