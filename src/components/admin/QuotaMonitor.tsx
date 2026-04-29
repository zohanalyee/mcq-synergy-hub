import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, RefreshCw, ShieldCheck, ShieldAlert, Clock, Zap, ChevronDown, Brain } from "lucide-react";
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

  const getProgressGradient = () => {
    if (usagePercentage >= 90) return "bg-gradient-to-r from-red-500 to-rose-500";
    if (usagePercentage >= 70) return "bg-gradient-to-r from-amber-500 to-orange-500";
    return "bg-brand-gradient";
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
      transition={{ delay: 0.15 }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-violet-950/30 dark:from-slate-950 dark:via-slate-950/95 dark:to-violet-950/20 backdrop-blur-xl shadow-lg shadow-violet-500/5">
          {/* Animated gradient line at top */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Collapsed summary */}
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors rounded-xl">
              <div className="relative">
                <motion.div
                  className="absolute inset-0 rounded-full bg-violet-500/20 blur-sm"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Brain className="h-4 w-4 text-violet-400 relative z-10" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-slate-200">Neural Quota</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {totalUsed}<span className="text-slate-600">/</span>{DAILY_QUOTA_LIMIT}
                  </span>
                  {usagePercentage >= 90 ? (
                    <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    usagePercentage >= 90
                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                      : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                  )}>
                    {remaining > 0 ? `${remaining} left` : "EXHAUSTED"}
                  </span>
                </div>
                <div className="relative h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", getProgressGradient())}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                  {/* Shimmer effect on progress bar */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-slate-500 flex items-center gap-0.5 font-mono">
                  <Clock className="h-3 w-3" />
                  {hoursUntilReset}h
                </span>
                <ChevronDown className={cn("h-3.5 w-3.5 text-slate-500 transition-transform", isOpen && "rotate-180")} />
              </div>
            </button>
          </CollapsibleTrigger>

          {/* Expanded details */}
          <CollapsibleContent>
            <div className="px-4 pb-3 pt-1 space-y-3 border-t border-slate-700/30">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Updated {formatDistanceToNow(lastRefresh, { addSuffix: true })}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchQuotaData}
                    disabled={isLoading}
                    className="h-6 px-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  >
                    <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleHealthCheck}
                    disabled={isHealthChecking}
                    className="h-6 px-2 text-xs border-violet-500/20 text-violet-300 hover:bg-violet-500/10"
                  >
                    {isHealthChecking ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Zap className="h-3 w-3 mr-1" />}
                    Test AI
                  </Button>
                </div>
              </div>

              {usagePercentage >= 95 && (
                <Alert variant="destructive" className="py-1.5 bg-red-500/10 border-red-500/30">
                  <AlertDescription className="text-xs text-red-300">
                    🚨 Critical: {remaining} requests left. Pause non-critical operations.
                  </AlertDescription>
                </Alert>
              )}
              {usagePercentage >= 70 && usagePercentage < 95 && (
                <Alert className="py-1.5 border-amber-500/20 bg-amber-500/10">
                  <AlertDescription className="text-xs text-amber-300">
                    ⚠️ {remaining} requests remaining. Monitor usage closely.
                  </AlertDescription>
                </Alert>
              )}

              {breakdown.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Today's Neural Activity</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {breakdown.map((item) => (
                      <div key={item.source_type} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30">
                        <span className="truncate text-slate-400">{formatSourceType(item.source_type)}</span>
                        <span className="text-[10px] font-mono text-violet-300 ml-1">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {breakdown.length === 0 && !isLoading && (
                <p className="text-xs text-slate-500 text-center py-1">No neural activity recorded today</p>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </motion.div>
  );
};

export default QuotaMonitor;
