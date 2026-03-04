import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

const RATES: Record<string, number> = { USD: 1, EUR: 0.92, GBP: 0.79, PKR: 278.5, INR: 83.1, CAD: 1.36, AUD: 1.53, SAR: 3.75, AED: 3.67, CNY: 7.24 };

const CurrencyConverter = () => {
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('PKR');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const a = parseFloat(amount);
      if (a > 0) { const usd = a / RATES[from]; setResult((usd * RATES[to]).toFixed(2)); }
      else setResult(null);
    }, 300);
    return () => clearTimeout(t);
  }, [amount, from, to]);

  const currencies = Object.keys(RATES);
  return (
    <Header>
      <ToolWrapper toolId="currency-converter" title="Currency Converter" description="Convert between currencies (static rates)" category="Converters">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><Label>Amount</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="100" /></div>
          <div><Label>From</Label><Select value={from} onValueChange={setFrom}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>To</Label><Select value={to} onValueChange={setTo}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <AnimatePresence>{result && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2"><p className="text-sm text-muted-foreground">{amount} {from} =</p><p className="text-4xl font-bold text-foreground">{parseFloat(result).toLocaleString()} {to}</p><CopyButton text={`${result} ${to}`} /></motion.div>}</AnimatePresence>
        <p className="text-xs text-muted-foreground mt-4">⚠️ Rates are approximate and for reference only.</p>
      </ToolWrapper>
    </Header>
  );
};
export default CurrencyConverter;
