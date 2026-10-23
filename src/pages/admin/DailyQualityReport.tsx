import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/contexts/UserRoleContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isNthpTest, isStsTest } from "@/lib/programStatus";
import { dailyVerdict, isStalled, isPaidCall, pktDayStart } from "@/lib/qualityReportVerdict";

// Read-only admin report. Reads existing tables only; makes no AI calls.
const VERDICTS = ["pending", "pass", "needs_review", "fail"] as const;
const BACKGROUND = /auto_fill|quality_gate|admin_bulk|verify/i;
const db = supabase as any;

async function pageAll(build: (f: number, t: number) => any) {
  const out: any[] = [];
  for (let f = 0; ; f += 1000) {
    const { data, error } = await build(f, f + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) return out;
  }
}

const pkt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-PK", { timeZone: "Asia/Karachi", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "not logged";

type Win = { today: number; yesterday: number; last24: number };
type Report = {
  lastReview: string | null;
  reviews: Win; aiReviews: Win;
  verdicts: Record<string, number>;
  groups: { label: string; total: number; pass: number; needs_review: number; pending: number; fail: number }[];
  reasons: [string, number][]; newFails: number;
  sources: [string, number][]; free: number; paid: number; paidBackground: number; rateLimited: Win; aiLogged: number;
  pdf: Win;
};

