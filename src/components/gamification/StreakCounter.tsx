import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const StreakCounter = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreak = async () => {
      if (!user) {
        setStreak(0);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("test_attempts")
          .select("completed_at")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
          setStreak(0);
          setLoading(false);
          return;
        }

        // Calculate streak from consecutive days
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const uniqueDays = new Set<string>();
        data.forEach((attempt) => {
          if (attempt.completed_at) {
            const date = new Date(attempt.completed_at);
            date.setHours(0, 0, 0, 0);
            uniqueDays.add(date.toISOString().split("T")[0]);
          }
        });

        const sortedDays = Array.from(uniqueDays).sort().reverse();

        for (let i = 0; i < sortedDays.length; i++) {
          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - i);
          const expectedDateStr = expectedDate.toISOString().split("T")[0];

          if (sortedDays[i] === expectedDateStr) {
            currentStreak++;
          } else if (i === 0 && sortedDays[0] === new Date(today.getTime() - 86400000).toISOString().split("T")[0]) {
            // Allow yesterday as start if no activity today
            currentStreak++;
          } else {
            break;
          }
        }

        setStreak(currentStreak);
      } catch (error) {
        console.error("Error fetching streak:", error);
        setStreak(0);
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 animate-pulse">
        <div className="w-4 h-4 rounded-full bg-muted" />
        <div className="w-12 h-3 rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-brand-gradient-soft border border-primary/20">
      <Flame className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${streak > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
      <span className={`text-xs sm:text-sm font-medium ${streak > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
        {streak}<span className="hidden sm:inline"> Day{streak !== 1 ? 's' : ''}</span>
      </span>
    </div>
  );
};

export default StreakCounter;
