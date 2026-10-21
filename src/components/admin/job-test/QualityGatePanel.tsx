import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Download, ShieldCheck, ScanSearch } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { REASON_LABELS } from "@/lib/contentSafety";

/** v2 and v3 rows can coexist while the v3 re-check runs: keep only the newest per question. */
function newestPerQuestion<T extends { question_id: string; checker_version?: number }>(rows: T[]): T[] {
  const m = new Map<string, T>();
  rows.forEach((r) => { const p = m.get(r.question_id); if (!p || (r.checker_version ?? 0) > (p.checker_version ?? 0)) m.set(r.question_id, r); });
  return [...m.values()];
}
import { toast } from "sonner";

const db = supabase as any;
type Review = {
  question_id: string; definition_id: string; ai_verdict: string; reasons: string[]; deterministic_ok: boolean | null;
  ai_answers: string[] | null; ai_topic: string | null; ai_difficulty: string | null;
  signal_flags: string[]; owner_decision: string | null;
};
type Q = { id: string; job_test_id: string; question: string; options: any; correct_answer: string; difficulty: string | null };

const LETTERS = ["A", "B", "C", "D"];
const letterOf = (q: Q) => {
  const k = String(q.correct_answer ?? "").trim().toUpperCase();
  if (LETTERS.includes(k)) return k;
  const opts = Array.isArray(q.options) ? q.options : LETTERS.map((l) => q.options?.[l]);
  const i = opts.findIndex((o: any) => String(o ?? "").toLowerCase() === k.toLowerCase());
  return i >= 0 ? LETTERS[i] : "?";
};

const csv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return "";
  const h = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [h.join(","), ...rows.map((r) => h.map((k) => esc(r[k])).join(","))].join("\n");
};
const download = (name: string, text: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  a.download = name;
  a.click();
};

