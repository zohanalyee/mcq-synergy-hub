import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/contexts/UserRoleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWhatsAppChannel } from '@/hooks/useWhatsAppChannel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, FileDown, RefreshCw, Trash2, Shuffle, ArrowLeft } from 'lucide-react';
import * as R from '@/lib/pdfBuilder/rules';
import * as S from '@/lib/contentSafety';
import { toJobTestSlug } from '@/lib/jobTestSlug';

const db = supabase as any;
type Q = { id: string; subject: string; topic: string | null; question: string; options: any; correct_answer: string; explanation: string | null; difficulty: string | null; admin_approved: boolean };
type Def = { id: string; job_title: string; syllabus: any; department: string | null; status: string | null; created_at: string; n?: number };
type JT = { id: string; title: string; organization: string | null; definition_id: string | null };
type Sec = { subject: string; picked: Q[]; reserve: Q[]; wanted: number; short: number };

async function pageAll(build: (from: number, to: number) => any) {
  const out: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(from, from + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) return out;
  }
}

function deliver(bytes: Uint8Array, name: string) {
  const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

const PdfBuilder = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { data: channel } = useWhatsAppChannel();
  const [defs, setDefs] = useState<Def[]>([]);
  const [slugs, setSlugs] = useState<string[]>([]);
  const [defId, setDefId] = useState('');
  const [questions, setQuestions] = useState<Q[]>([]);
  const [reviews, setReviews] = useState<Record<string, R.Review>>({});
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(50);
  const [split, setSplit] = useState<{ subject: string; count: number }[]>([]);
  const [gateOnly, setGateOnly] = useState(false);
  const [needExp, setNeedExp] = useState(false);
  const [title, setTitle] = useState('');
  const [setNo, setSetNo] = useState(1);
  const [hub, setHub] = useState('');
  const [seed, setSeed] = useState(R.newSeed());
  const [secs, setSecs] = useState<Sec[] | null>(null);
  const [fixedPerms, setFixedPerms] = useState<string[][] | null>(null);
  const [rebuildOf, setRebuildOf] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<{ bytes: Uint8Array; name: string } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [jobTests, setJobTests] = useState<JT[]>([]);
  const [search, setSearch] = useState('');
  const [titleEdited, setTitleEdited] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const [{ data: d }, ids, { data: jt }] = await Promise.all([
        db.from('job_test_definitions').select('id, job_title, syllabus, department, status, created_at').order('job_title'),
        pageAll((f, t) => db.from('job_test_questions').select('job_test_id').order('id').range(f, t)),
        db.from('job_tests').select('id, title, organization, definition_id'),
      ]);
      const n: Record<string, number> = {};
      ids.forEach((r: any) => { n[r.job_test_id] = (n[r.job_test_id] || 0) + 1; });
      setDefs((d || []).map((x: Def) => ({ ...x, job_title: (x.job_title || '').replace(/\s+/g, ' ').trim(), n: n[x.id] || 0 })));
      setJobTests(jt || []);
    })().catch((e) => toast.error('Could not load tests', { description: e.message }));
    db.from('exam_pages').select('slug').eq('status', 'published').order('slug').then(({ data }: any) => setSlugs((data || []).map((r: any) => r.slug)));
  }, [isAdmin]);

  const def = defs.find((d) => d.id === defId);
  const hubSlug = hub && hub !== R.NO_HUB ? hub : '';
  const kind = R.examKind(def?.job_title || '', hubSlug);
  const cleanName = R.cleanTestName(def?.job_title || '');
  const examLabel = cleanName || 'Exam';
  const labels = useMemo(() => R.testLabels(defs), [defs]);
  const shownDefs = useMemo(() => defs.map((d, i) => ({ d, label: labels[i] }))
    .filter((x) => !search.trim() || x.label.toLowerCase().includes(search.trim().toLowerCase())), [defs, labels, search]);
  const mockSlug = useMemo(() => {
    const jt = jobTests.find((t) => t.definition_id === defId);
    return jt ? toJobTestSlug(jt as any, jobTests as any) : '';
  }, [jobTests, defId]);
  const campaign = R.campaignOf(hubSlug || cleanName);

  const sections = useMemo(() => {
    const list: { subject: string; percentage: number }[] = (def?.syllabus?.sections || []).map((s: any) => ({ subject: s.subject, percentage: Number(s.percentage) || 0 }));
    const known = new Set(list.map((s) => s.subject.toLowerCase()));
    [...new Set(questions.map((q) => q.subject))].forEach((s) => { if (s && !known.has(s.toLowerCase())) { known.add(s.toLowerCase()); list.push({ subject: s, percentage: 0 }); } });
    if (list.every((s) => !s.percentage)) list.forEach((s) => { s.percentage = questions.filter((q) => q.subject?.toLowerCase() === s.subject.toLowerCase()).length; });
    return list;
  }, [def, questions]);

  // Content-safety exclusions (rules 5, 6, 9, 10 + test-wide duplicates), counted per reason.
  const { pools, excluded } = useMemo(() => {
    const p: Record<string, Q[]> = {};
    const ex: Record<string, number> = {};
    const bump = (r: string) => { ex[r] = (ex[r] || 0) + 1; };
    sections.forEach((s) => { p[s.subject] = []; });
    const dupIds = S.nearDuplicateIds(questions);
    questions.forEach((q) => {
      const s = sections.find((x) => x.subject.toLowerCase() === (q.subject || '').toLowerCase());
      if (!s) return;
      const rv = reviews[q.id];
      const own = [...S.safetyReasons(q), ...(dupIds.has(q.id) ? ['near_duplicate'] : [])];
      if (own.length) { bump(own[0]); return; }
      if (R.reviewStatus(rv) === 'blocked') { bump(rv?.reasons?.[0] && S.REASON_LABELS[rv.reasons[0]] ? rv.reasons[0] : 'gate_review'); return; }
      if (R.isEligible(q, rv, { gateOnly, requireExplanation: needExp })) p[s.subject].push(q);
    });
    return { pools: p, excluded: ex };
  }, [questions, reviews, sections, gateOnly, needExp]);
  const aiReviewed = useMemo(() => Object.values(reviews).filter((r) => r.ai_verdict && r.ai_verdict !== 'pending').length, [reviews]);
  const reasonLabel = (r: string) => S.REASON_LABELS[r] || (r === 'gate_review' ? 'Quality Gate: needs review / failed' : r);

  const loadHistory = async (id: string) => {
    const { data } = await db.from('pdf_practice_sets').select('*').eq('definition_id', id).order('created_at', { ascending: false }).limit(20);
    setHistory(data || []);
    setSetNo(R.nextSetNumber(data || []));
  };

  const pickTest = async (id: string) => {
    setDefId(id); setSecs(null); setReady(null); setRebuildOf(null); setFixedPerms(null);
    if (!id) return;
    setLoading(true);
    try {
      const [qs, rv] = await Promise.all([
        pageAll((f, t) => db.from('job_test_questions').select('id, subject, topic, question, options, correct_answer, explanation, difficulty, admin_approved').eq('job_test_id', id).order('id').range(f, t)),
        pageAll((f, t) => db.from('question_quality_reviews').select('question_id, deterministic_ok, ai_verdict, checked_at, checker_version, reasons').eq('definition_id', id).order('id').range(f, t)),
      ]);
      setQuestions(qs); setReviews(R.latestReviews(rv));
      const d = defs.find((x) => x.id === id);
      setHub(R.defaultHubSlug(d?.job_title || '', slugs));
      setTitleEdited(false);
      setTitle(R.setTitle(R.cleanTestName(d?.job_title || ''), count));
      const { data: hs } = await db.from('pdf_practice_sets').select('*').eq('definition_id', id).order('created_at', { ascending: false }).limit(50);
      setHistory(hs || []);
      setSetNo(R.nextSetNumber(hs || []));
    } catch (e: any) { toast.error('Could not load questions', { description: e.message }); }
    setLoading(false);
  };

  useEffect(() => { setSplit(R.splitCounts(sections, count)); }, [sections, count]);
  useEffect(() => { if (def && !titleEdited) setTitle(R.setTitle(cleanName, count)); }, [count, def, cleanName, titleEdited]);

  /** Rule 8: never two near-same questions in one set (swaps also skip them). */
  const dedupe = (list: Sec[]) => {
    const chosen: Q[] = [];
    const clash = (q: Q) => chosen.some((c) => S.isNearDuplicate(c, q));
    return list.map((s) => {
      const reserve = [...s.reserve];
      const picked: Q[] = [];
      for (const q of s.picked) {
        let cand: Q | undefined = q;
        while (cand && clash(cand)) cand = reserve.shift();
        if (cand) { picked.push(cand); chosen.push(cand); }
      }
      return { ...s, picked, reserve, short: Math.max(0, s.wanted - picked.length) };
    });
  };

  const build = (s = seed) => {
    setSeed(s); setFixedPerms(null); setRebuildOf(null); setReady(null);
    setSecs(dedupe(R.pickSet(pools, split, s) as Sec[]));
  };

  const rebuild = (row: any) => {
    const byId = new Map(questions.map((q) => [q.id, q]));
    const missing = row.question_ids.filter((id: string) => !byId.has(id));
    if (missing.length) { toast.error(`${missing.length} question(s) of this set no longer exist, so it cannot be rebuilt exactly.`); return; }
    const sp = row.section_split as { subject: string; count: number }[];
    let i = 0;
    const s: Sec[] = sp.map((x) => { const picked = row.question_ids.slice(i, i + x.count).map((id: string) => byId.get(id)!); i += x.count; return { subject: x.subject, picked, reserve: [], wanted: x.count, short: 0 }; });
    setSecs(s); setSplit(sp); setSeed(Number(row.seed)); setFixedPerms(row.options_order); setRebuildOf(row.id);
    setTitle(row.title); setTitleEdited(true); setSetNo(row.set_number); setHub(row.hub_slug === 'none' ? R.NO_HUB : row.hub_slug); setGateOnly(row.gate_passed_only); setNeedExp(row.require_explanation); setReady(null);
    toast.success('Set loaded exactly as saved. Tap Generate PDF.');
  };

  const edit = (si: number, qi: number, swap: boolean) => {
    if (!secs) return;
    const next = secs.map((s) => ({ ...s, picked: [...s.picked], reserve: [...s.reserve] }));
    const sec = next[si];
    if (swap) {
      const others = next.flatMap((x, i) => x.picked.filter((_, j) => !(i === si && j === qi)));
      let r = sec.reserve.shift();
      while (r && others.some((o) => S.isNearDuplicate(o, r!))) r = sec.reserve.shift();
      if (!r) { toast.error('No more eligible questions in this section.'); return; }
      sec.picked[qi] = r;
    }
    else sec.picked.splice(qi, 1);
    setSecs(next); setFixedPerms(null); setRebuildOf(null); setReady(null);
  };

  const flat = secs?.flatMap((s) => s.picked) || [];
  const passedCount = flat.filter((q) => R.reviewStatus(reviews[q.id]) === 'passed').length;
  const banned = R.hasBannedWording(title);
  const primaryUrl = mockSlug ? R.mockTestUrl(mockSlug, flat.length || count, campaign) : hubSlug ? R.hubUrl(hubSlug, flat.length || count) : '';
  const guideUrl = mockSlug && hubSlug ? R.hubUrl(hubSlug, flat.length || count) : null;
  const blockReason = !hub ? 'Choose a hub page (or "No hub page") first.' : !primaryUrl ? 'This test has no live mock test page; choose a hub page.' : '';

  const generate = async () => {
    if (!secs || !flat.length || blockReason) return;
    if (banned) { toast.error('Remove "official" / "past paper" from the title.'); return; }
    setBusy(true); setReady(null);
    try {
      const perms = fixedPerms || R.balanceOptions(flat, seed);
      let n = 0;
      const pdfSections = secs.filter((s) => s.picked.length).map((s) => ({
        subject: s.subject,
        items: s.picked.map((q) => { const idx = flat.indexOf(q); const r = R.applyPerm(q, perms[idx]); n++; return { num: n, question: q.question, options: r.options, answer: r.answer, explanation: q.explanation ? S.remapExplanation(q.explanation, perms[idx]) : q.explanation, topic: S.displayTopic(q.topic), difficulty: q.difficulty }; }),
      }));
      const N = flat.length;
      const subjects = pdfSections.map((s) => s.subject).join(' & ');
      const site = { nthp: ' at nthp.iba.edu.pk', sthp: ' at iba-suk.edu.pk', sts: ' at sts.net.pk' }[kind as string] || '';
      const hasExp = flat.some((q) => String(q.explanation || '').trim());
      const { renderPracticePdf } = await import('@/lib/pdfBuilder/render');
      const bytes = await renderPracticePdf({
        title,
        subtitle: [R.programLine(kind), subjects, 'with answer key'].filter(Boolean).join(' · '),
        readFirst: [
          `${N} original MCQs by MCQsAI on the topics in the published ${examLabel} syllabus (${subjects}).`,
          `This is an unofficial practice set and does not predict the real test. The real pattern may differ: check the announcement${site}.`,
          `Suggested time: ${R.suggestedMinutes(N)} minutes. Answers are in the Answer Key${hasExp ? '; short explanations are on the last pages' : ''}.`,
        ],
        disclaimer: R.disclaimerFor(kind),
        sections: pdfSections,
        hubUrl: mockSlug ? R.mockTestUrl(mockSlug, N, campaign) : R.hubUrl(hubSlug, N),
        guideUrl: mockSlug && hubSlug ? R.hubUrl(hubSlug, N) : null,
        channelUrl: channel || R.CHANNEL_FALLBACK,
        shareUrl: R.shareLanding(mockSlug ? `${R.SITE}/mock-tests/${mockSlug}` : `${R.SITE}/exams/${hubSlug}`, examLabel),
      });
      const name = R.fileName(examLabel, N, setNo);
      if (!rebuildOf) {
        const { error } = await db.from('pdf_practice_sets').insert({
          definition_id: defId, title, set_number: setNo, hub_slug: hubSlug || 'none', question_count: N,
          section_split: secs.map((s) => ({ subject: s.subject, count: s.picked.length })), seed,
          question_ids: flat.map((q) => q.id), options_order: perms, require_explanation: needExp,
          gate_passed_only: gateOnly, gate_passed_count: passedCount, file_name: name, created_by: user?.id,
        });
        if (error) toast.error('PDF made, but the set record was not saved', { description: error.message });
        else loadHistory(defId);
      }
      setReady({ bytes, name });
      toast.success('PDF ready — tap Download.');
    } catch (e: any) { toast.error('Could not make the PDF', { description: e.message }); }
    setBusy(false);
  };

  if (!user || !isAdmin) return <Header><div className="p-6 text-sm text-muted-foreground">Admins only.</div></Header>;

  const sel = 'w-full h-10 rounded-md border border-input bg-background px-3 text-sm';
  return (
    <Header>
      <div className="max-w-3xl mx-auto p-3 space-y-3">
        <Link to="/admin" className="text-sm text-primary inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" />Admin</Link>
        <h1 className="text-xl font-semibold text-foreground">PDF Builder</h1>
        <p className="text-xs text-muted-foreground">Branded practice-set PDFs from approved questions. Questions are read only, never changed.</p>

        <Card><CardHeader className="p-3"><CardTitle className="text-base">1. Test</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <Input placeholder="Search tests…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className={sel} value={defId} onChange={(e) => pickTest(e.target.value)}>
              <option value="">Choose a test… ({shownDefs.length})</option>
              <optgroup label="Published">
                {shownDefs.filter((x) => x.d.status === 'published').map((x) => <option key={x.d.id} value={x.d.id}>{x.label}</option>)}
              </optgroup>
              <optgroup label="Drafts — no live page yet">
                {shownDefs.filter((x) => x.d.status !== 'published').map((x) => <option key={x.d.id} value={x.d.id}>{x.label}</option>)}
              </optgroup>
            </select>
            {def && def.status !== 'published' && <p className="text-xs text-destructive">This test is a draft. Its mock test page may not be live, so PDF links could not work yet.</p>}
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          </CardContent>
        </Card>

        {defId && !loading && (
          <Card><CardHeader className="p-3"><CardTitle className="text-base">2. Questions and split</CardTitle></CardHeader>
            <CardContent className="p-3 pt-0 space-y-3">
              <label className="flex items-center justify-between text-sm">Gate-passed only<Switch checked={gateOnly} onCheckedChange={(v) => { setGateOnly(v); setSecs(null); }} /></label>
              {gateOnly && aiReviewed === 0 && <p className="text-xs text-destructive">The Quality Gate has not checked any question of this test yet, so no question is Gate-passed.</p>}
              <label className="flex items-center justify-between text-sm">Only questions with an explanation<Switch checked={needExp} onCheckedChange={(v) => { setNeedExp(v); setSecs(null); }} /></label>
              <label className="block text-sm">Total questions
                <Input type="number" min={4} max={200} value={count} onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 0))} />
              </label>
              <div className="space-y-2">
                {split.map((s, i) => {
                  const have = pools[s.subject]?.length || 0;
                  return (
                    <div key={s.subject} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 truncate">{s.subject}</span>
                      <Input className="w-20" type="number" min={0} value={s.count} onChange={(e) => setSplit(split.map((x, j) => (j === i ? { ...x, count: Math.max(0, Number(e.target.value) || 0) } : x)))} />
                      <Badge variant={have < s.count ? 'destructive' : 'secondary'}>{have} eligible</Badge>
                    </div>
                  );
                })}
                {split.some((s) => (pools[s.subject]?.length || 0) < s.count) && <p className="text-xs text-destructive">A section is short. It will not be filled with unchecked questions.</p>}
                {Object.keys(excluded).length > 0 && (
                  <div className="rounded-md border p-2 text-xs space-y-1">
                    <p className="font-medium text-foreground">Excluded automatically: {Object.values(excluded).reduce((a, b) => a + b, 0)}</p>
                    <div className="flex flex-wrap gap-1">{Object.entries(excluded).sort((a, b) => b[1] - a[1]).map(([r, n]) => <Badge key={r} variant="outline">{reasonLabel(r)} {n}</Badge>)}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {defId && !loading && (
          <Card><CardHeader className="p-3"><CardTitle className="text-base">3. Title and links</CardTitle></CardHeader>
            <CardContent className="p-3 pt-0 space-y-3">
              <label className="block text-sm">Title<Input value={title} onChange={(e) => { setTitle(e.target.value); setTitleEdited(true); }} /></label>
              {banned && <p className="text-xs text-destructive">Don't use "official" or "past paper".</p>}
              <label className="block text-sm">Set number<Input type="number" min={1} value={setNo} onChange={(e) => setSetNo(Math.max(1, Number(e.target.value) || 1))} /></label>
              <label className="block text-sm">Hub page (QR and links)
                <select className={sel} value={hub} onChange={(e) => setHub(e.target.value)}>
                  <option value="">Choose…</option>
                  <option value={R.NO_HUB}>No hub page — use mock test link</option>
                  {slugs.map((s) => <option key={s} value={s}>/exams/{s}</option>)}
                </select>
              </label>
              <p className="text-xs text-muted-foreground break-all">QR and link 1: {primaryUrl || '—'}</p>
              {guideUrl && <p className="text-xs text-muted-foreground break-all">Second link: {guideUrl}</p>}
              <p className="text-xs text-muted-foreground">File: {R.fileName(examLabel, flat.length || count, setNo)}</p>
              {blockReason && <p className="text-xs text-destructive">{blockReason}</p>}
              <p className="text-xs text-muted-foreground">Disclaimer: {R.disclaimerFor(kind)}</p>
              <Button onClick={() => build(R.newSeed())} className="w-full"><Shuffle className="w-4 h-4 mr-2" />Build preview list</Button>
            </CardContent>
          </Card>
        )}

        {secs && (
          <Card><CardHeader className="p-3"><CardTitle className="text-base">4. Preview ({flat.length} questions)</CardTitle></CardHeader>
            <CardContent className="p-3 pt-0 space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge>Gate-passed {passedCount} / {flat.length}</Badge>
                <Badge variant="secondary">Only admin-approved {flat.length - passedCount}</Badge>
                <Badge variant="outline">Seed {seed}</Badge>
              </div>
              {secs.map((s, si) => (
                <div key={s.subject} className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">{s.subject} · {s.picked.length}{s.short ? ` (short by ${s.short})` : ''}</h3>
                  <ol className="space-y-1">
                    {s.picked.map((q, qi) => (
                      <li key={q.id} className="flex gap-2 items-start rounded border p-2 text-xs">
                        <span className="flex-1">{q.question}{R.reviewStatus(reviews[q.id]) === 'passed' && <Badge variant="outline" className="ml-1">Gate</Badge>}</span>
                        <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Swap" onClick={() => edit(si, qi, true)}><RefreshCw className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Remove" onClick={() => edit(si, qi, false)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
              <Button className="w-full" onClick={generate} disabled={busy || banned || !flat.length || !!blockReason}>{busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}Generate PDF</Button>
              {ready && <Button variant="outline" className="w-full" onClick={() => deliver(ready.bytes, ready.name)}><FileDown className="w-4 h-4 mr-2" />Download {ready.name}</Button>}
            </CardContent>
          </Card>
        )}

        {defId && history.length > 0 && (
          <Card><CardHeader className="p-3"><CardTitle className="text-base">Saved sets</CardTitle></CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-center gap-2 text-xs border rounded p-2">
                  <span className="flex-1">{h.file_name}<br /><span className="text-muted-foreground">{new Date(h.created_at).toLocaleString()} · Gate-passed {h.gate_passed_count}/{h.question_count}</span></span>
                  <Button size="sm" variant="outline" onClick={() => rebuild(h)}>Rebuild</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </Header>
  );
};

export default PdfBuilder;