const DailyQualityReport = () => {
  const { isAdmin } = useUserRole();
  const [r, setR] = useState<Report | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const now = Date.now();
      const tStart = pktDayStart(now), yStart = pktDayStart(now, 1), d24 = now - 86400000;
      const since = new Date(Math.min(yStart, d24)).toISOString();
      const win = (rows: any[], key: string, pred: (x: any) => boolean = () => true): Win => {
        const w = { today: 0, yesterday: 0, last24: 0 };
        for (const x of rows) {
          if (!pred(x)) continue;
          const t = Date.parse(x[key]);
          if (t >= tStart) w.today++; else if (t >= yStart) w.yesterday++;
          if (t >= d24) w.last24++;
        }
        return w;
      };

      const [last, recent, verdictCounts, defs, tests, logs, pdfs] = await Promise.all([
        db.from("question_quality_reviews").select("checked_at").not("checked_at", "is", null).order("checked_at", { ascending: false }).limit(1),
        pageAll((f, t) => db.from("question_quality_reviews").select("checked_at, created_at, ai_verdict, reasons, ai_answers").gte("checked_at", since).range(f, t)),
        Promise.all(VERDICTS.map((v) => db.from("question_quality_reviews").select("*", { count: "exact", head: true }).eq("ai_verdict", v))),
        pageAll((f, t) => db.from("job_test_definitions").select("id, job_title, department").range(f, t)),
        db.from("job_tests").select("title, organization"),
        pageAll((f, t) => db.from("ai_usage_logs").select("source_type, metadata, created_at").gte("created_at", since).range(f, t)),
        db.from("pdf_practice_sets").select("created_at").gte("created_at", since),
      ]);

      const verdicts: Record<string, number> = {};
      VERDICTS.forEach((v, i) => (verdicts[v] = verdictCounts[i].count ?? 0));

      // Priority groups: definitions matched to a test by title, then STS / NTHP / STHP rules.
      const orgByTitle = new Map<string, string>((tests.data || []).map((t: any) => [String(t.title).trim().toLowerCase(), t.organization]));
      const groupOf = (d: any) => {
        const org = orgByTitle.get(String(d.job_title || "").trim().toLowerCase()) ?? d.department ?? "";
        if (/talent hunt program \(sthp\)|\bsthp\b/i.test(d.job_title)) return "STHP";
        if (isNthpTest(org, d.job_title)) return "NTHP";
        if (isStsTest(org, d.job_title)) return "STS / Sukkur IBA";
        return null;
      };
      const defGroup = new Map<string, string>();
      for (const d of defs) { const g = groupOf(d); if (g) defGroup.set(d.id, g); }
      const ids = [...defGroup.keys()];
      const prRows: any[] = [];
      for (let i = 0; i < ids.length; i += 50) {
        const chunk = ids.slice(i, i + 50);
        prRows.push(...(await pageAll((f, t) => db.from("question_quality_reviews").select("definition_id, ai_verdict").in("definition_id", chunk).range(f, t))));
      }
      const gmap = new Map<string, any>();
      for (const label of ["STS / Sukkur IBA", "NTHP", "STHP"]) gmap.set(label, { label, total: 0, pass: 0, needs_review: 0, pending: 0, fail: 0 });
      for (const row of prRows) {
        const g = gmap.get(defGroup.get(row.definition_id)!); if (!g) continue;
        g.total++; if (row.ai_verdict in g) g[row.ai_verdict]++;
      }

      const day = recent.filter((x: any) => Date.parse(x.checked_at) >= d24);
      const reasonMap = new Map<string, number>();
      let newFails = 0;
      for (const x of day) {
        if (x.ai_verdict === "fail") newFails++;
        if (!["needs_review", "fail"].includes(x.ai_verdict)) continue;
        for (const reason of Array.isArray(x.reasons) ? x.reasons : []) {
          const k = String(typeof reason === "string" ? reason : reason?.code ?? reason?.rule ?? JSON.stringify(reason)).split(":")[0];
          reasonMap.set(k, (reasonMap.get(k) || 0) + 1);
        }
      }

      const logs24 = logs.filter((l: any) => Date.parse(l.created_at) >= d24);
      const srcMap = new Map<string, number>();
      let free = 0, paid = 0, paidBackground = 0, aiLogged = 0;
      for (const l of logs24) {
        srcMap.set(l.source_type || "unknown", (srcMap.get(l.source_type || "unknown") || 0) + 1);
        if (!l.metadata?.ai_attempt) continue;
        aiLogged++;
        if (isPaidCall(l.metadata)) { paid++; if (BACKGROUND.test(`${l.source_type} ${l.metadata?.group || ""}`)) paidBackground++; }
        else if (l.metadata?.provider === "gemini") free++;
      }
      const is429 = (l: any) => l.metadata?.status === 429 || /free_only_exhausted/i.test(String(l.metadata?.outcome || ""));

      setR({
        lastReview: last.data?.[0]?.checked_at ?? null,
        reviews: win(recent, "checked_at"),
        aiReviews: win(recent, "checked_at", (x) => !!x.ai_answers),
        verdicts,
        groups: [...gmap.values()],
        reasons: [...reasonMap.entries()].sort((a, b) => b[1] - a[1]),
        newFails,
        sources: [...srcMap.entries()].sort((a, b) => b[1] - a[1]),
        free, paid, paidBackground, aiLogged,
        rateLimited: win(logs, "created_at", is429),
        pdf: win(pdfs.data || [], "created_at"),
      });
    } catch (e: any) {
      setErr(e?.message || "Could not load report");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!isAdmin) return <Header><p className="p-4 text-sm text-muted-foreground">Admins only.</p></Header>;

  const W = ({ w }: { w: Win }) => (
    <span className="text-muted-foreground">Today {w.today} · Yesterday {w.yesterday} · 24h <b className="text-foreground">{w.last24}</b></span>
  );
  const stalled = r ? isStalled(r.lastReview) : false;
  const verdict = r ? dailyVerdict({ paidBackground: r.paidBackground, lastReviewIso: r.lastReview, rateLimited: r.rateLimited.last24, newFails: r.newFails }) : "";

  return (
    <Header>
      <div className="max-w-3xl mx-auto p-3 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <Button asChild variant="ghost" size="sm"><Link to="/admin"><ArrowLeft className="h-4 w-4 mr-1" />Admin</Link></Button>
          <h1 className="text-base font-semibold text-foreground">Daily Quality Report</h1>
          <Button size="sm" variant="outline" onClick={load} disabled={loading} aria-label="Refresh report">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {err && <p className="text-destructive">{err}</p>}
        {!r && !err && <p className="text-muted-foreground">Loading…</p>}
        {r && (
          <>
            <Card className={verdict === "All OK" ? "" : "border-destructive"}>
              <CardContent className="p-3 font-semibold">
                <span className={verdict === "All OK" ? "text-primary" : "text-destructive"}>{verdict}</span>
              </CardContent>
            </Card>

            <Card><CardHeader className="p-3 pb-1"><CardTitle className="text-sm flex items-center gap-2">1. Quality Gate {stalled && <Badge variant="destructive">Stalled</Badge>}</CardTitle></CardHeader>
              <CardContent className="p-3 pt-1 space-y-1">
                <p>Last saved review: <b>{pkt(r.lastReview)}</b> PKT</p>
                <p>Reviews saved: <W w={r.reviews} /></p>
                <p>AI-reviewed: <W w={r.aiReviews} /></p>
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {VERDICTS.map((v) => <div key={v} className="rounded-md border border-border p-1.5 text-center"><div className="text-xs text-muted-foreground">{v}</div><b>{r.verdicts[v]}</b></div>)}
                </div>
              </CardContent></Card>

            <Card><CardHeader className="p-3 pb-1"><CardTitle className="text-sm">2. Priority tests</CardTitle></CardHeader>
              <CardContent className="p-3 pt-1 space-y-1">
                {r.groups.map((g) => (
                  <div key={g.label} className="rounded-md border border-border p-2">
                    <b>{g.label}</b>
                    <p className="text-muted-foreground">{g.total} questions · {g.pass} AI-passed · {g.needs_review} needs_review · {g.pending} pending{g.fail ? ` · ${g.fail} fail` : ""}</p>
                  </div>
                ))}
              </CardContent></Card>

            <Card><CardHeader className="p-3 pb-1"><CardTitle className="text-sm">3. New problem questions (24h)</CardTitle></CardHeader>
              <CardContent className="p-3 pt-1">
                {r.reasons.length ? r.reasons.map(([k, n]) => <p key={k} className="flex justify-between"><span>{k}</span><b>{n}</b></p>) : <p className="text-muted-foreground">None in the last 24h</p>}
              </CardContent></Card>

            <Card><CardHeader className="p-3 pb-1"><CardTitle className="text-sm">4. AI quota (24h)</CardTitle></CardHeader>
              <CardContent className="p-3 pt-1 space-y-1">
                {r.sources.length ? r.sources.map(([k, n]) => <p key={k} className="flex justify-between"><span>{k}</span><b>{n}</b></p>) : <p className="text-muted-foreground">not logged</p>}
                <p className="pt-1">AI calls logged: {r.aiLogged} · free {r.free} · paid {r.paid}</p>
                {r.paidBackground > 0 && <p className="text-destructive font-semibold">Warning: background jobs used paid AI {r.paidBackground}×</p>}
                <p>429 / FREE_ONLY_EXHAUSTED: <W w={r.rateLimited} /></p>
              </CardContent></Card>

            <Card><CardHeader className="p-3 pb-1"><CardTitle className="text-sm">5. PDF Builder sets</CardTitle></CardHeader>
              <CardContent className="p-3 pt-1"><W w={r.pdf} /></CardContent></Card>
          </>
        )}
      </div>
    </Header>
  );
};

export default DailyQualityReport;
