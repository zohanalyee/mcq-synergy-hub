import { useMemo, useState } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

// FBR 2025-26 salaried individual income tax slabs (annual, PKR).
const SLABS = [
  { upTo: 600_000,    rate: 0.00, base: 0,          floor: 0 },
  { upTo: 1_200_000,  rate: 0.05, base: 0,          floor: 600_000 },
  { upTo: 2_400_000,  rate: 0.15, base: 30_000,     floor: 1_200_000 },
  { upTo: 3_600_000,  rate: 0.25, base: 210_000,    floor: 2_400_000 },
  { upTo: 6_000_000,  rate: 0.30, base: 510_000,    floor: 3_600_000 },
  { upTo: Infinity,   rate: 0.35, base: 1_230_000,  floor: 6_000_000 },
];

const fmtPKR = (n: number) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n);

const PakistanTaxCalculator = () => {
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [income, setIncome] = useState('');

  const result = useMemo(() => {
    const raw = parseFloat(income);
    if (!isFinite(raw) || raw <= 0) return null;
    const annual = period === 'monthly' ? raw * 12 : raw;
    const slab = SLABS.find((s) => annual <= s.upTo)!;
    const tax = slab.base + (annual - slab.floor) * slab.rate;
    const breakdown = SLABS.map((s, i) => {
      const lower = s.floor;
      const upper = Math.min(annual, s.upTo);
      const taxable = Math.max(0, upper - lower);
      const slabTax = taxable * s.rate;
      const label = s.upTo === Infinity ? `Above ${fmtPKR(s.floor)}` : `${fmtPKR(s.floor)} – ${fmtPKR(s.upTo)}`;
      return { i, label, rate: s.rate, taxable, slabTax };
    }).filter((r) => r.taxable > 0);
    return {
      annual,
      monthlyTax: tax / 12,
      annualTax: tax,
      effective: (tax / annual) * 100,
      takeHomeAnnual: annual - tax,
      takeHomeMonthly: (annual - tax) / 12,
      breakdown,
    };
  }, [income, period]);

  return (
    <Header>
      <ToolWrapper
        toolId="pakistan-tax-calculator"
        title="Pakistan Income Tax Calculator"
        description="FBR 2025-26 salaried income tax calculator with monthly take-home"
        category="Calculators"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['monthly', 'annual'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 h-10 rounded-md text-sm font-medium border transition-colors ${
                  period === p
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                }`}
              >
                {p === 'monthly' ? 'Monthly Salary' : 'Annual Salary'}
              </button>
            ))}
          </div>

          <div>
            <Label htmlFor="tax-income">{period === 'monthly' ? 'Monthly' : 'Annual'} gross salary (PKR)</Label>
            <Input
              id="tax-income"
              type="number"
              inputMode="decimal"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder={period === 'monthly' ? 'e.g. 150000' : 'e.g. 1800000'}
            />
          </div>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-accent/30 text-center">
                <p className="text-xs text-muted-foreground">Monthly tax</p>
                <p className="text-xl font-bold text-foreground">{fmtPKR(result.monthlyTax)}</p>
              </div>
              <div className="p-4 rounded-xl bg-accent/30 text-center">
                <p className="text-xs text-muted-foreground">Monthly take-home</p>
                <p className="text-xl font-bold text-foreground">{fmtPKR(result.takeHomeMonthly)}</p>
              </div>
              <div className="p-4 rounded-xl bg-accent/30 text-center">
                <p className="text-xs text-muted-foreground">Annual tax</p>
                <p className="text-xl font-bold text-foreground">{fmtPKR(result.annualTax)}</p>
              </div>
              <div className="p-4 rounded-xl bg-accent/30 text-center">
                <p className="text-xs text-muted-foreground">Effective rate</p>
                <p className="text-xl font-bold text-foreground">{result.effective.toFixed(2)}%</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">Slab</th>
                    <th className="text-right px-3 py-2">Rate</th>
                    <th className="text-right px-3 py-2">Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {result.breakdown.map((r) => (
                    <tr key={r.i} className="border-t border-border/40">
                      <td className="px-3 py-2 text-foreground">{r.label}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{(r.rate * 100).toFixed(0)}%</td>
                      <td className="px-3 py-2 text-right text-foreground">{fmtPKR(r.slabTax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center">
              <CopyButton text={`Annual tax: ${fmtPKR(result.annualTax)} · Take-home: ${fmtPKR(result.takeHomeAnnual)}/yr`} />
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Based on FBR 2025-26 salaried slabs. Excludes super tax, surcharges and additional deductions.
            </p>
          </motion.div>
        )}
      </ToolWrapper>
    </Header>
  );
};

export default PakistanTaxCalculator;
