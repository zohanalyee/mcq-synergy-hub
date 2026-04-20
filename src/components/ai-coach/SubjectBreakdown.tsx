import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AICoachService } from "@/services/aiCoachService";
import { BarChart3 } from "lucide-react";

interface Props {
  userId: string;
}

type Row = {
  subject: string;
  totalAttempts: number;
  accuracy: number;
  weaknessScore: number;
};

const SubjectBreakdown = ({ userId }: Props) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    AICoachService.getSubjectBreakdown(userId)
      .then((r) => {
        if (alive) setRows(r);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId]);

  const accColor = (acc: number) =>
    acc >= 80 ? "bg-emerald-500" : acc >= 60 ? "bg-amber-500" : "bg-destructive";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Subject Mastery
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Complete a test to see your subject breakdown
          </p>
        ) : (
          <div className="space-y-3">
            {rows.slice(0, 8).map((r) => (
              <div key={r.subject}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium truncate max-w-[60%]">{r.subject}</span>
                  <span className="text-muted-foreground">
                    {r.accuracy}% · {r.totalAttempts} Qs
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${accColor(r.accuracy)} transition-all`}
                    style={{ width: `${Math.max(2, r.accuracy)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubjectBreakdown;
