import { useMemo, useState } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

const GOLD_NISAB_G = 87.48;
const SILVER_NISAB_G = 612.36;

const fmtPKR = (n: number) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(n);

const num = (v: string) => {
  const n = parseFloat(v);
  return isFinite(n) && n > 0 ? n : 0;
};

const ZakatCalculator = () => {
  // Default prices are editable indicative PKR/gram values — user should
  // update with today's market rate for accuracy.
  const [goldPrice, setGoldPrice] = useState('30000');   // PKR/gram (24k)
  const [silverPrice, setSilverPrice] = useState('340'); // PKR/gram
  const [cash, setCash] = useState('');
  const [goldG, setGoldG] = useState('');
  const [silverG, setSilverG] = useState('');
  const [business, setBusiness] = useState('');
  const [liabilities, setLiabilities] = useState('');

  const result = useMemo(() => {
    const gp = num(goldPrice);
    const sp = num(silverPrice);
    const goldValue = num(goldG) * gp;
    const silverValue = num(silverG) * sp;
    const assets = num(cash) + goldValue + silverValue + num(business);
    const zakatable = Math.max(0, assets - num(liabilities));
    const silverNisabPKR = SILVER_NISAB_G * sp;
    const goldNisabPKR = GOLD_NISAB_G * gp;
    // Standard scholarly view: use silver nisab when any silver is held; otherwise gold.
    const nisabPKR = num(silverG) > 0 ? silverNisabPKR : goldNisabPKR;
    const eligible = zakatable >= nisabPKR;
    const zakat = eligible ? zakatable * 0.025 : 0;
    return { assets, zakatable, zakat, eligible, nisabPKR, goldValue, silverValue };
  }, [goldPrice, silverPrice, cash, goldG, silverG, business, liabilities]);

  const Field = ({ id, label, value, set, placeholder, hint }: { id: string; label: string; value: string; set: (v: string) => void; placeholder?: string; hint?: string }) => (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" inputMode="decimal" value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} />
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );

  return (
    <Header>
      <ToolWrapper
        toolId="zakat-calculator"
        title="Zakat Calculator"
        description="Calculate 2.5% Zakat on cash, gold, silver and business assets using gold/silver nisab"
        category="Calculators"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field id="z-gp" label="Gold price (PKR/gram, 24k)" value={goldPrice} set={setGoldPrice} hint="Update to today's rate" />
            <Field id="z-sp" label="Silver price (PKR/gram)" value={silverPrice} set={setSilverPrice} hint="Update to today's rate" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field id="z-cash"   label="Cash & bank balance (PKR)" value={cash}    set={setCash}    placeholder="e.g. 250000" />
            <Field id="z-gold"   label="Gold held (grams)"          value={goldG}   set={setGoldG}   placeholder="e.g. 50" />
            <Field id="z-silver" label="Silver held (grams)"        value={silverG} set={setSilverG} placeholder="e.g. 0" />
            <Field id="z-biz"    label="Business assets (PKR)"      value={business} set={setBusiness} placeholder="Inventory + receivables" />
            <Field id="z-liab"   label="Liabilities / debts (PKR)"  value={liabilities} set={setLiabilities} placeholder="Deduct from wealth" />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-5 rounded-xl bg-accent/30 space-y-3"
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Zakat payable (2.5%)</p>
            <p className="text-4xl font-bold text-foreground">{fmtPKR(result.zakat)}</p>
            <p className={`text-xs mt-1 ${result.eligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
              {result.eligible
                ? 'Your wealth exceeds nisab — Zakat is due.'
                : `Below nisab (${fmtPKR(result.nisabPKR)}) — Zakat not obligatory this year.`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>Total assets: <span className="font-medium text-foreground">{fmtPKR(result.assets)}</span></div>
            <div>Zakatable wealth: <span className="font-medium text-foreground">{fmtPKR(result.zakatable)}</span></div>
            <div>Gold value: <span className="font-medium text-foreground">{fmtPKR(result.goldValue)}</span></div>
            <div>Silver value: <span className="font-medium text-foreground">{fmtPKR(result.silverValue)}</span></div>
          </div>
          <div className="flex justify-center pt-1">
            <CopyButton text={`Zakat due: ${fmtPKR(result.zakat)}`} />
          </div>
        </motion.div>

        <div className="mt-4 p-4 rounded-lg border border-border/60 bg-muted/30 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">🌙 Ramadan reminder</p>
          <p>Many Pakistanis pay Zakat in Ramadan for the multiplied reward. Pick a fixed lunar date each year as your Zakat anniversary so a complete hawl (year) is always measured.</p>
        </div>
      </ToolWrapper>
    </Header>
  );
};

export default ZakatCalculator;
