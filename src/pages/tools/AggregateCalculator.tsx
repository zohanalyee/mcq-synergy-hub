import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import ToolWrapper, { CopyButton } from '@/components/tools/ToolWrapper';
import { Card, CardContent } from '@/components/ui/card';
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

const FORMULA_TABLE: { exam: string; matric: string; fsc: string; test: string; body: string }[] = [
  { exam: 'MDCAT (PMC / PM&DC)', matric: '10%', fsc: '40%', test: '50%', body: 'Public medical & dental colleges' },
  { exam: 'UHS Punjab', matric: '10%', fsc: '40%', test: '50%', body: 'Punjab MBBS / BDS merit lists' },
  { exam: 'NUMS', matric: '10%', fsc: '40%', test: '50%', body: 'NUMS own entry test' },
  { exam: 'ECAT (UET Lahore)', matric: '25%', fsc: '45%', test: '30%', body: 'Punjab engineering universities' },
  { exam: 'NUST (NET)', matric: '10%', fsc: '15%', test: '75%', body: 'NUST engineering & sciences' },
];

const RELATED_PREP = [
  { label: 'MDCAT Past Papers', url: '/mdcat-past-papers' },
  { label: 'MDCAT Syllabus 2026', url: '/mdcat-syllabus' },
  { label: 'MDCAT MCQs Practice', url: '/exams/mdcat' },
  { label: 'NUMS Preparation', url: '/exams/nums' },
  { label: 'ECAT Preparation', url: '/ecat-preparation' },
  { label: 'Merit Calculator (quotas & hafiz bonus)', url: '/tools/merit-calculator' },
];

const AggregateContent = () => (
  <div className="space-y-4">
    <Card className="border-border/50">
      <CardContent className="p-4 sm:p-6 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">How the MDCAT aggregate is calculated</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Pakistani public medical colleges do not rank students on MDCAT marks alone. Your admission
          aggregate combines three results — Matric, FSc (Pre-Medical) and the entry test — using the
          PMC weightage of <strong className="text-foreground">10% Matric + 40% FSc + 50% MDCAT</strong>.
          Each result is first converted to a percentage, then multiplied by its weight, and the three
          weighted values are added together.
        </p>
        <div className="rounded-lg bg-accent/30 p-4 space-y-1.5 text-sm">
          <p className="font-medium text-foreground">Worked example</p>
          <p className="text-muted-foreground">Matric 1000 / 1100 = 90.91% → 90.91 × 0.10 = <strong className="text-foreground">9.09</strong></p>
          <p className="text-muted-foreground">FSc 950 / 1100 = 86.36% → 86.36 × 0.40 = <strong className="text-foreground">34.55</strong></p>
          <p className="text-muted-foreground">MDCAT 160 / 200 = 80.00% → 80.00 × 0.50 = <strong className="text-foreground">40.00</strong></p>
          <p className="pt-1 border-t border-border/50 text-foreground font-semibold">Aggregate = 9.09 + 34.55 + 40.00 = 83.64%</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The same three-step method applies to every exam below — only the weights change. That is why a
          strong entry test can lift a modest FSc result for NUST, while for MDCAT your FSc marks carry
          almost as much weight as the test itself.
        </p>
      </CardContent>
    </Card>

    <Card className="border-border/50">
      <CardContent className="p-4 sm:p-6 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Aggregate formulas compared</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border/50">
                <th scope="col" className="py-2 pr-3 font-medium">Exam</th>
                <th scope="col" className="py-2 pr-3 font-medium">Matric</th>
                <th scope="col" className="py-2 pr-3 font-medium">FSc</th>
                <th scope="col" className="py-2 pr-3 font-medium">Entry test</th>
                <th scope="col" className="py-2 font-medium">Used for</th>
              </tr>
            </thead>
            <tbody>
              {FORMULA_TABLE.map((r) => (
                <tr key={r.exam} className="border-b border-border/30 last:border-0">
                  <td className="py-2 pr-3 font-medium text-foreground">{r.exam}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.matric}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.fsc}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.test}</td>
                  <td className="py-2 text-muted-foreground">{r.body}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Weightages follow the formulas published by PMC/PM&amp;DC, UHS, NUMS, UET Lahore and NUST.
          Universities can revise them between sessions — confirm against the current prospectus before
          relying on a number.
        </p>
      </CardContent>
    </Card>

    <Card className="border-border/50">
      <CardContent className="p-4 sm:p-6 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">What aggregate do I need?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          There is no fixed passing aggregate — merit is relative and moves every year with the number of
          applicants and seats. The chance bands shown by the calculator are drawn from 2024 open-merit
          closing aggregates, so treat them as a rough position check rather than a cut-off:
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li><strong className="text-foreground">MDCAT / UHS:</strong> roughly 88%+ has been competitive for top public MBBS seats; the mid-80s often lands mid-tier public or strong private lists.</li>
          <li><strong className="text-foreground">NUMS:</strong> closing aggregates have typically sat a little below UHS open merit.</li>
          <li><strong className="text-foreground">ECAT / UET:</strong> around 80%+ for the most in-demand engineering disciplines, lower for others.</li>
          <li><strong className="text-foreground">NUST NET:</strong> because NET is 75% of the aggregate, your test score effectively decides the outcome.</li>
        </ul>
        <p className="text-xs text-muted-foreground">
          These are historical indications only, not predictions or guarantees. Always check the official
          merit lists published by the university for the current session.
        </p>
      </CardContent>
    </Card>

    <Card className="border-border/50">
      <CardContent className="p-4 sm:p-6 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Common aggregate mistakes</h2>
        <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
          <li><strong className="text-foreground">Weighting raw marks instead of percentages.</strong> Multiply the percentage by the weight, never the marks.</li>
          <li><strong className="text-foreground">Using the wrong total.</strong> Matric and FSc totals differ across boards — enter the total printed on your own result card.</li>
          <li><strong className="text-foreground">Forgetting improvement-exam rules.</strong> Many institutions deduct marks for improvement attempts, or count the original result. Check the prospectus.</li>
          <li><strong className="text-foreground">Mixing formulas.</strong> A NUST aggregate cannot be compared with an MDCAT aggregate — the weightages are completely different.</li>
          <li><strong className="text-foreground">Confusing aggregate with merit.</strong> Quotas, hafiz-e-Quran bonus and reserved seats adjust merit after the aggregate is calculated — use the <Link to="/tools/merit-calculator" className="text-primary hover:underline">merit calculator</Link> for that step.</li>
        </ul>
      </CardContent>
    </Card>

    <Card className="border-border/50">
      <CardContent className="p-4 sm:p-6 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Calculated your aggregate? Now raise it</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The entry test is the only component you can still change. Practise the exact topics that appear
          on your paper with free MCQs and past papers:
        </p>
        <div className="flex flex-wrap gap-2">
          {RELATED_PREP.map((l) => (
            <Link
              key={l.url}
              to={l.url}
              className="px-4 py-2 bg-background border border-border/50 rounded-full text-sm text-primary hover:bg-primary/5 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

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
        extraContent={<AggregateContent />}

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