const QualityGatePanel = () => {
  const [mode, setMode] = useState("off");
  const [wave, setWave] = useState(0);
  const [run, setRun] = useState<any>(null);
  const [tests, setTests] = useState<{ definition_id: string; label: string }[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [sweep, setSweep] = useState<any>(null);
  const [sweeping, setSweeping] = useState(false);
  const [allRows, setAllRows] = useState<{ definition_id: string; ai_verdict: string; deterministic_ok: boolean | null; reasons: string[] }[]>([]);
  const [defNames, setDefNames] = useState<Record<string, string>>({});
  const [need, setNeed] = useState<Record<string, number>>({});
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [hide, setHide] = useState<{ enabled: boolean; owner_approved: boolean }>({ enabled: false, owner_approved: false });

  const load = useCallback(async () => {
    const [{ data: s }, { data: r }, { data: t }, { data: sw }, { data: defs }, { data: jts }] = await Promise.all([
      db.from("system_settings").select("key,value").in("key", ["quality_mode", "quality_wave", "quality_hide_needs_review"]),
      db.from("quality_job_runs").select("*").eq("id", "quality-gate").maybeSingle(),
      db.from("quality_wave_tests").select("definition_id,label,wave").order("label"),
      db.from("quality_job_runs").select("*").eq("id", "det-sweep").maybeSingle(),
      db.from("job_test_definitions").select("id, job_title"),
      db.from("job_tests").select("definition_id, questions"),
    ]);
    const m = Object.fromEntries((s ?? []).map((x: any) => [x.key, x.value]));
    setMode(String(m.quality_mode ?? "off"));
    setWave(Number(m.quality_wave ?? 0));
    if (m.quality_hide_needs_review) setHide(m.quality_hide_needs_review);
    setRun(r);
    setSweep(sw);
    setTests(t ?? []);
    setDefNames(Object.fromEntries((defs ?? []).map((d: any) => [d.id, String(d.job_title || "").trim()])));
    setNeed(Object.fromEntries((jts ?? []).filter((j: any) => j.definition_id).map((j: any) => [j.definition_id, Number(j.questions) || 0])));
    const rows: any[] = [];
    for (let from = 0; ; from += 1000) {
      const { data } = await db.from("question_quality_reviews").select("question_id,checker_version,definition_id,ai_verdict,deterministic_ok,reasons").in("checker_version", [2, 3]).order("id").range(from, from + 999);
      rows.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    setAllRows(newestPerQuestion(rows));
    const tot: Record<string, number> = {};
    for (let from = 0; ; from += 1000) {
      const { data } = await db.from("job_test_questions").select("job_test_id").order("id").range(from, from + 999);
      (data ?? []).forEach((x: any) => { tot[x.job_test_id] = (tot[x.job_test_id] || 0) + 1; });
      if (!data || data.length < 1000) break;
    }
    setTotals(tot);
    const ids = (t ?? []).map((x: any) => x.definition_id);
    if (!ids.length) return;
    const all: Review[] = [];
    for (let from = 0; ; from += 1000) {
      const { data } = await db.from("question_quality_reviews").select("question_id,definition_id,ai_verdict,deterministic_ok,reasons,ai_answers,ai_topic,ai_difficulty,signal_flags,owner_decision,checker_version").in("definition_id", ids).in("checker_version", [2, 3]).order("id").range(from, from + 999);
      all.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    setReviews(newestPerQuestion(all));
    const qs: Q[] = [];
    for (let from = 0; ; from += 1000) {
      const { data } = await db.from("job_test_questions").select("id,job_test_id,question,options,correct_answer,difficulty").in("job_test_id", ids).range(from, from + 999);
      qs.push(...(data ?? []));
      if (!data || data.length < 1000) break;
    }
    setQuestions(qs);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveSetting = async (key: string, value: unknown) => {
    const { error } = await db.from("system_settings").update({ value }).eq("key", key);
    if (error) toast.error(error.message); else { toast.success("Saved"); load(); }
  };

  const runNow = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("quality-gate", { body: {} });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success(data?.skipped ? `Skipped: ${data.reason}` : `Checked ${data?.reviewed ?? 0} questions (${data?.ai_calls ?? 0} AI calls)`);
    load();
  };

  const runSweep = async (restart = false) => {
    setSweeping(true);
    let first = restart;
    try {
      for (let i = 0; i < 200; i++) {
        const { data, error } = await supabase.functions.invoke("quality-gate", { body: { action: "sweep", restart: first } });
        first = false;
        if (error || !data?.success) { toast.error(`Sweep stopped: ${error?.message ?? data?.error}`); break; }
        setSweep((p: any) => ({ ...(p ?? {}), cursor: { index: data.index, total: data.total, last_test: data.test } }));
        if (data.done) { toast.success("No-AI sweep finished"); break; }
      }
    } finally { setSweeping(false); load(); }
  };

  const decide = async (qid: string, decision: "ok" | "exclude") => {
    const { error } = await db.from("question_quality_reviews").update({ owner_decision: decision }).eq("question_id", qid);
    if (error) toast.error(error.message); else load();
  };

  const qById = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);

  const stats = useMemo(() => tests.map((t) => {
    const rs = reviews.filter((r) => r.definition_id === t.definition_id);
    const qs = questions.filter((q) => q.job_test_id === t.definition_id);
    const c = (v: string) => rs.filter((r) => r.ai_verdict === v).length;
    const letters: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    qs.forEach((q) => { const l = letterOf(q); if (l in letters) letters[l]++; });
    const topics: Record<string, number> = {};
    rs.forEach((r) => { if (r.ai_topic) topics[r.ai_topic] = (topics[r.ai_topic] || 0) + 1; });
    const diff: Record<string, number> = {};
    rs.forEach((r) => { if (r.ai_difficulty) diff[r.ai_difficulty] = (diff[r.ai_difficulty] || 0) + 1; });
    return { ...t, total: qs.length, pass: c("pass"), fail: c("fail"), review: c("needs_review"), pending: c("pending") + Math.max(0, qs.length - rs.length), letters, topics, diff };
  }), [tests, reviews, questions]);

  // Per-test report over the whole bank (checker v2, no AI).
  const report = useMemo(() => {
    const by: Record<string, { checked: number; review: number; reasons: Record<string, number> }> = {};
    allRows.forEach((r) => {
      const b = (by[r.definition_id] ||= { checked: 0, review: 0, reasons: {} });
      b.checked++;
      const blocked = r.deterministic_ok === false || r.ai_verdict === "needs_review" || r.ai_verdict === "fail";
      if (blocked) { b.review++; (r.reasons?.length ? r.reasons : ["ai_review"]).forEach((x) => { b.reasons[x] = (b.reasons[x] || 0) + 1; }); }
    });
    return Object.keys({ ...totals, ...by }).map((id) => ({ id, name: defNames[id] || id.slice(0, 8), total: totals[id] || 0, ...(by[id] || { checked: 0, review: 0, reasons: {} }), need: need[id] || 0 }))
      .sort((a, b) => b.review - a.review);
  }, [allRows, totals, defNames, need]);
  const leaseStale = run?.status === "running" && (!run?.lease_until || new Date(run.lease_until) < new Date());
  const lastOk = run?.last_success_at ? new Date(run.last_success_at) : null;
  const stalled = mode !== "off" && wave > 0 && (!lastOk || Date.now() - lastOk.getTime() > 6 * 3600_000);
  const shownStatus = leaseStale ? "stopped unexpectedly" : run?.status ?? "-";
  const ago = (d: Date | null) => (d ? `${Math.round((Date.now() - d.getTime()) / 60000)} min ago` : "never");

  const exportRow = (r: Review) => {
    const q = qById.get(r.question_id);
    const t = tests.find((x) => x.definition_id === r.definition_id);
    return { test: t?.label, verdict: r.ai_verdict, reasons: r.reasons.join("; "), key: q ? letterOf(q) : "", ai_answers: (r.ai_answers ?? []).join("/"), ai_topic: r.ai_topic, ai_difficulty: r.ai_difficulty, flags: r.signal_flags.join("; "), owner: r.owner_decision, question: q?.question, options: JSON.stringify(q?.options ?? "") };
  };

  const calibration = () => {
    const pick = (v: string, n: number) => reviews.filter((r) => r.ai_verdict === v).sort(() => Math.random() - 0.5).slice(0, n);
    const set = [...pick("pass", 20), ...pick("fail", 10), ...pick("needs_review", 10)];
    download("calibration-40.csv", csv(set.map(exportRow)));
  };

  return (
    <Card>
      <CardHeader className="p-3">
        <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Question Quality Gate</CardTitle>
        <p className="text-xs text-muted-foreground">Checks mock-test questions with free AI keys only. It never edits or deletes questions.</p>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <label className="space-y-1">Mode
            <select className="w-full rounded-md border bg-background p-2" value={mode} onChange={(e) => saveSetting("quality_mode", e.target.value)}>
              <option value="off">Off</option><option value="report">Report</option><option value="strict">Strict (needs approval)</option>
            </select>
          </label>
          <label className="space-y-1">Wave
            <select className="w-full rounded-md border bg-background p-2" value={wave} onChange={(e) => saveSetting("quality_wave", Number(e.target.value))}>
              {[0, 1, 2, 3].map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </label>
          <div className="space-y-1">AI calls today<div className="font-semibold text-sm">{run?.calls_today ?? 0} / 300</div></div>
          <div className="space-y-1">Status<div className="font-semibold text-sm">{stalled ? <Badge variant="destructive">Stalled</Badge> : shownStatus}</div></div>
        </div>
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Last AI review saved: {lastOk ? `${lastOk.toLocaleString()} (${ago(lastOk)})` : "never"}{stalled ? " — no review in 6+ hours" : ""}</p>
          <p>Last run: {run?.last_run_at ? new Date(run.last_run_at).toLocaleString() : "-"}{run?.last_summary ? ` · reviewed ${run.last_summary.reviewed ?? 0}, AI calls ${run.last_summary.ai_calls ?? 0}${run.last_summary.test ? `, ${run.last_summary.test}` : ""}` : ""}</p>
          {run?.pause_reason && <p className="text-destructive">Now: {run.pause_reason}</p>}
          {run?.last_error && <p className="text-destructive">Last error ({run.last_error_at ? new Date(run.last_error_at).toLocaleString() : "?"}): {run.last_error}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={runNow} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}Run now</Button>
          <Button size="sm" variant="outline" onClick={() => download("quality-report.csv", csv(reviews.map(exportRow)))}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
          <Button size="sm" variant="outline" onClick={calibration}><Download className="h-4 w-4 mr-1" />Calibration 40</Button>
          <Button size="sm" variant="outline" onClick={() => runSweep(false)} disabled={sweeping}>{sweeping ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ScanSearch className="h-4 w-4 mr-1" />}Run full no-AI sweep</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          No-AI sweep: {sweep?.cursor ? `${sweep.cursor.index} / ${sweep.cursor.total} tests${sweep.cursor.index >= sweep.cursor.total ? " — finished" : ""}${sweep.cursor.last_test ? ` (last: ${sweep.cursor.last_test})` : ""}` : "not run yet"}
          {sweep?.cursor?.index >= sweep?.cursor?.total && !sweeping && <button className="ml-2 underline" onClick={() => runSweep(true)}>Run again from start</button>}
          {sweep?.last_error && <span className="text-destructive"> · error: {sweep.last_error}</span>}
        </p>

        <div className="rounded-lg border p-2.5 text-xs space-y-1.5">
          <label className="flex items-center justify-between gap-2 font-medium text-sm">
            Hide needs_review questions from live mock tests
            <Switch checked={hide.enabled} disabled onCheckedChange={() => {}} aria-label="Hide needs_review questions from live mock tests" />
          </label>
          <p className="text-muted-foreground">Off and locked. Students see no change until you approve this separately. Below: how many questions per test it would hide.</p>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted"><tr><th className="p-1.5 text-left">Test</th><th className="p-1.5">Total</th><th className="p-1.5">Checked</th><th className="p-1.5">Needs review (would hide)</th><th className="p-1.5">Left / test size</th></tr></thead>
            <tbody>
              {report.map((r) => {
                const left = r.total - r.review;
                return (
                  <tr key={r.id} className="border-t align-top">
                    <td className="p-1.5">{r.name}<div className="text-muted-foreground">{Object.entries(r.reasons).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${REASON_LABELS[k] ?? k} ${v}`).join(" · ")}</div></td>
                    <td className="p-1.5 text-center">{r.total}</td>
                    <td className="p-1.5 text-center">{r.checked}</td>
                    <td className="p-1.5 text-center">{r.review}</td>
                    <td className={`p-1.5 text-center ${r.need && left < r.need * 1.5 ? "text-destructive font-semibold" : ""}`}>{left} / {r.need || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-2">
          {stats.map((s) => {
            const pool = s.total; const skew = pool >= 20 && Object.values(s.letters).some((n) => n / pool > 0.4 || n / pool < 0.1);
            return (
              <div key={s.definition_id} className="rounded-lg border p-2.5 text-xs space-y-1.5">
                <button className="w-full text-left font-medium text-sm" onClick={() => setOpen(open === s.definition_id ? null : s.definition_id)}>{s.label}</button>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">Pool {s.total}</Badge>
                  <Badge variant="secondary">Pass {s.pass}</Badge>
                  <Badge variant="destructive">Fail {s.fail}</Badge>
                  <Badge variant="outline">Review {s.review}</Badge>
                  <Badge variant="outline">Pending {s.pending}</Badge>
                  <Badge variant={skew ? "destructive" : "outline"}>{skew ? "Warning: letters " : "Letters "}{LETTERS.map((l) => `${l}${s.letters[l]}`).join(" ")}</Badge>
                </div>
                {open === s.definition_id && (
                  <div className="space-y-2 pt-1">
                    <p className="text-muted-foreground">Difficulty: {Object.entries(s.diff).map(([k, v]) => `${k} ${v}`).join(", ") || "-"}</p>
                    <p className="text-muted-foreground">Topics: {Object.entries(s.topics).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} (${v})`).join(", ") || "-"}</p>
                    {reviews.filter((r) => r.definition_id === s.definition_id && r.ai_verdict !== "pass").slice(0, 50).map((r) => (
                      <div key={r.question_id} className="rounded-md bg-muted p-2 space-y-1">
                        <p>{qById.get(r.question_id)?.question}</p>
                        <p className="text-muted-foreground">{r.ai_verdict} · {r.reasons.join(", ") || "AI disagreed"} · key {qById.get(r.question_id) ? letterOf(qById.get(r.question_id)!) : "?"} · AI {(r.ai_answers ?? []).join("/")}{r.owner_decision ? ` · you: ${r.owner_decision}` : ""}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-6" onClick={() => decide(r.question_id, "ok")}>Mark OK</Button>
                          <Button size="sm" variant="outline" className="h-6" onClick={() => decide(r.question_id, "exclude")}>Exclude</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QualityGatePanel;
