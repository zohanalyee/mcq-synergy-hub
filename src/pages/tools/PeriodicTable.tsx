import { useState } from 'react';
import Header from '@/components/Header';
import ToolWrapper from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ELEMENTS = [
  { symbol: 'H', name: 'Hydrogen', number: 1, mass: 1.008, group: 1, period: 1, cat: 'nonmetal' },
  { symbol: 'He', name: 'Helium', number: 2, mass: 4.003, group: 18, period: 1, cat: 'noble-gas' },
  { symbol: 'Li', name: 'Lithium', number: 3, mass: 6.941, group: 1, period: 2, cat: 'alkali' },
  { symbol: 'Be', name: 'Beryllium', number: 4, mass: 9.012, group: 2, period: 2, cat: 'alkaline' },
  { symbol: 'B', name: 'Boron', number: 5, mass: 10.81, group: 13, period: 2, cat: 'metalloid' },
  { symbol: 'C', name: 'Carbon', number: 6, mass: 12.01, group: 14, period: 2, cat: 'nonmetal' },
  { symbol: 'N', name: 'Nitrogen', number: 7, mass: 14.01, group: 15, period: 2, cat: 'nonmetal' },
  { symbol: 'O', name: 'Oxygen', number: 8, mass: 16.00, group: 16, period: 2, cat: 'nonmetal' },
  { symbol: 'F', name: 'Fluorine', number: 9, mass: 19.00, group: 17, period: 2, cat: 'halogen' },
  { symbol: 'Ne', name: 'Neon', number: 10, mass: 20.18, group: 18, period: 2, cat: 'noble-gas' },
  { symbol: 'Na', name: 'Sodium', number: 11, mass: 22.99, group: 1, period: 3, cat: 'alkali' },
  { symbol: 'Mg', name: 'Magnesium', number: 12, mass: 24.31, group: 2, period: 3, cat: 'alkaline' },
  { symbol: 'Al', name: 'Aluminium', number: 13, mass: 26.98, group: 13, period: 3, cat: 'metal' },
  { symbol: 'Si', name: 'Silicon', number: 14, mass: 28.09, group: 14, period: 3, cat: 'metalloid' },
  { symbol: 'P', name: 'Phosphorus', number: 15, mass: 30.97, group: 15, period: 3, cat: 'nonmetal' },
  { symbol: 'S', name: 'Sulfur', number: 16, mass: 32.07, group: 16, period: 3, cat: 'nonmetal' },
  { symbol: 'Cl', name: 'Chlorine', number: 17, mass: 35.45, group: 17, period: 3, cat: 'halogen' },
  { symbol: 'Ar', name: 'Argon', number: 18, mass: 39.95, group: 18, period: 3, cat: 'noble-gas' },
  { symbol: 'K', name: 'Potassium', number: 19, mass: 39.10, group: 1, period: 4, cat: 'alkali' },
  { symbol: 'Ca', name: 'Calcium', number: 20, mass: 40.08, group: 2, period: 4, cat: 'alkaline' },
];

const catColors: Record<string, string> = {
  'nonmetal': 'bg-green-500/20 border-green-500/40',
  'noble-gas': 'bg-purple-500/20 border-purple-500/40',
  'alkali': 'bg-red-500/20 border-red-500/40',
  'alkaline': 'bg-orange-500/20 border-orange-500/40',
  'metalloid': 'bg-teal-500/20 border-teal-500/40',
  'halogen': 'bg-yellow-500/20 border-yellow-500/40',
  'metal': 'bg-blue-500/20 border-blue-500/40',
};

const PeriodicTable = () => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof ELEMENTS[0] | null>(null);

  const filtered = ELEMENTS.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.symbol.toLowerCase().includes(search.toLowerCase()));

  return (
    <Header>
      <ToolWrapper toolId="periodic-table" title="Periodic Table" description="Interactive periodic table of elements" category="Student Tools">
        <Input placeholder="Search elements..." value={search} onChange={e => setSearch(e.target.value)} className="mb-4" />
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
          {filtered.map(el => (
            <button key={el.symbol} onClick={() => setSelected(el)}
              className={`p-1.5 rounded border text-center hover:scale-105 transition-all ${catColors[el.cat] || 'bg-muted/50 border-border'}`}>
              <div className="text-[10px] text-muted-foreground">{el.number}</div>
              <div className="text-sm font-bold text-foreground">{el.symbol}</div>
              <div className="text-[9px] text-muted-foreground truncate">{el.name}</div>
            </button>
          ))}
        </div>
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent>
            {selected && (
              <>
                <DialogHeader><DialogTitle>{selected.name} ({selected.symbol})</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Atomic Number:</span> <strong>{selected.number}</strong></div>
                  <div><span className="text-muted-foreground">Atomic Mass:</span> <strong>{selected.mass}</strong></div>
                  <div><span className="text-muted-foreground">Group:</span> <strong>{selected.group}</strong></div>
                  <div><span className="text-muted-foreground">Period:</span> <strong>{selected.period}</strong></div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </ToolWrapper>
    </Header>
  );
};
export default PeriodicTable;
