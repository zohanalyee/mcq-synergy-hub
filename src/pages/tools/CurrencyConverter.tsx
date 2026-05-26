import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

// Fallback when live rates are unavailable (approx, USD base).
const FALLBACK: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, PKR: 278.5, INR: 83.1, CAD: 1.36, AUD: 1.53,
  SAR: 3.75, AED: 3.67, CNY: 7.24, JPY: 156.4, TRY: 32.5, BDT: 117.0,
};
const CACHE_KEY = 'fx-rates-usd-v1';
const CACHE_TTL = 60 * 60 * 1000; // 1h

type RatesCache = { rates: Record<string, number>; ts: number; updated: string };

const fetchRates = async (): Promise<RatesCache> => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') as RatesCache | null;
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached;
  } catch { /* ignore */ }
  try {
    // open.er-api.com is a free, no-key fallback for exchangerate.host
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error('rates fetch failed');
    const json = await res.json();
    const rates = json.rates as Record<string, number>;
    if (!rates || !rates.PKR) throw new Error('invalid rates');
    const next: RatesCache = { rates, ts: Date.now(), updated: json.time_last_update_utc || new Date().toUTCString() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return { rates: FALLBACK, ts: Date.now(), updated: 'fallback (offline rates)' };
  }
};

const CurrencyConverter = () => {
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('PKR');
  const [result, setResult] = useState<string | null>(null);
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK);
  const [updated, setUpdated] = useState<string>('');

  useEffect(() => { fetchRates().then(r => { setRates(r.rates); setUpdated(r.updated); }); }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const a = parseFloat(amount);
      if (a > 0 && rates[from] && rates[to]) {
        const usd = a / rates[from];
        setResult((usd * rates[to]).toFixed(2));
      } else setResult(null);
    }, 200);
    return () => clearTimeout(t);
  }, [amount, from, to, rates]);

  const currencies = Object.keys(rates).sort();

  return (
    <Header>
      <ToolWrapper
        toolId="currency-converter"
        title="Currency Converter"
        description="Convert between world currencies with live rates"
        category="Converters"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Amount</Label>
            <Input type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="100" />
          </div>
          <div>
            <Label>From</Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>To</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-accent/30 text-center space-y-2">
              <p className="text-sm text-muted-foreground">{amount} {from} =</p>
              <p className="text-4xl font-bold text-foreground">
                {new Intl.NumberFormat('en-PK', { maximumFractionDigits: 2 }).format(parseFloat(result))} {to}
              </p>
              <CopyButton text={`${result} ${to}`} />
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-xs text-muted-foreground mt-4">
          Rates updated: {updated || 'loading…'}. Cached 1 hour in your browser.
        </p>
      </ToolWrapper>
    </Header>
  );
};
export default CurrencyConverter;
