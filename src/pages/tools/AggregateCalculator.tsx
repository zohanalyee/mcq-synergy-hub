import { useMemo, useState } from 'react';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

type ExamKey = 'mdcat' | 'ecat' | 'nust' | 'nums' | 'uhs';

// Weightages reflect published university/HEC formulas. Cut-offs are
// approximate 2024 open-merit closing aggregates used for guidance only.
const EXAMS: Record<ExamKey, {
  label: string;
  weights: { matric: number; fsc: number; test: number };
  formula: string;
  cutoffs: { high: number; moderate: number };
  testLabel: string;
}> = {
  mdcat: { label: 'MDCAT (PMC)', weights: { matric: 0.10, fsc: 0.40, test: 0.50 }, formula: '10% Matric + 40% FSc + 50% MDCAT', cutoffs: { high: 88, moderate: 82 }, testLabel: 'MDCAT' },
  uhs:   { label: 'UHS Punjab',  weights: { matric: 0.10, fsc: 0.40, test: 0.50 }, formula: '10% Matric + 40% FSc + 50% Entry Test', cutoffs: { high: 89, moderate: 83 }, testLabel: 'Entry Test' },
  nums:  { label: 'NUMS',        weights: { matric: 0.10, fsc: 0.40, test: 0.50 }, formula: '10% Matric + 40% FSc + 50% NUMS', cutoffs: { high: 86, moderate: 80 }, testLabel: 'NUMS' },
  ecat:  { label: 'ECAT (UET)',  weights: { matric: 0.25, fsc: 0.45, test: 0.30 }, formula: '25% Matric + 45% FSc + 30% ECAT', cutoffs: { high: 80, moderate: 72 }, testLabel: 'ECAT' },
  nust:  { label: 'NUST (NET)',  weights: { matric: 0.10, fsc: 0.15, test: 0.75 }, formula: '10% Matric + 15% FSc + 75% NET', cutoffs: { high: 75, moderate: 65 }, testLabel: 'NUST NET' },
};

const pctOf = (obt: string, tot: string) => {
  const o = parseFloat(obt), t = parseFloat(tot);
  if (!isFinite(o) || !isFinite(t) || t <= 0 || o < 0) return null;
  return Math.min(100, (o / t) * 100);
};

const AggregateCalculator = () => {
  const [exam, setExam] = useState<ExamKey>('mdcat');
  const [matricObt, setMatricObt] = useState('');
  const [matricTot, setMatricTot] = useState('1100');
  const [fscObt, setFscObt] = useState('');
  const [fscTot, setFscTot] = useState('1100');
  const [testObt, setTestObt] = useState('');
  const [testTot, setTestTot] = useState('200');

  const cfg = EXAMS[exam];

  const result = useMemo(() => {
    const m = pctOf(matricObt, matricTot);
    const f = pctOf(fscObt, fscTot);
    const t = pctOf(testObt, testTot);
    if (m === null || f === null || t === null) return null;
    const agg = m * cfg.weights.matric + f * cfg.weights.fsc + t * cfg.weights.test;
    let band: { label: string; tone: string; note: string };
    if (agg >= cfg.cutoffs.high) band = { label: 'High chance', tone: 'text-emerald-600 dark:text-emerald-400', note: 'Competitive for open-merit seats in top public institutions.' };
    else if (agg >= cfg.cutoffs.moderate) band = { label: 'Moderate chance', tone: 'text-amber-600 dark:text-amber-400', note: 'Within range of mid-tier public seats or strong private admissions.' };
    else band = { label: 'Low chance', tone: 'text-rose-600 dark:text-rose-400', note: 'Below historical open-merit cut-offs — explore private or self-finance routes.' };
    return { agg, band, parts: { m, f, t } };
  }, [matricObt, matricTot, fscObt, fscTot, testObt, testTot, cfg]);

  return (
    <Header>
      <ToolWrapper
        toolId="aggregate-calculator"
        title="Aggregate Calculator"
        description="MDCAT, ECAT, NUST, NUMS & UHS aggregate calculator with admission-chance estimate"
        category="Student Tools"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="agg-exam">Exam</Label>
            <select
              id="agg-exam"
              value={exam}
              onChange={(e) => setExam(e.target.value as ExamKey)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {(Object.keys(EXAMS) as ExamKey[]).map((k) => (
                <option key={k} value={k}>{EXAMS[k].label}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">Formula: {cfg.formula}</p>
          </div>

          {[
            { label: 'Matric', obt: matricObt, tot: matricTot, setObt: setMatricObt, setTot: setMatricTot },
            { label: 'FSc / Intermediate', obt: fscObt, tot: fscTot, setObt: setFscObt, setTot: setFscTot },
            { label: cfg.testLabel, obt: testObt, tot: testTot, setObt: setTestObt, setTot: setTestTot },
          ].map((row) => (
            <div key={row.label} className="grid grid-cols-2 gap-3">
              <div>
                <Label>{row.label} obtained</Label>
                <Input type="number" inputMode="decimal" value={row.obt} onChange={(e) => row.setObt(e.target.value)} placeholder="e.g. 950" />
              </div>
              <div>
                <Label>{row.label} total</Label>
                <Input type="number" inputMode="decimal" value={row.tot} onChange={(e) => row.setTot(e.target.value)} placeholder="e.g. 1100" />
              </div>
            </div>
          ))}
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-5 rounded-xl bg-accent/30 space-y-3"
          >
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Aggregate ({cfg.label})</p>
              <p className="text-4xl font-bold text-foreground">{result.agg.toFixed(2)}%</p>
              <p className={`text-sm font-semibold ${result.band.tone}`}>{result.band.label}</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">{result.band.note}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-center text-muted-foreground">
              <div>Matric: <span className="font-medium text-foreground">{result.parts.m.toFixed(1)}%</span></div>
              <div>FSc: <span className="font-medium text-foreground">{result.parts.f.toFixed(1)}%</span></div>
              <div>{cfg.testLabel}: <span className="font-medium text-foreground">{result.parts.t.toFixed(1)}%</span></div>
            </div>
            <div className="flex justify-center pt-1">
              <CopyButton text={`${cfg.label} aggregate: ${result.agg.toFixed(2)}%`} />
            </div>
            <p className="text-[11px] text-muted-foreground text-center pt-1">
              Cut-offs are indicative based on 2024 open-merit closings. Verify with official prospectus.
            </p>
          </motion.div>
        )}
      </ToolWrapper>
    </Header>
  );
};

export default AggregateCalculator;
