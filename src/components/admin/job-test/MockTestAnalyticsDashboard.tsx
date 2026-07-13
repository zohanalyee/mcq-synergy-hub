import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  X,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  TestCoverageSummary,
  SectionCoverage,
  JobTestQueueItem,
  getAllTestsCoverage,
  getActiveQueueCounts,
  getQueueForTest,
  enqueueGeneration,
  removeQueueItem,
  clearQueueForTest,
  findDefinitionForTest,
} from "@/services/jobTestService";

/** A processing row older than this (ms) is treated as stuck. */
const STUCK_MS = 10 * 60 * 1000;

/**
 * Global Mock-Test Analytics Dashboard.
 * Lists every mock test in one place with overall coverage, per-subject
 * deficits, pending-approval counts, and readiness — so the admin never has
 * to open each test to find the gaps. Generation can be queued from here
 * (background) without opening the test. Approval always stays manual.
 */
const MockTestAnalyticsDashboard: React.FC = () => {
  const [rows, setRows] = useState<TestCoverageSummary[]>([]);
  const [queueCounts, setQueueCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [queues, setQueues] = useState<Record<string, JobTestQueueItem[]>>({});
  const [queueLoading, setQueueLoading] = useState<Set<string>>(new Set());
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadQueue = async (jobTestId: string) => {
    setQueueLoading((prev) => new Set(prev).add(jobTestId));
    try {
      const items = await getQueueForTest(jobTestId);
      setQueues((prev) => ({ ...prev, [jobTestId]: items }));
    } finally {
      setQueueLoading((prev) => {
        const next = new Set(prev);
        next.delete(jobTestId);
        return next;
      });
    }
  };

  const handleRemoveQueueItem = async (jobTestId: string, itemId: string) => {
    setRemovingId(itemId);
    try {
      const ok = await removeQueueItem(itemId);
      if (ok) {
        toast.success("Removed from queue.");
        await Promise.all([loadQueue(jobTestId), refreshCounts()]);
      } else {
        toast.error("Failed to remove queue item.");
      }
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearQueue = async (jobTestId: string) => {
    setRemovingId("all-" + jobTestId);
    try {
      const ok = await clearQueueForTest(jobTestId);
      if (ok) {
        toast.success("Cleared all queued items.");
        await Promise.all([loadQueue(jobTestId), refreshCounts()]);
      } else {
        toast.error("Failed to clear queue.");
      }
    } finally {
      setRemovingId(null);
    }
  };

  const refreshCounts = async () => {
    const counts = await getActiveQueueCounts();
    setQueueCounts(counts);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [data, counts] = await Promise.all([
        getAllTestsCoverage(),
        getActiveQueueCounts(),
      ]);
      // Sort by largest deficit first (worklist feel).
      data.sort(
        (a, b) => (b.coverage?.totalDeficit ?? -1) - (a.coverage?.totalDeficit ?? -1),
      );
      setRows(data);
      setQueueCounts(counts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    let ready = 0;
    let incomplete = 0;
    let pending = 0;
    let deficit = 0;
    for (const r of rows) {
      if (!r.coverage) continue;
      if (r.coverage.ready) ready++;
      else incomplete++;
      pending += r.coverage.totalPending;
      deficit += r.coverage.totalDeficit;
    }
    return { ready, incomplete, pending, deficit };
  }, [rows]);

  const toggle = (id: string, queueKey: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        // Lazy-load queue rows when a test is expanded.
        if (queueKey) loadQueue(queueKey);
      }
      return next;
    });
  };

  const resolveDefinitionId = async (r: TestCoverageSummary): Promise<string | null> => {
    const def = await findDefinitionForTest({
      definition_id: (r.test as any).definition_id,
      title: r.test.title,
    });
    return def?.id ?? null;
  };

  const handleQueueAll = async (r: TestCoverageSummary) => {
    if (!r.coverage || r.coverage.totalDeficit === 0) {
      toast.info("Nothing to generate — targets already met.");
      return;
    }
    setBusyId(r.test.id);
    try {
      const defId = await resolveDefinitionId(r);
      if (!defId) {
        toast.error("No linked definition for this test.");
        return;
      }
      const res = await enqueueGeneration(
        defId,
        r.coverage.sections.map((s) => ({
          subject: s.subject,
          target_count: s.target,
          deficit: s.deficit,
        })),
      );
      if (res.success) {
        toast.success(
          res.queued > 0
            ? `Queued ${res.queued} section${res.queued === 1 ? "" : "s"} for background generation.`
            : "Those sections are already queued.",
        );
        await load();
      } else {
        toast.error("Failed to queue generation.");
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleQueueSubject = async (r: TestCoverageSummary, s: SectionCoverage) => {
    setBusyId(r.test.id + s.subject);
    try {
      const defId = await resolveDefinitionId(r);
      if (!defId) {
        toast.error("No linked definition for this test.");
        return;
      }
      const res = await enqueueGeneration(defId, [
        { subject: s.subject, target_count: s.target, deficit: s.deficit },
      ]);
      if (res.success) {
        toast.success(res.queued > 0 ? `Queued ${s.subject}.` : `${s.subject} already queued.`);
        await load();
      } else {
        toast.error("Failed to queue subject.");
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium">Mock Test Analytics</h3>
          <p className="text-xs text-muted-foreground">
            Coverage across all mock tests at a glance. Queue background generation without opening a test — approval stays 100% manual.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
        </Button>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">Ready</div>
          <div className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">{totals.ready}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">Incomplete</div>
          <div className="text-xl font-semibold text-amber-600 dark:text-amber-400">{totals.incomplete}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">Pending approval</div>
          <div className="text-xl font-semibold">{totals.pending}</div>
        </Card>
        <Card className="p-3">
          <div className="text-xs text-muted-foreground">Total deficit</div>
          <div className="text-xl font-semibold">{totals.deficit}</div>
        </Card>
      </div>

      {loading && rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6">Loading coverage…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6">No mock tests yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const cov = r.coverage;
            const active = queueCounts[(r.test as any).definition_id || ""] || 0;
            const isOpen = expanded.has(r.test.id);
            return (
              <Card key={r.test.id} className="p-0 overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 p-3">
                  <button
                    onClick={() => cov && toggle(r.test.id)}
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle details"
                  >
                    {cov ? (
                      isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                    ) : (
                      <span className="inline-block w-4" />
                    )}
                  </button>

                  <div className="flex-1 min-w-[180px]">
                    <div className="font-medium truncate">{r.test.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {r.test.organization || "—"}
                    </div>
                  </div>

                  {!r.hasDefinition || !cov ? (
                    <Badge variant="outline" className="text-muted-foreground">No AI setup</Badge>
                  ) : (
                    <>
                      <div className="w-32 sm:w-40">
                        <div className="flex items-center justify-between text-[11px] mb-0.5">
                          <span className="font-medium">{cov.percent}%</span>
                          <span className="text-muted-foreground">
                            {cov.totalApproved}/{cov.totalTarget}
                          </span>
                        </div>
                        <Progress value={cov.percent} className="h-1.5" />
                      </div>

                      {cov.totalPending > 0 && (
                        <Badge variant="secondary" className="shrink-0">
                          {cov.totalPending} pending
                        </Badge>
                      )}

                      {active > 0 && (
                        <Badge variant="outline" className="shrink-0 gap-1 text-primary border-primary/40">
                          <Loader2 className="h-3 w-3 animate-spin" /> {active} in queue
                        </Badge>
                      )}

                      {cov.ready ? (
                        <Badge className="shrink-0 gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" variant="outline">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                        </Badge>
                      ) : (
                        <Badge className="shrink-0 gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" variant="outline">
                          <AlertTriangle className="h-3.5 w-3.5" /> {cov.totalDeficit} needed
                        </Badge>
                      )}

                      {cov.totalDeficit > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 gap-1.5"
                          disabled={busyId === r.test.id}
                          onClick={() => handleQueueAll(r)}
                        >
                          {busyId === r.test.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                          Generate in Background
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {/* Expanded per-subject deficits */}
                {isOpen && cov && (
                  <div className="border-t bg-muted/20 p-3 space-y-1.5">
                    {cov.sections.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No syllabus sections.</p>
                    ) : (
                      cov.sections.map((s) => (
                        <div
                          key={s.subject}
                          className="flex items-center gap-3 text-sm rounded-md border bg-background px-2.5 py-1.5"
                        >
                          <div className="shrink-0">
                            {s.complete ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{s.subject || "(unnamed)"}</div>
                            <div className="text-xs text-muted-foreground">
                              {s.approved}/{s.target} approved
                              {s.pending > 0 && <> · {s.pending} pending</>}
                            </div>
                          </div>
                          {s.deficit > 0 ? (
                            <>
                              <Badge variant="outline" className="shrink-0 text-amber-600 dark:text-amber-400 border-amber-500/40">
                                needs {s.deficit}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="shrink-0 gap-1"
                                disabled={busyId === r.test.id + s.subject}
                                onClick={() => handleQueueSubject(r, s)}
                              >
                                {busyId === r.test.id + s.subject ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Clock className="h-3.5 w-3.5" />
                                )}
                                Queue
                              </Button>
                            </>
                          ) : (
                            <Badge variant="outline" className="shrink-0 text-emerald-600 dark:text-emerald-400 border-emerald-500/40">
                              ready
                            </Badge>
                          )}
                        </div>
                      ))
                    )}
                    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                      <ClipboardList className="h-3 w-3" />
                      Open the test in the Job Tests tab to review &amp; approve drafts.
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MockTestAnalyticsDashboard;
