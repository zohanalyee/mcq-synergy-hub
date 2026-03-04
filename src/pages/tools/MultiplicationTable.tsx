import { useState } from 'react';
import Header from '@/components/Header';
import ToolWrapper from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MultiplicationTable = () => {
  const [num, setNum] = useState('5');
  const [range, setRange] = useState('12');
  const n = parseInt(num) || 1;
  const r = Math.min(parseInt(range) || 10, 50);

  return (
    <Header>
      <ToolWrapper toolId="multiplication-table" title="Multiplication Table" description="Generate multiplication tables" category="Student Tools">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><Label>Number</Label><Input type="number" value={num} onChange={e => setNum(e.target.value)} /></div>
          <div><Label>Range (up to)</Label><Input type="number" value={range} onChange={e => setRange(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {Array.from({ length: r }, (_, i) => i + 1).map(i => (
            <div key={i} className="flex justify-between p-2 rounded hover:bg-accent/30 transition-colors font-mono text-sm">
              <span className="text-muted-foreground">{n} × {i}</span>
              <span className="font-bold text-foreground">= {n * i}</span>
            </div>
          ))}
        </div>
      </ToolWrapper>
    </Header>
  );
};
export default MultiplicationTable;
