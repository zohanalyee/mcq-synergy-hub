import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  JobSyllabusSection,
  SectionCoverage,
  TestCoverage,
  getSectionCoverage,
  generateAllSections,
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

  const load = async () => {
    setLoading(true);
    try {
      const c = await getSectionCoverage(jobTestId, sections);
      setCoverage(c);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobTestId, sections.length]);

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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={load} disabled={loading || generating} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
          </Button>
          <Button size="sm" onClick={handleGenerateAll} disabled={generating || loading} className="gap-1.5">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate All Sections
          </Button>
        </div>
      </div>

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
