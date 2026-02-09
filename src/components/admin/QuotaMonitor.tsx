import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, RefreshCw, ShieldCheck, ShieldAlert, Clock, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const DAILY_QUOTA_LIMIT = 1400;

interface UsageBreakdown {
  source_type: string;
  count: number;
}

const QuotaMonitor = () => {
  const [totalUsed, setTotalUsed] = useState(0);
  const [breakdown, setBreakdown] = useState<UsageBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isHealthChecking, setIsHealthChecking] = useState(false);

  const hoursUntilReset = (() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setUTCHours(24, 0, 0, 0);
    return Math.ceil((midnight.getTime() - now.getTime()) / (1000 * 60 * 60));
  })();

  const fetchQuotaData = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      // Get total count for today
      const { count, error: countError } = await supabase
        .from("ai_usage_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${today}T00:00:00Z`);

      if (countError) throw countError;
      setTotalUsed(count || 0);

      // Get breakdown by source_type
      const { data: logs, error: logsError } = await supabase
        .from("ai_usage_logs")
        .select("source_type")
        .gte("created_at", `${today}T00:00:00Z`);

      if (logsError) throw logsError;

      const sourceMap = new Map<string, number>();
      for (const log of logs || []) {
        const src = log.source_type || "unknown";
        sourceMap.set(src, (sourceMap.get(src) || 0) + 1);
      }

      const breakdownArr: UsageBreakdown[] = [];
      for (const [source_type, count] of sourceMap.entries()) {
        breakdownArr.push({ source_type, count });
      }
      breakdownArr.sort((a, b) => b.count - a.count);
      setBreakdown(breakdownArr);

      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to fetch quota data:", err);
      toast.error("Failed to load quota data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHealthCheck = async () => {
    setIsHealthChecking(true);
    try {
      const response = await supabase.functions.invoke("ai-health");
      if (response.error) {
        toast.error(`Health check failed: ${response.error.message}`);
      } else {
        toast.success("AI health check passed", {
          description: JSON.stringify(response.data).slice(0, 100),
        });
      }
    } catch (err) {
      toast.error("Health check failed");
    } finally {
      setIsHealthChecking(false);
    }
  };

  useEffect(() => {
    fetchQuotaData();
  }, []);

  const remaining = DAILY_QUOTA_LIMIT - totalUsed;
  const usagePercentage = Math.round((totalUsed / DAILY_QUOTA_LIMIT) * 100);

  const getStatusColor = () => {
    if (usagePercentage >= 95) return "destructive";
    if (usagePercentage >= 90) return "destructive";
    if (usagePercentage >= 70) return "secondary";
    return "default";
  };

  const getProgressColor = () => {
    if (usagePercentage >= 90) return "bg-destructive";
    if (usagePercentage >= 70) return "bg-accent";
    return "bg-primary";
  };

  const getStatusIcon = () => {
    if (usagePercentage >= 90) return <ShieldAlert className="h-5 w-5 text-destructive" />;
    return <ShieldCheck className="h-5 w-5 text-primary" />;
  };

  const formatSourceType = (source: string) => {
    const labels: Record<string, string> = {
      user_test_session: "User Tests",
      admin_bulk_generator: "Admin Bulk",
      auto_fill: "Auto-Fill",
      rag_mcq_generation: "RAG MCQ",
      document_search: "Doc Search",
      rag_search: "RAG Search",
    };
    return labels[source] || source.replace(/_/g, " ");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Gemini API Quota Monitor
              {getStatusIcon()}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Updated {formatDistanceToNow(lastRefresh, { addSuffix: true })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchQuotaData}
                disabled={isLoading}
                className="h-7 px-2"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleHealthCheck}
                disabled={isHealthChecking}
                className="h-7 px-2 text-xs"
              >
                {isHealthChecking ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <Zap className="h-3.5 w-3.5 mr-1" />
                )}
                Test
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main quota bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {totalUsed} / {DAILY_QUOTA_LIMIT} requests used
              </span>
              <Badge variant={getStatusColor()}>
                {remaining > 0 ? `${remaining} remaining` : "EXHAUSTED"}
              </Badge>
            </div>
            <Progress
              value={Math.min(usagePercentage, 100)}
              indicatorClassName={getProgressColor()}
              className="h-3"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{usagePercentage}% used</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Resets in {hoursUntilReset}h (midnight UTC)
              </span>
            </div>
          </div>

          {/* Warning alerts */}
          {usagePercentage >= 95 && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">
                🚨 Critical: {remaining} requests left. Non-critical operations (auto-fill, bulk generation) should be paused.
              </AlertDescription>
            </Alert>
          )}
          {usagePercentage >= 70 && usagePercentage < 95 && (
            <Alert className="py-2 border-accent/50">
              <AlertDescription className="text-xs text-accent-foreground">
                ⚠️ Warning: {remaining} requests remaining. Monitor usage closely.
              </AlertDescription>
            </Alert>
          )}

          {/* Breakdown by source */}
          {breakdown.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Today's Breakdown</p>
              <div className="grid grid-cols-2 gap-1.5">
                {breakdown.map((item) => (
                  <div
                    key={item.source_type}
                    className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-muted/50"
                  >
                    <span className="truncate">{formatSourceType(item.source_type)}</span>
                    <Badge variant="outline" className="text-[10px] h-5 ml-1">
                      {item.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {breakdown.length === 0 && !isLoading && (
            <p className="text-xs text-muted-foreground text-center py-2">
              No API usage recorded today
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuotaMonitor;
