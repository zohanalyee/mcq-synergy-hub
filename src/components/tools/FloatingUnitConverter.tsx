import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Category = 'length' | 'weight' | 'temperature';

const conversions: Record<Category, Record<string, number>> = {
  length: {
    'm': 1,
    'km': 1000,
    'cm': 0.01,
    'mm': 0.001,
    'mi': 1609.34,
    'ft': 0.3048,
    'in': 0.0254,
  },
  weight: {
    'kg': 1,
    'g': 0.001,
    'mg': 0.000001,
    'lb': 0.453592,
    'oz': 0.0283495,
  },
  temperature: {
    'C': 1, 'F': 1, 'K': 1,
  },
};

const FloatingUnitConverter = () => {
  const [category, setCategory] = useState<Category>('length');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('km');
  const [fromValue, setFromValue] = useState('');
  const [result, setResult] = useState('');

  const convert = (value: string) => {
    setFromValue(value);
    const num = parseFloat(value);
    if (isNaN(num)) {
      setResult('');
      return;
    }

    if (category === 'temperature') {
      let celsius: number;
      if (fromUnit === 'C') celsius = num;
      else if (fromUnit === 'F') celsius = (num - 32) * 5/9;
      else celsius = num - 273.15;

      let converted: number;
      if (toUnit === 'C') converted = celsius;
      else if (toUnit === 'F') converted = celsius * 9/5 + 32;
      else converted = celsius + 273.15;

      setResult(converted.toFixed(2));
    } else {
      const baseValue = num * conversions[category][fromUnit];
      const converted = baseValue / conversions[category][toUnit];
      setResult(converted.toFixed(4));
    }
  };

  const swap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    convert(fromValue);
  };

  const units = Object.keys(conversions[category]);

  return (
    <div className="space-y-3">
      <Select value={category} onValueChange={(v: Category) => {
        setCategory(v);
        const newUnits = Object.keys(conversions[v]);
        setFromUnit(newUnits[0]);
        setToUnit(newUnits[1]);
        setFromValue('');
        setResult('');
      }}>
        <SelectTrigger className="h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="length">Length</SelectItem>
          <SelectItem value="weight">Weight</SelectItem>
          <SelectItem value="temperature">Temperature</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-1.5">
          <Input
            type="number"
            value={fromValue}
            onChange={(e) => convert(e.target.value)}
            placeholder="Value"
            className="h-8 text-sm"
          />
          <Select value={fromUnit} onValueChange={setFromUnit}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={swap}>
          <ArrowRightLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 space-y-1.5">
          <div className="h-8 px-3 flex items-center bg-muted/50 rounded-md text-sm font-mono">
            {result || '—'}
          </div>
          <Select value={toUnit} onValueChange={setToUnit}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default FloatingUnitConverter;
