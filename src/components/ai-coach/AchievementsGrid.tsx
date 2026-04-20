import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AICoachService } from "@/services/aiCoachService";
import { Trophy, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
}

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
};

const AchievementsGrid = ({ userId }: Props) => {
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    AICoachService.getAchievements(userId)
      .then((r) => {
        if (alive) setItems(r);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {items.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "rounded-lg border p-3 transition",
                  a.unlocked ? "bg-primary/5 border-primary/30" : "bg-muted/30 border-muted opacity-70"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl leading-none">{a.unlocked ? a.icon : <Lock className="w-4 h-4 inline text-muted-foreground" />}</span>
                  <span className="text-xs font-semibold truncate">{a.title}</span>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">{a.description}</p>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full transition-all", a.unlocked ? "bg-primary" : "bg-muted-foreground/40")}
                    style={{ width: `${a.progress}%` }}
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

export default AchievementsGrid;
