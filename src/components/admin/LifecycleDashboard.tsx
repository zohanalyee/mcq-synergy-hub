import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Database, Users, Sparkles, Flame, Snowflake, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Stats = {
  content_items: { total: number; unused: number; low: number; medium: number; heavy: number; stale: number; groups: number };
  job_test_questions: { total: number; unused: number; low: number; medium: number; heavy: number; stale: number; groups: number };
  mastery: { total_records: number; users_tracked: number; learning: number; review: number; mastered: number };
  topups: { total: number; success: number; today: number; last_7d: number; last_30d: number; unique_users: number };
};

type TopupRow = {
  id: string;
  user_id: string | null;
  username: string;
  job_test_id: string | null;
  subject: string | null;
  questions_generated: number;
  success: boolean;
  reason: string | null;
  created_at: string;
};

type HotStale = {
  hot: Array<{ id: string; title: string; subject: string; topic: string; usage_count: number; last_used_at: string | null }>;
  unused: Array<{ id: string; title: string; subject: string; topic: string; usage_count: number; last_used_at: string | null }>;
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  tone = "violet",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "violet" | "cyan" | "emerald" | "amber" | "rose";
}) => {
  const toneMap: Record<string, string> = {
    violet: "from-violet-500/10 to-transparent border-violet-500/20 text-violet-400",
    cyan: "from-cyan-500/10 to-transparent border-cyan-500/20 text-cyan-400",
    emerald: "from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-400",
    amber: "from-amber-500/10 to-transparent border-amber-500/20 text-amber-400",
    rose: "from-rose-500/10 to-transparent border-rose-500/20 text-rose-400",
  };
  return (
    <Card className={`bg-gradient-to-br ${toneMap[tone]}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs">{label}</CardDescription>
          <Icon className="h-4 w-4 opacity-70" />
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">{value}</CardTitle>
      </CardHeader>
      {hint && <CardContent className="pt-0 text-xs text-muted-foreground">{hint}</CardContent>}
    </Card>
  );
};

const Bar = ({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{value.toLocaleString()} <span className="text-muted-foreground">({pct}%)</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const LifecycleDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [topups, setTopups] = useState<TopupRow[]>([]);
  const [hotStale, setHotStale] = useState<HotStale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [s, t, h] = await Promise.all([
        supabase.rpc("get_lifecycle_circulation_stats" as any),
        supabase.rpc("get_lifecycle_topup_log" as any, { p_limit: 50 }),
        supabase.rpc("get_lifecycle_hot_and_stale" as any, { p_limit: 10 }),
      ]);
      if (s.data) setStats(s.data as Stats);
      if (t.data) setTopups(t.data as TopupRow[]);
      if (h.data) setHotStale(h.data as HotStale);
      setLoading(false);
    };
    load();
  }, []);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const ciTotal = stats.content_items.total || 1;
  const jqTotal = stats.job_test_questions.total || 1;
  const masteryTotal = stats.mastery.total_records || 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-violet-400" />
          Question Lifecycle & Circulation
        </h2>
        <p className="text-sm text-muted-foreground">
          Observational dashboard — usage distribution, mastery, and AI top-up activity across the question banks.
        </p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Database} label="Approved MCQs (bank)" value={stats.content_items.total.toLocaleString()} hint={`${stats.content_items.groups.toLocaleString()} concept groups`} tone="cyan" />
        <StatCard icon={Database} label="Approved Mock Qs" value={stats.job_test_questions.total.toLocaleString()} hint={`${stats.job_test_questions.groups.toLocaleString()} concept groups`} tone="violet" />
        <StatCard icon={Users} label="Users w/ Mastery" value={stats.mastery.users_tracked.toLocaleString()} hint={`${stats.mastery.total_records.toLocaleString()} records`} tone="emerald" />
        <StatCard icon={Sparkles} label="AI Top-ups (30d)" value={stats.topups.last_30d.toLocaleString()} hint={`${stats.topups.today} today · ${stats.topups.unique_users} users total`} tone="amber" />
      </div>

      {/* Circulation Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-400" /> Content Bank Circulation
            </CardTitle>
            <CardDescription>How often approved MCQs have been served</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Bar label="Unused (0 uses)" value={stats.content_items.unused} total={ciTotal} tone="bg-slate-500" />
            <Bar label="Low (1–5)" value={stats.content_items.low} total={ciTotal} tone="bg-cyan-500" />
            <Bar label="Medium (6–20)" value={stats.content_items.medium} total={ciTotal} tone="bg-violet-500" />
            <Bar label="Heavy (20+)" value={stats.content_items.heavy} total={ciTotal} tone="bg-rose-500" />
            <div className="pt-2 flex items-center gap-2">
              <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                <Snowflake className="h-3 w-3 mr-1" /> {stats.content_items.stale.toLocaleString()} stale &gt;60d
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-violet-400" /> Mock Test Bank Circulation
            </CardTitle>
            <CardDescription>How often approved mock-test questions have been served</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Bar label="Unused (0 uses)" value={stats.job_test_questions.unused} total={jqTotal} tone="bg-slate-500" />
            <Bar label="Low (1–5)" value={stats.job_test_questions.low} total={jqTotal} tone="bg-cyan-500" />
            <Bar label="Medium (6–20)" value={stats.job_test_questions.medium} total={jqTotal} tone="bg-violet-500" />
            <Bar label="Heavy (20+)" value={stats.job_test_questions.heavy} total={jqTotal} tone="bg-rose-500" />
            <div className="pt-2 flex items-center gap-2">
              <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                <Snowflake className="h-3 w-3 mr-1" /> {stats.job_test_questions.stale.toLocaleString()} stale &gt;60d
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mastery Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" /> User Mastery Distribution
          </CardTitle>
          <CardDescription>Across {stats.mastery.users_tracked.toLocaleString()} tracked users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          <Bar label="Learning (wrong recently)" value={stats.mastery.learning} total={masteryTotal} tone="bg-rose-500" />
          <Bar label="Review (in progress)" value={stats.mastery.review} total={masteryTotal} tone="bg-amber-500" />
          <Bar label="Mastered (3+ correct)" value={stats.mastery.mastered} total={masteryTotal} tone="bg-emerald-500" />
        </CardContent>
      </Card>

      {/* Hot & Unused */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-rose-400" /> Most-Used Questions
            </CardTitle>
            <CardDescription>Top over-served questions in the bank</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(hotStale?.hot ?? []).slice(0, 10).map((q) => (
                <div key={q.id} className="flex items-start justify-between gap-2 text-xs border-b border-border/40 pb-2 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-foreground">{q.title}</div>
                    <div className="text-muted-foreground">{q.subject} · {q.topic}</div>
                  </div>
                  <Badge variant="outline" className="border-rose-500/30 text-rose-400 shrink-0">{q.usage_count}×</Badge>
                </div>
              ))}
              {(hotStale?.hot?.length ?? 0) === 0 && <p className="text-xs text-muted-foreground">No usage recorded yet.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-cyan-400" /> Never Served
            </CardTitle>
            <CardDescription>Approved questions that have never been shown to any learner</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(hotStale?.unused ?? []).slice(0, 10).map((q) => (
                <div key={q.id} className="flex items-start justify-between gap-2 text-xs border-b border-border/40 pb-2 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-foreground">{q.title}</div>
                    <div className="text-muted-foreground">{q.subject} · {q.topic}</div>
                  </div>
                  <Badge variant="outline" className="border-slate-500/30 text-slate-400 shrink-0">0×</Badge>
                </div>
              ))}
              {(hotStale?.unused?.length ?? 0) === 0 && <p className="text-xs text-muted-foreground">Every approved question has been used at least once.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top-up Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" /> Recent AI Top-ups
          </CardTitle>
          <CardDescription>Per-user AI generation triggered on DB exhaustion (last 50)</CardDescription>
        </CardHeader>
        <CardContent>
          {topups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No top-up activity yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border/40">
                    <th className="py-2 pr-3">When</th>
                    <th className="py-2 pr-3">User</th>
                    <th className="py-2 pr-3">Subject</th>
                    <th className="py-2 pr-3">Qs</th>
                    <th className="py-2 pr-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topups.map((r) => (
                    <tr key={r.id} className="border-b border-border/20 last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      </td>
                      <td className="py-2 pr-3 truncate max-w-[180px]">{r.username}</td>
                      <td className="py-2 pr-3">{r.subject ?? "—"}</td>
                      <td className="py-2 pr-3 font-mono">{r.questions_generated}</td>
                      <td className="py-2 pr-3">
                        {r.success ? (
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">ok</Badge>
                        ) : (
                          <Badge variant="outline" className="border-rose-500/30 text-rose-400">{r.reason ?? "failed"}</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LifecycleDashboard;
