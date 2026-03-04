import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const toRoman = (n: number): string => {
  if (n <= 0 || n > 3999) return 'Out of range';
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let r = ''; vals.forEach((v,i) => { while(n >= v) { r += syms[i]; n -= v; } }); return r;
};
const fromRoman = (s: string): number => {
  const map: Record<string, number> = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
  let r = 0; for(let i = 0; i < s.length; i++) { const c = map[s[i].toUpperCase()] || 0; const n = map[s[i+1]?.toUpperCase()] || 0; r += c < n ? -c : c; }
  return r;
};

const RomanConverter = () => {
  const [decimal, setDecimal] = useState('');
  const [roman, setRoman] = useState('');
  const [last, setLast] = useState('d');

  useEffect(() => {
    const t = setTimeout(() => {
      if (last === 'd' && decimal) setRoman(toRoman(parseInt(decimal)));
      else if (last === 'r' && roman) setDecimal(fromRoman(roman).toString());
    }, 300);
    return () => clearTimeout(t);
  }, [decimal, roman, last]);

  return (
    <Header>
      <ToolWrapper toolId="roman-converter" title="Roman Numeral Converter" description="Convert to/from Roman numerals" category="Converters">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Decimal</Label><Input type="number" value={decimal} onChange={e => { setDecimal(e.target.value); setLast('d'); }} placeholder="42" /></div>
          <div><Label>Roman</Label><Input value={roman} onChange={e => { setRoman(e.target.value.toUpperCase()); setLast('r'); }} placeholder="XLII" /></div>
        </div>
      </ToolWrapper>
    </Header>
  );
};
export default RomanConverter;
