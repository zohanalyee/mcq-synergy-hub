import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const BinaryConverter = () => {
  const [decimal, setDecimal] = useState('');
  const [binary, setBinary] = useState('');
  const [hex, setHex] = useState('');
  const [octal, setOctal] = useState('');
  const [last, setLast] = useState('d');

  useEffect(() => {
    const t = setTimeout(() => {
      let n: number;
      if (last === 'd') n = parseInt(decimal);
      else if (last === 'b') n = parseInt(binary, 2);
      else if (last === 'h') n = parseInt(hex, 16);
      else n = parseInt(octal, 8);

      if (!isNaN(n) && n >= 0) {
        if (last !== 'd') setDecimal(n.toString());
        if (last !== 'b') setBinary(n.toString(2));
        if (last !== 'h') setHex(n.toString(16).toUpperCase());
        if (last !== 'o') setOctal(n.toString(8));
      }
    }, 300);
    return () => clearTimeout(t);
  }, [decimal, binary, hex, octal, last]);

  return (
    <Header>
      <ToolWrapper toolId="binary-converter" title="Binary Converter" description="Convert between decimal, binary, hex, and octal" category="Converters">
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Decimal</Label><Input value={decimal} onChange={e => { setDecimal(e.target.value); setLast('d'); }} placeholder="255" /></div>
          <div><Label>Binary</Label><Input value={binary} onChange={e => { setBinary(e.target.value); setLast('b'); }} placeholder="11111111" /></div>
          <div><Label>Hexadecimal</Label><Input value={hex} onChange={e => { setHex(e.target.value); setLast('h'); }} placeholder="FF" /></div>
          <div><Label>Octal</Label><Input value={octal} onChange={e => { setOctal(e.target.value); setLast('o'); }} placeholder="377" /></div>
        </div>
      </ToolWrapper>
    </Header>
  );
};
export default BinaryConverter;
