import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubjectPerformance {
  name: string;
  value: number;
  color: string;
  testsCount: number;
}

interface Weakness {
  subject: string;
  average_score: number;
  tests_count: number;
}

interface WeeklyProgress {
  date: string;
  score: number;
}

const SUBJECT_COLORS: Record<string, string> = {
  "Mathematics": "#3b82f6",
  "Computer Science": "#10b981",
  "Physics": "#8b5cf6",
  "Chemistry": "#ef4444",
  "Biology": "#22c55e",
  "English": "#f97316",
  "Economics": "#06b6d4",
  "History": "#ec4899",
  "Geography": "#84cc16",
  "Political Science": "#6366f1",
};

const getSubjectColor = (subject: string, index: number): string => {
  if (SUBJECT_COLORS[subject]) return SUBJECT_COLORS[subject];
  const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#22c55e", "#f97316", "#06b6d4", "#ec4899"];
  return colors[index % colors.length];
};

export const useDashboardData = () => {
  const { user } = useAuth();
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTests, setTotalTests] = useState(0);
  const [averageScore, setAverageScore] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch test attempts for the user
        const { data: attempts, error: attemptsError } = await supabase
          .from("test_attempts")
          .select("*")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false });

        if (attemptsError) {
          console.error("Error fetching test attempts:", attemptsError);
          return;
        }

        if (attempts && attempts.length > 0) {
          setTotalTests(attempts.length);

          // Calculate overall average score
          const totalScore = attempts.reduce((sum, a) => {
            const percentage = a.total_questions > 0 ? (a.score / a.total_questions) * 100 : 0;
            return sum + percentage;
          }, 0);
          setAverageScore(Math.round(totalScore / attempts.length));

          // Group by subject and calculate performance
          const subjectMap: Record<string, { total: number; count: number }> = {};
          
          attempts.forEach((attempt) => {
            const subjects = attempt.subjects || [];
            subjects.forEach((subject: string) => {
              if (!subjectMap[subject]) {
                subjectMap[subject] = { total: 0, count: 0 };
              }
              const percentage = attempt.total_questions > 0 
                ? (attempt.score / attempt.total_questions) * 100 
                : 0;
              subjectMap[subject].total += percentage;
              subjectMap[subject].count += 1;
            });
          });

          const performance: SubjectPerformance[] = Object.entries(subjectMap)
            .map(([name, data], index) => ({
              name,
              value: Math.round(data.total / data.count),
              color: getSubjectColor(name, index),
              testsCount: data.count,
            }))
            .sort((a, b) => b.testsCount - a.testsCount)
            .slice(0, 6);

          setSubjectPerformance(performance);

          // Calculate weekly progress (last 7 days)
          const now = new Date();
          const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const weeklyData: WeeklyProgress[] = [];

          for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dayName = weekDays[date.getDay()];
            
            const dayAttempts = attempts.filter((a) => {
              const attemptDate = new Date(a.completed_at || a.created_at);
              return attemptDate.toDateString() === date.toDateString();
            });

            const avgScore = dayAttempts.length > 0
              ? Math.round(
                  dayAttempts.reduce((sum, a) => {
                    return sum + (a.total_questions > 0 ? (a.score / a.total_questions) * 100 : 0);
                  }, 0) / dayAttempts.length
                )
              : 0;

            weeklyData.push({ date: dayName, score: avgScore });
          }

          setWeeklyProgress(weeklyData);
        }

        // Fetch weaknesses using the RPC function
        const { data: weaknessData, error: weaknessError } = await supabase
          .rpc("get_student_weaknesses", { target_user_id: user.id });

        if (weaknessError) {
          console.error("Error fetching weaknesses:", weaknessError);
        } else if (weaknessData) {
          setWeaknesses(weaknessData);
        }
      } catch (error) {
        console.error("Dashboard data error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return {
    subjectPerformance,
    weaknesses,
    weeklyProgress,
    loading,
    totalTests,
    averageScore,
    hasData: subjectPerformance.length > 0,
  };
};
