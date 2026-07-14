import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, Loader2, Sparkles, RefreshCw, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  JobSyllabusSection,
  SectionCoverage,
  TestCoverage,
  JobTestQueueItem,
  getSectionCoverage,
  generateAllSections,
  enqueueGeneration,
  getQueueForTest,
  cancelPendingQueueForTest,
} from "@/services/jobTestService";

interface Props {
  jobTestId: string;
  sections: JobSyllabusSection[];
  /** Called after a generation run so sibling tables can refresh. */
  onGenerated?: () => void;
}

/**
 * Prominent per-test coverage dashboard. Shows, at a glance, how many
 * questions each section still needs before the test is player-ready.
 * All generation is admin-triggered here — nothing runs automatically and
 * nothing is generated when a learner starts a test.
 */
export const SectionCoverageDashboard: React.FC<Props> = ({ jobTestId, sections, onGenerated }) => {
  const [coverage, setCoverage] = useState<TestCoverage | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [queueActive, setQueueActive] = useState(0);
  const [queueItems, setQueueItems] = useState<JobTestQueueItem[]>([]);
  const [enqueuing, setEnqueuing] = useState(false);
  const [stopping, setStopping] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const c = await getSectionCoverage(jobTestId, sections);
      setCoverage(c);
      const queue = await getQueueForTest(jobTestId);
      setQueueItems(queue);
      setQueueActive(queue.filter((q) => q.status === "pending" || q.status === "processing").length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobTestId, sections.length]);

  // Realtime queue updates: status changes appear without manual refresh.
  useEffect(() => {
    const channel = supabase
      .channel(`jobtest-queue-${jobTestId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job_test_generation_queue",
          filter: `job_test_id=eq.${jobTestId}`,
        },
        () => {
          load();
          onGenerated?.();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobTestId, sections.length]);

  // While a background queue is active, poll so progress shows up automatically.
  useEffect(() => {
    if (queueActive <= 0) return;
    const t = setInterval(() => {
      load();
    }, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueActive, jobTestId]);

  const handleGenerateBackground = async () => {
    if (!coverage || coverage.totalDeficit === 0) {
      toast.info("Nothing to generate — every section already meets its target.");
      return;
    }
    setEnqueuing(true);
    try {
      const r = await enqueueGeneration(
        jobTestId,
        coverage.sections.map((s) => ({
          subject: s.subject,
          target_count: s.target,
          deficit: s.deficit,
        })),
      );
      if (r.success) {
        if (r.queued > 0) {
          toast.success(
            `Queued ${r.queued} section${r.queued === 1 ? "" : "s"} for background generation. Drafts will trickle in — check back later.`,
            { duration: 6000 },
          );
        } else {
          toast.info("Those sections are already queued.");
        }
        await load();
      } else {
        toast.error("Failed to queue background generation.");
      }
    } finally {
      setEnqueuing(false);
    }
  };

  const handleStopBackground = async () => {
    setStopping(true);
    try {
      const r = await cancelPendingQueueForTest(jobTestId);
      if (r.success) {
        toast.success(
          r.count > 0
            ? `Stopped ${r.count} pending queue item${r.count === 1 ? "" : "s"}. Current processing item will finish safely.`
            : "No pending queue items to stop.",
        );
        await load();
      } else {
        toast.error("Failed to stop background generation.");
      }
    } finally {
      setStopping(false);
    }
  };


  const handleGenerateAll = async () => {
    if (sections.length === 0) {
      toast.error("Add syllabus sections first (Syllabus tab).");
      return;
    }
    if (
      !window.confirm(
        `Generate AI questions for ALL ${sections.length} sections?\n\nOnly the missing deficit is generated (credit-safe). New questions arrive as DRAFTS and must be approved before players can see them.`,
      )
    ) {
      return;
    }
    setGenerating(true);
    toast.info("✨ Generating drafts for all sections… this can take a minute.");
    try {
      const r = await generateAllSections(jobTestId);
      if (r.success) {
        toast.success(
          `Done — ${r.total_accepted ?? 0} new drafts added${
            r.total_reused ? `, ${r.total_reused} reused from DB` : ""
          }. Review & approve them below.`,
          { duration: 6000 },
        );
        await load();
        onGenerated?.();
      } else {
        toast.error(r.message || "Generation failed.");
      }
    } finally {
      setGenerating(false);
    }
  };

  const incompleteCount = coverage?.sections.filter((s) => !s.complete).length ?? 0;
  const activeQueueItems = queueItems.filter((q) => q.status === "pending" || q.status === "processing");
  const pendingQueueCount = activeQueueItems.filter((q) => q.status === "pending").length;
  const processingQueueItem = activeQueueItems.find((q) => q.status === "processing");

  return (
    <Card className="p-4 space-y-4 border-primary/20">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {coverage?.ready ? (
            <Badge className="gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" variant="outline">
              <CheckCircle2 className="h-3.5 w-3.5" /> Player-ready
            </Badge>
          ) : (
            <Badge className="gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" variant="outline">
              <AlertTriangle className="h-3.5 w-3.5" />
              {incompleteCount} section{incompleteCount === 1 ? "" : "s"} incomplete
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            Everything is pre-generated &amp; admin-approved — no questions are generated at test start.
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateBackground}
            disabled={enqueuing || loading}
            className="gap-1.5"
            title="Queue generation to run gradually in the background — no waiting"
          >
            {enqueuing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
            Generate in Background
          </Button>
          {queueActive > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleStopBackground}
              disabled={stopping || pendingQueueCount === 0}
              className="gap-1.5 text-destructive hover:text-destructive"
              title="Cancel all pending background generation for this test"
            >
              {stopping ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Stop Background
            </Button>
          )}
          <Button size="sm" onClick={handleGenerateAll} disabled={generating || loading} className="gap-1.5">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate Now
          </Button>
        </div>
      </div>

      {queueActive > 0 && (
        <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span className="font-medium">
              {processingQueueItem ? `Processing ${processingQueueItem.subject}…` : `${queueActive} section${queueActive === 1 ? "" : "s"} queued…`}
            </span>
            <span className="text-muted-foreground">
              Drafts appear below as they finish — approval stays manual.
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeQueueItems.slice(0, 6).map((q) => (
              <Badge key={q.id} variant="outline" className="gap-1 capitalize bg-background/60">
                {q.status === "processing" && <Loader2 className="h-3 w-3 animate-spin" />}
                {q.subject}: {q.status}
              </Badge>
            ))}
            {activeQueueItems.length > 6 && (
              <Badge variant="outline" className="bg-background/60">+{activeQueueItems.length - 6} more</Badge>
            )}
          </div>
        </div>
      )}


      {/* Overall progress */}
      {coverage && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">
              {coverage.totalApproved} / {coverage.totalTarget} approved
            </span>
            <span className="text-muted-foreground">
              {coverage.totalPending > 0 && <>{coverage.totalPending} pending review · </>}
              {coverage.totalDeficit > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">{coverage.totalDeficit} still needed</span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">target met</span>
              )}
            </span>
          </div>
          <Progress value={coverage.percent} className="h-2" />
        </div>
      )}

      {/* Per-section table */}
      {loading && !coverage ? (
        <p className="text-sm text-muted-foreground py-4">Loading coverage…</p>
      ) : coverage && coverage.sections.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No syllabus sections yet. Add sections in the Syllabus tab to track coverage.
        </p>
      ) : (
        <div className="space-y-1.5">
          {coverage?.sections.map((s: SectionCoverage) => (
            <div
              key={s.subject}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-2.5 text-sm",
                s.complete ? "border-border/50 bg-muted/20" : "border-amber-500/30 bg-amber-500/5",
              )}
            >
              <div className="shrink-0">
                {s.complete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{s.subject || "(unnamed section)"}</div>
                <div className="text-xs text-muted-foreground">
                  {s.approved}/{s.target} approved
                  {s.pending > 0 && <> · {s.pending} pending</>}
                </div>
              </div>
              {s.deficit > 0 ? (
                <Badge variant="outline" className="shrink-0 text-amber-600 dark:text-amber-400 border-amber-500/40">
                  needs {s.deficit}
                </Badge>
              ) : (
                <Badge variant="outline" className="shrink-0 text-emerald-600 dark:text-emerald-400 border-emerald-500/40">
                  ready
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default SectionCoverageDashboard;
