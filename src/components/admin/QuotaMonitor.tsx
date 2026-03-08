import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, RefreshCw, ShieldCheck, ShieldAlert, Clock, Zap, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

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
  const [isOpen, setIsOpen] = useState(false);

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
      const { count, error: countError } = await supabase
        .from("ai_usage_logs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", `${today}T00:00:00Z`);
      if (countError) throw countError;
      setTotalUsed(count || 0);

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
    } catch {
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

  const getProgressColor = () => {
    if (usagePercentage >= 90) return "bg-destructive";
    if (usagePercentage >= 70) return "bg-amber-500";
    return "bg-primary";
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
          {/* Collapsed summary — always visible */}
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors rounded-xl">
              <Activity className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold">API Quota</span>
                  <span className="text-xs text-muted-foreground">
                    {totalUsed} / {DAILY_QUOTA_LIMIT}
                  </span>
                  {usagePercentage >= 90 ? (
                    <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  )}
                  <Badge variant={usagePercentage >= 90 ? "destructive" : "secondary"} className="text-[10px] h-4 px-1.5">
                    {remaining > 0 ? `${remaining} left` : "EXHAUSTED"}
                  </Badge>
                </div>
                <Progress value={Math.min(usagePercentage, 100)} indicatorClassName={getProgressColor()} className="h-1.5" />
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {hoursUntilReset}h
                </span>
                <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
              </div>
            </button>
          </CollapsibleTrigger>

          {/* Expanded details */}
          <CollapsibleContent>
            <div className="px-4 pb-3 pt-1 space-y-3 border-t border-border/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Updated {formatDistanceToNow(lastRefresh, { addSuffix: true })}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" onClick={fetchQuotaData} disabled={isLoading} className="h-6 px-2 text-xs">
                    <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleHealthCheck} disabled={isHealthChecking} className="h-6 px-2 text-xs">
                    {isHealthChecking ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Zap className="h-3 w-3 mr-1" />}
                    Test
                  </Button>
                </div>
              </div>

              {usagePercentage >= 95 && (
                <Alert variant="destructive" className="py-1.5">
                  <AlertDescription className="text-xs">
                    🚨 Critical: {remaining} requests left. Pause non-critical operations.
                  </AlertDescription>
                </Alert>
              )}
              {usagePercentage >= 70 && usagePercentage < 95 && (
                <Alert className="py-1.5 border-amber-200 dark:border-amber-800">
                  <AlertDescription className="text-xs">
                    ⚠️ {remaining} requests remaining. Monitor usage closely.
                  </AlertDescription>
                </Alert>
              )}

              {breakdown.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Today's Breakdown</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {breakdown.map((item) => (
                      <div key={item.source_type} className="flex items-center justify-between text-xs px-2 py-1 rounded-md bg-muted/40">
                        <span className="truncate text-muted-foreground">{formatSourceType(item.source_type)}</span>
                        <Badge variant="outline" className="text-[10px] h-4 ml-1 px-1.5">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {breakdown.length === 0 && !isLoading && (
                <p className="text-xs text-muted-foreground text-center py-1">No API usage recorded today</p>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </motion.div>
  );
};

export default QuotaMonitor;
