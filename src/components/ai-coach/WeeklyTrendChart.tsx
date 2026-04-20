import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { AICoachService } from "@/services/aiCoachService";
import { TrendingUp } from "lucide-react";

interface Props {
  userId: string;
  subject?: string;
}

const WeeklyTrendChart = ({ userId, subject }: Props) => {
  const [data, setData] = useState<{ week: string; accuracy: number; totalAttempts: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    AICoachService.getWeeklyTrend(userId, subject)
      .then((rows) => {
        if (alive) setData(rows);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId, subject]);

  const hasAny = data.some((d) => d.totalAttempts > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Weekly Performance Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : !hasAny ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            Take a few tests to see your weekly trend
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-md shadow-md p-2 text-xs">
                      <p className="font-semibold">{d.week}</p>
                      <p>Accuracy: {d.accuracy}%</p>
                      <p className="text-muted-foreground">{d.totalAttempts} attempts</p>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={80} stroke="hsl(var(--primary))" strokeDasharray="3 3" strokeOpacity={0.4} />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyTrendChart;
