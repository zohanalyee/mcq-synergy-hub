import { useState } from 'react';
import Header from '@/components/Header';
import ToolWrapper from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FORMULAS = {
  'Physics': [
    { name: 'Speed', formula: 'v = d / t' },
    { name: 'Force', formula: 'F = m × a' },
    { name: 'Kinetic Energy', formula: 'KE = ½mv²' },
    { name: 'Potential Energy', formula: 'PE = mgh' },
    { name: 'Work', formula: 'W = F × d' },
    { name: 'Power', formula: 'P = W / t' },
    { name: "Ohm's Law", formula: 'V = IR' },
    { name: 'Density', formula: 'ρ = m / V' },
  ],
  'Math': [
    { name: 'Quadratic Formula', formula: 'x = (-b ± √(b²-4ac)) / 2a' },
    { name: 'Pythagorean Theorem', formula: 'a² + b² = c²' },
    { name: 'Area of Circle', formula: 'A = πr²' },
    { name: 'Circumference', formula: 'C = 2πr' },
    { name: 'Volume of Sphere', formula: 'V = (4/3)πr³' },
    { name: 'Slope', formula: 'm = (y₂-y₁)/(x₂-x₁)' },
    { name: 'Distance Formula', formula: 'd = √((x₂-x₁)² + (y₂-y₁)²)' },
  ],
  'Chemistry': [
    { name: 'Ideal Gas Law', formula: 'PV = nRT' },
    { name: 'Molarity', formula: 'M = mol / L' },
    { name: "Avogadro's Number", formula: 'N = 6.022 × 10²³' },
    { name: 'pH', formula: 'pH = -log[H⁺]' },
    { name: 'Density', formula: 'D = m / V' },
  ],
};

const FormulaSheet = () => {
  const [search, setSearch] = useState('');
  const categories = Object.keys(FORMULAS) as (keyof typeof FORMULAS)[];

  return (
    <Header>
      <ToolWrapper toolId="formula-sheet" title="Formula Sheet" description="Common math & science formulas" category="Student Tools">
        <Input placeholder="Search formulas..." value={search} onChange={e => setSearch(e.target.value)} className="mb-4" />
        <Tabs defaultValue={categories[0]}>
          <TabsList>{categories.map(c => <TabsTrigger key={c} value={c}>{c}</TabsTrigger>)}</TabsList>
          {categories.map(cat => (
            <TabsContent key={cat} value={cat}>
              <div className="grid gap-2">
                {FORMULAS[cat].filter(f => f.name.toLowerCase().includes(search.toLowerCase()) || f.formula.toLowerCase().includes(search.toLowerCase())).map(f => (
                  <div key={f.name} className="flex justify-between items-center p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors">
                    <span className="text-sm font-medium text-foreground">{f.name}</span>
                    <code className="text-sm text-primary font-mono bg-primary/10 px-2 py-1 rounded">{f.formula}</code>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </ToolWrapper>
    </Header>
  );
};
export default FormulaSheet;
