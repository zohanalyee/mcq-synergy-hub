import { useEffect, useState } from "react";
import { Flame, RefreshCw, TrendingUp, Users, Sparkles, Play } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  getMockTestPopularity,
  growJobTestPool,
  runPopularityFill,
  type MockTestPopularity,
} from "@/services/jobTestService";

/**
 * Unified "Content Engine" companion to the board-topic auto-fill worklist:
 * shows which mock tests users are actually taking and how far their question
 * pool is below its growth target, with one-click background pool growth.
 * Everything stays pre-generated + admin-approved.
 */
const MockTestEnginePanel = () => {
  const [rows, setRows] = useState<MockTestPopularity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isFilling, setIsFilling] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await getMockTestPopularity(14);
      setRows(data);
    } catch (e) {
      toast.error("Failed to load mock test popularity");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGrow = async (row: MockTestPopularity) => {
    if (!row.definition_id) {
      toast.error("This mock test has no linked syllabus definition yet");
      return;
    }
    setBusyId(row.test_id);
    const res = await growJobTestPool(row.definition_id, 5);
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

  const popular = rows.filter((r) => r.attempts > 0).slice(0, 10);
  const needsGrowth = popular.filter((r) => r.pool_deficit > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" />
              Popular Mock Tests — Pool Growth
            </CardTitle>
            <CardDescription className="text-xs">
              Attempts in the last 14 days vs. approved question pool. Popular tests grow first, so
              repeat attempts stay fresh.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={handlePopularityFill} disabled={isFilling} className="gap-2">
              {isFilling ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Fill Popular Now
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && popular.length === 0 && (
          <p className="text-xs text-muted-foreground">Loading popularity data…</p>
        )}

        {!isLoading && popular.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No mock test attempts recorded in the last 14 days.
          </p>
        )}

        {popular.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {needsGrowth.length} of {popular.length} popular tests are below their growth target.
          </p>
        )}

        <div className="space-y-2">
          {popular.map((row) => {
            const percent =
              row.grow_target > 0
                ? Math.min(100, Math.round((row.approved_pool / row.grow_target) * 100))
                : 0;
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
                        {row.distinct_users} users
                      </span>
                      {row.last_attempt_at && (
                        <span>
                          last {formatDistanceToNow(new Date(row.last_attempt_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                      Grow 5×
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress value={percent} />
                  <p className="text-[11px] text-muted-foreground">
                    {row.approved_pool} approved / {row.grow_target} growth target ({row.exam_length}
                    -question exam)
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
