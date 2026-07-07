import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2, Sparkles, Eye, CheckCircle, Activity,
  AlertTriangle, CircleSlash, TrendingUp, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface HealthRow {
  topic_id: string;
  path: string;
  topic_name: string;
  subject_name: string;
  board_name: string;
  class_number: string;
  approved_count: number;
  status: "filled" | "thin" | "empty";
  view_count: number;
  last_content_at: string | null;
}

interface ProgressRow {
  filled_this_week: number;
  filled_this_month: number;
  week_start: string;
  week_count: number;
}

const FILL_COUNT = 20;

const statusMeta = {
  filled: { label: "Filled", className: "bg-primary/15 text-primary border-primary/30", barClass: "bg-primary" },
  thin: { label: "Thin", className: "bg-amber-500/15 text-amber-500 border-amber-500/30", barClass: "bg-amber-500" },
  empty: { label: "Empty", className: "bg-destructive/15 text-destructive border-destructive/30", barClass: "bg-destructive" },
} as const;

const ContentHealthDashboard = () => {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  const [search, setSearch] = useState("");

  const { data: rows, isLoading } = useQuery({
    queryKey: ["content-health"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_content_health" as any);
      if (error) throw error;
      return (data ?? []) as unknown as HealthRow[];
    },
  });

  const { data: progress } = useQuery({
    queryKey: ["content-fill-progress"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_content_fill_progress" as any);
      if (error) throw error;
      return (data ?? []) as unknown as ProgressRow[];
    },
  });

  const summary = useMemo(() => {
    const total = rows?.length ?? 0;
    const filled = rows?.filter((r) => r.status === "filled").length ?? 0;
    const thin = rows?.filter((r) => r.status === "thin").length ?? 0;
    const empty = rows?.filter((r) => r.status === "empty").length ?? 0;
    return { total, filled, thin, empty };
  }, [rows]);

  // Priority worklist: only thin/empty, already sorted by views (RPC), keep order
  const worklist = useMemo(() => {
    const list = (rows ?? []).filter((r) => r.status !== "filled");
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (r) =>
        r.topic_name.toLowerCase().includes(q) ||
        r.subject_name.toLowerCase().includes(q) ||
        r.board_name.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const weeklyProgress = progress ?? [];
  const filledThisWeek = weeklyProgress[0]?.filled_this_week ?? 0;
  const filledThisMonth = weeklyProgress[0]?.filled_this_month ?? 0;
  const sparkMax = Math.max(1, ...weeklyProgress.map((w) => w.week_count));

  const fillTopic = async (row: HealthRow): Promise<boolean> => {
    setGenerating((prev) => new Set(prev).add(row.topic_id));
    try {
      const response = await supabase.functions.invoke("generate-test", {
        body: {
          mode: "bank_only",
          topic_id: row.topic_id,
          topic: `${row.topic_name} (${row.subject_name})`,
          topic_name: row.topic_name,
          subject: row.subject_name,
          subject_name: row.subject_name,
          count: FILL_COUNT,
          question_count: FILL_COUNT,
          difficulty: "mixed",
          source: "content_health",
          forceNew: true,
        },
      });
      if (response.error) throw new Error(response.error.message);
      const result = response.data;
      const approved = result?.questions_approved ?? result?.savedCount ?? result?.saved ?? result?.questions_saved ?? 0;
      const failed = result?.questions_failed ?? 0;
      const flagged = result?.duplicates_flagged ?? 0;
      setCompleted((prev) => new Set(prev).add(row.topic_id));
      if (approved > 0) {
        toast.success(`Generated ${approved} MCQs for "${row.topic_name}"`, {
          description: `${row.subject_name} · ${row.board_name}`,
        });
      } else {
        toast.warning(`No new MCQs saved for "${row.topic_name}"`, {
          description: failed > 0
            ? `${failed} failed to save — check function logs.`
            : `${flagged} flagged as duplicates. Nothing new to add.`,
        });
      }
      return true;
    } catch (err: any) {
      toast.error(`Failed to fill "${row.topic_name}"`, {
        description: err?.message || "Check AI quota and try again.",
      });
      return false;
    } finally {
      setGenerating((prev) => {
        const next = new Set(prev);
        next.delete(row.topic_id);
        return next;
      });
    }
  };

  const fillTopN = async (n: number) => {
    setBulkRunning(true);
    const targets = worklist.slice(0, n);
    let ok = 0;
    for (const row of targets) {
      if (completed.has(row.topic_id)) continue;
      const success = await fillTopic(row);
      if (success) ok++;
    }
    setBulkRunning(false);
    toast.success(`Bulk fill complete — ${ok}/${targets.length} topics filled`);
    queryClient.invalidateQueries({ queryKey: ["content-health"] });
    queryClient.invalidateQueries({ queryKey: ["content-fill-progress"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading content health…
      </div>
    );
  }

  const pct = (n: number) => (summary.total ? (n / summary.total) * 100 : 0);

  return (
    <div className="space-y-4">
      {/* Summary band */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            Content Health — Indexable Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="text-2xl font-bold">{summary.total}</div>
              <div className="text-xs text-muted-foreground">Total topics</div>
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="text-2xl font-bold text-primary">{summary.filled}</div>
              <div className="text-xs text-muted-foreground">Filled (≥5)</div>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <div className="text-2xl font-bold text-amber-500">{summary.thin}</div>
              <div className="text-xs text-muted-foreground">Thin (1–4)</div>
            </div>
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <div className="text-2xl font-bold text-destructive">{summary.empty}</div>
              <div className="text-xs text-muted-foreground">Empty (0)</div>
            </div>
          </div>
          {/* Stacked bar */}
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted flex">
            <div className={statusMeta.filled.barClass} style={{ width: `${pct(summary.filled)}%` }} />
            <div className={statusMeta.thin.barClass} style={{ width: `${pct(summary.thin)}%` }} />
            <div className={statusMeta.empty.barClass} style={{ width: `${pct(summary.empty)}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* Progress tracker */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Fill Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-6">
          <div>
            <div className="text-2xl font-bold text-primary">{filledThisWeek}</div>
            <div className="text-xs text-muted-foreground">MCQs added this week</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{filledThisMonth}</div>
            <div className="text-xs text-muted-foreground">MCQs added this month</div>
          </div>
          {/* Sparkline */}
          <div className="flex items-end gap-1 h-12 ml-auto" title="Weekly MCQs added (12 weeks)">
            {weeklyProgress.map((w) => (
              <div
                key={w.week_start}
                className="w-2 rounded-sm bg-primary/60 hover:bg-primary transition-colors"
                style={{ height: `${Math.max(4, (w.week_count / sparkMax) * 48)}px` }}
                title={`${format(new Date(w.week_start), "MMM d")}: ${w.week_count}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority worklist */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Priority Worklist
            <span className="text-xs font-normal text-muted-foreground">
              ({worklist.length} thin/empty · highest traffic first)
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search topics…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-40"
            />
            <Button size="sm" onClick={() => fillTopN(5)} disabled={bulkRunning || worklist.length === 0}>
              {bulkRunning ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
              Fill top 5
            </Button>
            <Button size="sm" variant="outline" onClick={() => fillTopN(10)} disabled={bulkRunning || worklist.length === 0}>
              Fill top 10
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Topic</th>
                  <th className="px-4 py-2 font-medium">Subject / Board</th>
                  <th className="px-4 py-2 font-medium text-center">Current Qs</th>
                  <th className="px-4 py-2 font-medium text-center">Status</th>
                  <th className="px-4 py-2 font-medium text-center">Views</th>
                  <th className="px-4 py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {worklist.slice(0, 200).map((row) => {
                  const meta = statusMeta[row.status];
                  const isGen = generating.has(row.topic_id);
                  const isDone = completed.has(row.topic_id);
                  return (
                    <tr key={row.topic_id} className="border-b border-border/40 hover:bg-muted/30">
                      <td className="px-4 py-2 font-medium">{row.topic_name}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {row.subject_name} · {row.board_name}
                      </td>
                      <td className="px-4 py-2 text-center">{row.approved_count}</td>
                      <td className="px-4 py-2 text-center">
                        <Badge variant="outline" className={meta.className}>
                          {row.status === "empty" ? <CircleSlash className="h-3 w-3 mr-1" /> : null}
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          {row.view_count}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button
                          size="sm"
                          variant={isDone ? "outline" : "default"}
                          disabled={isGen || isDone || bulkRunning}
                          onClick={() => fillTopic(row)}
                        >
                          {isGen ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Filling…</>
                          ) : isDone ? (
                            <><CheckCircle className="h-4 w-4 mr-1" /> Done</>
                          ) : (
                            <><Sparkles className="h-4 w-4 mr-1" /> AI-fill</>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {worklist.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      🎉 No thin or empty indexable topics — all filled!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentHealthDashboard;
