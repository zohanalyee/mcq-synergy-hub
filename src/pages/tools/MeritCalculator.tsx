import { useMemo, useState } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';

type QuotaKey = 'open' | 'sports' | 'disabled' | 'minorities' | 'overseas';

const QUOTAS: Record<QuotaKey, { label: string; bonus: number; note: string }> = {
  open:        { label: 'Open Merit',         bonus: 0,    note: 'No quota adjustment applied.' },
  sports:      { label: 'Sports Quota',       bonus: 2.5,  note: 'Typical +2–3% reservation for verified athletes.' },
  disabled:    { label: 'Disability Quota',   bonus: 3.0,  note: 'Reserved seats with relaxed merit (province-dependent).' },
  minorities:  { label: 'Minorities Quota',   bonus: 2.0,  note: '~2% reserved seats for non-Muslim Pakistani candidates.' },
  overseas:    { label: 'Overseas Pakistani', bonus: -1.5, note: 'Self-finance/overseas seats often close ~1–2% above open merit.' },
};

const MeritCalculator = () => {
  const [percent, setPercent] = useState('');
  const [hafiz, setHafiz] = useState(false);
  const [quota, setQuota] = useState<QuotaKey>('open');

  const result = useMemo(() => {
    const p = parseFloat(percent);
    if (!isFinite(p) || p < 0 || p > 100) return null;
    const hafizBonus = hafiz ? 1.82 : 0; // +20/1100 marks ≈ 1.82%
    const final = Math.max(0, Math.min(100, p + hafizBonus + QUOTAS[quota].bonus));
    let category: { label: string; tone: string };
    if (final >= 90) category = { label: 'Top merit', tone: 'text-emerald-600 dark:text-emerald-400' };
    else if (final >= 80) category = { label: 'High merit', tone: 'text-emerald-600 dark:text-emerald-400' };
    else if (final >= 70) category = { label: 'Mid merit', tone: 'text-amber-600 dark:text-amber-400' };
    else if (final >= 60) category = { label: 'Borderline', tone: 'text-amber-600 dark:text-amber-400' };
    else category = { label: 'Below typical cut-off', tone: 'text-rose-600 dark:text-rose-400' };
    return { final, category, hafizBonus };
  }, [percent, hafiz, quota]);

  return (
    <Header>
      <ToolWrapper
        toolId="merit-calculator"
        title="Merit Calculator"
        description="University merit calculator with hafiz bonus and quota adjustments"
        category="Student Tools"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="merit-pct">Open merit percentage</Label>
            <Input
              id="merit-pct"
              type="number"
              inputMode="decimal"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              placeholder="e.g. 82.5"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-foreground">Hafiz-e-Quran bonus</p>
              <p className="text-xs text-muted-foreground">+20 marks (≈ +1.82%) — verified hifz only</p>
            </div>
            <Switch checked={hafiz} onCheckedChange={setHafiz} />
          </div>

          <div>
            <Label htmlFor="merit-quota">Quota / Category</Label>
            <select
              id="merit-quota"
              value={quota}
              onChange={(e) => setQuota(e.target.value as QuotaKey)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {(Object.keys(QUOTAS) as QuotaKey[]).map((k) => (
                <option key={k} value={k}>{QUOTAS[k].label}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">{QUOTAS[quota].note}</p>
          </div>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-5 rounded-xl bg-accent/30 space-y-2 text-center"
          >
            <p className="text-sm text-muted-foreground">Final adjusted merit</p>
            <p className="text-4xl font-bold text-foreground">{result.final.toFixed(2)}%</p>
            <p className={`text-sm font-semibold ${result.category.tone}`}>{result.category.label}</p>
            {hafiz && <p className="text-xs text-muted-foreground">Including +{result.hafizBonus.toFixed(2)}% hafiz bonus</p>}
            <div className="pt-2"><CopyButton text={`Final merit: ${result.final.toFixed(2)}%`} /></div>
          </motion.div>
        )}
      </ToolWrapper>
    </Header>
  );
};

export default MeritCalculator;
