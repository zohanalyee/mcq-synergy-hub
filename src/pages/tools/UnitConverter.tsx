import { Ruler, ArrowRightLeft } from 'lucide-react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

type ConversionCategory = 'length' | 'weight' | 'temperature';

const conversions: Record<ConversionCategory, Record<string, number>> = {
  length: {
    'Meter': 1,
    'Kilometer': 0.001,
    'Centimeter': 100,
    'Millimeter': 1000,
    'Mile': 0.000621371,
    'Yard': 1.09361,
    'Foot': 3.28084,
    'Inch': 39.3701,
  },
  weight: {
    'Kilogram': 1,
    'Gram': 1000,
    'Milligram': 1000000,
    'Pound': 2.20462,
    'Ounce': 35.274,
    'Ton': 0.001,
  },
  temperature: {
    'Celsius': 1,
    'Fahrenheit': 1,
    'Kelvin': 1,
  },
};

const UnitConverter = () => {
  const [category, setCategory] = useState<ConversionCategory>('length');
  const [fromUnit, setFromUnit] = useState('Meter');
  const [toUnit, setToUnit] = useState('Kilometer');
  const [fromValue, setFromValue] = useState('1');
  const [toValue, setToValue] = useState('');

  const convert = (value: string, from: string, to: string, cat: ConversionCategory) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';

    if (cat === 'temperature') {
      let celsius: number;
      if (from === 'Celsius') celsius = numValue;
      else if (from === 'Fahrenheit') celsius = (numValue - 32) * 5/9;
      else celsius = numValue - 273.15;

      if (to === 'Celsius') return celsius.toFixed(4);
      if (to === 'Fahrenheit') return ((celsius * 9/5) + 32).toFixed(4);
      return (celsius + 273.15).toFixed(4);
    }

    const baseValue = numValue / conversions[cat][from];
    return (baseValue * conversions[cat][to]).toFixed(6);
  };

  const handleFromChange = (value: string) => {
    setFromValue(value);
    setToValue(convert(value, fromUnit, toUnit, category));
  };

  const handleCategoryChange = (newCategory: ConversionCategory) => {
    setCategory(newCategory);
    const units = Object.keys(conversions[newCategory]);
    setFromUnit(units[0]);
    setToUnit(units[1]);
    setFromValue('1');
    setToValue(convert('1', units[0], units[1], newCategory));
  };

  const swap = () => {
    const tempUnit = fromUnit;
    setFromUnit(toUnit);
    setToUnit(tempUnit);
    setToValue(convert(fromValue, toUnit, fromUnit, category));
  };

  return (
    <Header>
      <div className="container py-8 max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 mb-4">
            <Ruler className="h-8 w-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold">Unit Converter</h1>
          <p className="text-muted-foreground">Convert between units</p>
        </div>
        
        <Card className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-white/20">
          <CardHeader>
            <Tabs value={category} onValueChange={(v) => handleCategoryChange(v as ConversionCategory)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="length">Length</TabsTrigger>
                <TabsTrigger value="weight">Weight</TabsTrigger>
                <TabsTrigger value="temperature">Temp</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Select value={fromUnit} onValueChange={(v) => { setFromUnit(v); setToValue(convert(fromValue, v, toUnit, category)); }}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(conversions[category]).map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={fromValue}
                onChange={(e) => handleFromChange(e.target.value)}
                className="text-lg bg-background"
              />
            </div>

            <div className="flex justify-center">
              <Button variant="outline" size="icon" onClick={swap}>
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Select value={toUnit} onValueChange={(v) => { setToUnit(v); setToValue(convert(fromValue, fromUnit, v, category)); }}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(conversions[category]).map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={toValue}
                readOnly
                className="text-lg bg-muted/50"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Header>
  );
};

export default UnitConverter;
