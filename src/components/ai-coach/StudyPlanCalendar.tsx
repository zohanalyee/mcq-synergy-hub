import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AICoachService } from "@/services/aiCoachService";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
}

type Day = { date: Date; subjects: string[]; reason: string };

const StudyPlanCalendar = ({ userId }: Props) => {
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    AICoachService.getStudyPlan(userId, 7)
      .then((r) => {
        if (alive) setDays(r);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId]);

  const reasonColor = (r: string) =>
    r === "Spaced repetition"
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
      : r === "Retry weak topics"
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          7-Day Study Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-md" />
            ))}
          </div>
        ) : days.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Take a few tests so we can plan your study week
          </p>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {days.map((d, i) => {
              const isToday = d.date.toISOString().slice(0, 10) === todayKey;
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-md border p-2 text-center min-h-[80px] flex flex-col",
                    isToday ? "border-primary ring-1 ring-primary/30" : "border-border"
                  )}
                >
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground">
                    {d.date.toLocaleDateString(undefined, { weekday: "short" })}
                  </div>
                  <div className="text-xs font-bold">{d.date.getDate()}</div>
                  <div className="mt-1 text-[10px] font-medium truncate" title={d.subjects[0]}>
                    {d.subjects[0]}
                  </div>
                  <div
                    className={cn("mt-auto text-[9px] rounded px-1 py-0.5 border truncate", reasonColor(d.reason))}
                    title={d.reason}
                  >
                    {d.reason}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyPlanCalendar;
