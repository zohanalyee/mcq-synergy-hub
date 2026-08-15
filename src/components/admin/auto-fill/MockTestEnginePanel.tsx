import { useEffect, useState } from "react";
import { Flame, RefreshCw, TrendingUp, Users, Sparkles, Play, Gauge, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  getMockTestDemand,
  growJobTestPool,
  runPopularityFill,
  runPoolPreWarm,
  type MockTestDemand,
  type DemandTier,
} from "@/services/jobTestService";

/**
 * Unified "Content Engine" companion to the board-topic auto-fill worklist.
 * Shows demand VELOCITY (questions consumed in the last 24h + burn rate against
 * the approved pool), the demand tier that raises the effective pool target
 * automatically, and one-click background growth / pre-warm.
 * Everything stays pre-generated + admin-approved.
 */
const tierMeta: Record<DemandTier, { label: string; className: string }> = {
  steady: { label: "Steady", className: "bg-muted text-muted-foreground" },
  warm: { label: "Warm 1.5×", className: "bg-secondary text-secondary-foreground" },
  hot: { label: "Hot 2×", className: "bg-primary/15 text-primary border border-primary/30" },
  surge: { label: "Surge 3×", className: "bg-destructive/15 text-destructive border border-destructive/30" },
};

const MockTestEnginePanel = () => {
  const [rows, setRows] = useState<MockTestDemand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isFilling, setIsFilling] = useState(false);
  const [isPreWarming, setIsPreWarming] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await getMockTestDemand(24);
      setRows(data);
    } catch (e) {
      toast.error("Failed to load mock test demand");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGrow = async (row: MockTestDemand) => {
    if (!row.definition_id) {
      toast.error("This mock test has no linked syllabus definition yet");
      return;
    }
    setBusyId(row.test_id);
    // Grow to the demand-aware effective multiplier (never below the base).
    const res = await growJobTestPool(
      row.definition_id,
      Math.max(row.effective_multiplier, row.base_multiplier),
    );
    if (res.success) {
      toast.success(res.message, { description: row.title });
      load();
    } else {
      toast.error(res.message);
    }
    setBusyId(null);
  };

  const handlePopularityFill = async () => {
    setIsFilling(true);
    const res = await runPopularityFill();
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
    setIsFilling(false);
    load();
  };

  const handlePreWarm = async () => {
    setIsPreWarming(true);
    const res = await runPoolPreWarm(8, 30);
    if (res.success) toast.success(res.message, { description: "Questions land as drafts for review" });
    else toast.error(res.message);
    setIsPreWarming(false);
    load();
  };

  const surgeActive = rows.some((r) => r.surge_active);
  const active = rows.filter((r) => r.attempts > 0 || r.questions_consumed_window > 0).slice(0, 12);
  const needsGrowth = active.filter((r) => r.pool_deficit > 0);
  const scalingUp = active.filter((r) => r.demand_tier !== "steady");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" />
              Mock Test Demand — Auto-Scaling Pool Growth
            </CardTitle>
            <CardDescription className="text-xs">
              Questions consumed in the last 24h vs. approved pool. High burn rate raises the
              effective target automatically (capped), so popular tests never stall at a fixed
              ceiling.
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={load} className="gap-2 min-h-11">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreWarm}
              disabled={isPreWarming}
              className="gap-2 min-h-11"
            >
              {isPreWarming ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 text-primary" />}
              Pre-warm pool
            </Button>
            <Button size="sm" onClick={handlePopularityFill} disabled={isFilling} className="gap-2 min-h-11">
              {isFilling ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Fill Popular Now
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {surgeActive && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 text-xs">
            <span className="font-medium text-primary">Campaign surge active</span> — pool targets are
            floored at the campaign multiplier and the autofill budget is raised.
          </div>
        )}

        {isLoading && active.length === 0 && (
          <p className="text-xs text-muted-foreground">Loading demand data…</p>
        )}

        {!isLoading && active.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No mock test activity recorded yet. Use “Pre-warm pool” to build a buffer before a
            campaign launch.
          </p>
        )}

        {active.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {needsGrowth.length} of {active.length} active tests are below their effective target
            {scalingUp.length > 0 && ` · ${scalingUp.length} scaling up on demand`}.
          </p>
        )}

        <div className="space-y-2">
          {active.map((row) => {
            const percent =
              row.effective_target > 0
                ? Math.min(100, Math.round((row.approved_pool / row.effective_target) * 100))
                : 0;
            const tier = tierMeta[row.demand_tier] || tierMeta.steady;
            return (
              <div
                key={row.test_id}
                className="rounded-lg border border-border/60 bg-card/50 p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{row.title}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {row.attempts} attempts
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {row.active_users_window} users / 24h
                      </span>
                      <span className="flex items-center gap-1">
                        <Gauge className="h-3 w-3" />
                        {row.questions_consumed_window} Qs consumed · burn{" "}
                        {Math.round(row.burn_rate * 100)}%
                      </span>
                      {row.last_attempt_at && (
                        <span>
                          last {formatDistanceToNow(new Date(row.last_attempt_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={tier.className} variant="outline">
                      {tier.label}
                    </Badge>
                    {row.pool_deficit > 0 ? (
                      <Badge variant="destructive">-{row.pool_deficit} short</Badge>
                    ) : (
                      <Badge variant="secondary">Pool healthy</Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 min-h-11"
                      disabled={busyId === row.test_id || !row.definition_id}
                      onClick={() => handleGrow(row)}
                    >
                      {busyId === row.test_id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-primary" />
                      )}
                      Grow {row.effective_multiplier}×
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress value={percent} />
                  <p className="text-[11px] text-muted-foreground">
                    {row.approved_pool} approved / {row.effective_target} effective target (
                    {row.exam_length}-question exam · base {row.base_multiplier}× → {row.effective_multiplier}×)
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default MockTestEnginePanel;
