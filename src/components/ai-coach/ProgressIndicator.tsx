import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Target, TrendingDown, TrendingUp, Activity } from "lucide-react";
import {
  AICoachService,
  type WeakTopic,
  type RetryTopic,
  type ProgressMetrics,
} from "@/services/aiCoachService";

interface ProgressIndicatorProps {
  userId: string;
  subject?: string;
}

const ProgressIndicator = ({ userId, subject }: ProgressIndicatorProps) => {
  const [loading, setLoading] = useState(true);
  const [weak, setWeak] = useState<WeakTopic[]>([]);
  const [retries, setRetries] = useState<RetryTopic[]>([]);
  const [metrics, setMetrics] = useState<ProgressMetrics | null>(null);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    setLoading(true);
    Promise.all([
      // analyzeUserWeakness already returns ranked rows; reuse it for "weakest 5"
      AICoachService.analyzeUserWeakness(userId, subject),
      AICoachService.getTopicsNeedingRetry(userId, 3),
      AICoachService.getProgressMetrics(userId, subject),
    ])
      .then(([rows, retryRows, m]) => {
        if (!alive) return;
        setWeak(
          rows
            .filter((r) => r.totalAttempts > 0 && r.topic && r.weaknessScore >= 30)
            .sort((a, b) => b.weaknessScore - a.weaknessScore)
            .slice(0, 5)
            .map((r) => ({
              topic: r.topic,
              weaknessScore: r.weaknessScore,
              lastAttemptedAt: null,
            }))
        );
        setRetries(retryRows);
        setMetrics(m);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId, subject]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Coach Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  const hasAny = (metrics?.totalAttempts ?? 0) > 0 || weak.length > 0 || retries.length > 0;
  if (!hasAny) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Coach Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Take a few tests and your personalised weakness map will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> AI Coach Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Metrics row */}
        {metrics && (
          <div className="grid grid-cols-3 gap-3">
            <Metric icon={<Activity className="h-3.5 w-3.5" />} label="Attempts" value={metrics.totalAttempts} />
            <Metric icon={<Target className="h-3.5 w-3.5" />} label="Accuracy" value={`${metrics.accuracyRate}%`} />
            <Metric icon={<Flame className="h-3.5 w-3.5" />} label="Streak" value={`${metrics.streakDays}d`} />
          </div>
        )}

        {/* Weakness bars */}
        {weak.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Weakest Topics
              </h4>
              {metrics && metrics.weaknessImprovement !== 0 && (
                <span
                  className={`text-[11px] inline-flex items-center gap-1 ${
                    metrics.weaknessImprovement < 0 ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {metrics.weaknessImprovement < 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <TrendingUp className="h-3 w-3" />
                  )}
                  {Math.abs(metrics.weaknessImprovement)} pts
                </span>
              )}
            </div>
            <div className="space-y-2">
              {weak.map((w) => (
                <div key={w.topic}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="truncate pr-2">{w.topic}</span>
                    <span className="text-muted-foreground">{w.weaknessScore}/100</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        w.weaknessScore > 70
                          ? "bg-destructive"
                          : w.weaknessScore > 40
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(4, w.weaknessScore))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Retry queue */}
        {retries.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Recommended retries
            </h4>
            <ul className="space-y-1.5">
              {retries.map((r) => (
                <li
                  key={`${r.subject}:${r.topic}`}
                  className="flex items-center justify-between text-sm rounded-md bg-muted/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.topic}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.subject}</p>
                  </div>
                  <Badge variant="outline" className="ml-2 shrink-0">
                    {r.daysAgo}d ago
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Metric = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) => (
  <div className="rounded-lg border bg-card/50 px-3 py-2">
    <div className="flex items-center gap-1 text-[11px] uppercase text-muted-foreground tracking-wide">
      {icon}
      {label}
    </div>
    <div className="text-lg font-semibold leading-tight mt-0.5">{value}</div>
  </div>
);

export default ProgressIndicator;
