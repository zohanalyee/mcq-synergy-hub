import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

const TemperatureConverter = () => {
  const [celsius, setCelsius] = useState('');
  const [fahrenheit, setFahrenheit] = useState('');
  const [kelvin, setKelvin] = useState('');
  const [last, setLast] = useState('c');

  useEffect(() => {
    const t = setTimeout(() => {
      if (last === 'c' && celsius) { const c = parseFloat(celsius); setFahrenheit((c * 9/5 + 32).toFixed(2)); setKelvin((c + 273.15).toFixed(2)); }
      else if (last === 'f' && fahrenheit) { const f = parseFloat(fahrenheit); setCelsius(((f - 32) * 5/9).toFixed(2)); setKelvin(((f - 32) * 5/9 + 273.15).toFixed(2)); }
      else if (last === 'k' && kelvin) { const k = parseFloat(kelvin); setCelsius((k - 273.15).toFixed(2)); setFahrenheit(((k - 273.15) * 9/5 + 32).toFixed(2)); }
    }, 300);
    return () => clearTimeout(t);
  }, [celsius, fahrenheit, kelvin, last]);

  return (
    <Header>
      <ToolWrapper toolId="temperature-converter" title="Temperature Converter" description="Convert between °C, °F, and K" category="Converters">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><Label>Celsius (°C)</Label><Input type="number" inputMode="decimal" value={celsius} onChange={e => { setCelsius(e.target.value); setLast('c'); }} /></div>
          <div><Label>Fahrenheit (°F)</Label><Input type="number" inputMode="decimal" value={fahrenheit} onChange={e => { setFahrenheit(e.target.value); setLast('f'); }} /></div>
          <div><Label>Kelvin (K)</Label><Input type="number" inputMode="decimal" value={kelvin} onChange={e => { setKelvin(e.target.value); setLast('k'); }} /></div>
        </div>
      </ToolWrapper>
    </Header>
  );
};
export default TemperatureConverter;
