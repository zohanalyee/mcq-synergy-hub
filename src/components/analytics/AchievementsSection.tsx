import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, Star, Target, Zap, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getStreakCount } from "@/utils/gamification";

interface Props {
  totalTests: number;
  averageScore: number;
  totalQuestions: number;
}

interface MilestoneConfig {
  icon: React.ElementType;
  label: string;
  threshold: number;
  current: number;
  color: string;
}

const AchievementsSection = ({ totalTests, averageScore, totalQuestions }: Props) => {
  const { user } = useAuth();

  const { data: streak = 0 } = useQuery({
    queryKey: ["streak", user?.id],
    queryFn: () => getStreakCount(user!.id),
    enabled: !!user,
  });

  const { data: badges = [] } = useQuery({
    queryKey: ["user-badges", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_badges")
        .select("*, badges(*)")
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const milestones: MilestoneConfig[] = [
    { icon: BookOpen, label: "Tests Taken", threshold: getNextMilestone(totalTests, [1, 5, 10, 25, 50, 100]), current: totalTests, color: "text-blue-500" },
    { icon: Target, label: "Questions Answered", threshold: getNextMilestone(totalQuestions, [10, 50, 100, 500, 1000]), current: totalQuestions, color: "text-emerald-500" },
    { icon: Star, label: "Avg Accuracy", threshold: getNextMilestone(averageScore, [50, 60, 70, 80, 90, 95]), current: averageScore, color: "text-amber-500" },
    { icon: Flame, label: "Day Streak", threshold: getNextMilestone(streak, [3, 7, 14, 30, 60]), current: streak, color: "text-orange-500" },
  ];

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-500" />
        Achievements & Milestones
      </h2>

      {/* Streak highlight */}
      {streak > 0 && (
        <Card className="p-3 mb-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200/50 dark:border-orange-800/30">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-bold text-sm">{streak}-day streak!</span>
            <span className="text-xs text-muted-foreground">Keep practicing daily!</span>
          </div>
        </Card>
      )}

      {/* Milestone progress */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {milestones.map((m) => {
          const progress = Math.min((m.current / m.threshold) * 100, 100);
          const completed = m.current >= m.threshold;
          return (
            <Card key={m.label} className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold">{m.current}</span>
                <span className="text-xs text-muted-foreground">/ {m.threshold}</span>
              </div>
              <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${completed ? "bg-emerald-500" : "bg-primary"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Earned badges */}
      {badges.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Earned Badges</h3>
          <div className="flex flex-wrap gap-2">
            {badges.map((ub: any) => (
              <Badge key={ub.id} variant="secondary" className="gap-1 text-xs py-1">
                <span>{ub.badges?.icon || "🏅"}</span>
                {ub.badges?.name || "Badge"}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function getNextMilestone(current: number, thresholds: number[]): number {
  for (const t of thresholds) {
    if (current < t) return t;
  }
  return thresholds[thresholds.length - 1];
}

export default AchievementsSection;
