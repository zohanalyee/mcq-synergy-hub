import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserStats {
  totalStudyMinutes: number;
  testsCompleted: number;
  accuracyRate: number;
  questionsAnswered: number;
  loading: boolean;
}

export const useUserStats = (): UserStats => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalStudyMinutes: 0,
    testsCompleted: 0,
    accuracyRate: 0,
    questionsAnswered: 0,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setStats({
        totalStudyMinutes: 0,
        testsCompleted: 0,
        accuracyRate: 0,
        questionsAnswered: 0,
        loading: false,
      });
      return;
    }

    const fetchStats = async () => {
      try {
        // Fetch all test attempts for the user
        const { data: attempts, error } = await supabase
          .from("test_attempts")
          .select("score, total_questions, time_taken")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching user stats:", error);
          setStats(prev => ({ ...prev, loading: false }));
          return;
        }

        if (attempts && attempts.length > 0) {
          // Calculate total study time (time_taken is in seconds)
          const totalSeconds = attempts.reduce((sum, a) => sum + (a.time_taken || 0), 0);
          const totalStudyMinutes = Math.round(totalSeconds / 60);

          // Tests completed count
          const testsCompleted = attempts.length;

          // Total questions answered
          const questionsAnswered = attempts.reduce((sum, a) => sum + (a.total_questions || 0), 0);

          // Calculate accuracy rate
          const totalScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
          const accuracyRate = questionsAnswered > 0 
            ? Math.round((totalScore / questionsAnswered) * 100) 
            : 0;

          setStats({
            totalStudyMinutes,
            testsCompleted,
            accuracyRate,
            questionsAnswered,
            loading: false,
          });
        } else {
          setStats({
            totalStudyMinutes: 0,
            testsCompleted: 0,
            accuracyRate: 0,
            questionsAnswered: 0,
            loading: false,
          });
        }
      } catch (error) {
        console.error("Error in useUserStats:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [user]);

  return stats;
};
