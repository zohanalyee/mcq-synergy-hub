import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubjectAnalytics {
  name: string;
  accuracy: number;
  totalQuestions: number;
  correctAnswers: number;
  testsCount: number;
  color: string;
  topics: TopicAnalytics[];
}

export interface TopicAnalytics {
  name: string;
  accuracy: number;
  questionsAttempted: number;
  correctAnswers: number;
}

export interface MonthlyPerformance {
  month: string;
  score: number;
  testsCompleted: number;
}

export interface WeeklyProgress {
  date: string;
  score: number;
}

export interface AnalyticsData {
  subjects: SubjectAnalytics[];
  monthlyPerformance: MonthlyPerformance[];
  weeklyProgress: WeeklyProgress[];
  totalTests: number;
  totalQuestions: number;
  averageScore: number;
  thisWeekTests: number;
  thisWeekQuestions: number;
  weaknesses: { subject: string; average_score: number; tests_count: number }[];
  recentAttempts: any[];
  loading: boolean;
  hasData: boolean;
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

const getColor = (name: string, idx: number): string => {
  if (SUBJECT_COLORS[name]) return SUBJECT_COLORS[name];
  const palette = ["#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#22c55e", "#f97316", "#06b6d4", "#ec4899"];
  return palette[idx % palette.length];
};

export const useAnalyticsData = (): AnalyticsData => {
  const { user } = useAuth();
  const [data, setData] = useState<Omit<AnalyticsData, "loading" | "hasData">>({
    subjects: [],
    monthlyPerformance: [],
    weeklyProgress: [],
    totalTests: 0,
    totalQuestions: 0,
    averageScore: 0,
    thisWeekTests: 0,
    thisWeekQuestions: 0,
    weaknesses: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetch = async () => {
      setLoading(true);
      try {
        const { data: attempts, error } = await supabase
          .from("test_attempts")
          .select("*")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false });

        if (error || !attempts || attempts.length === 0) {
          setLoading(false);
          return;
        }

        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        let totalQ = 0;
        let totalScore = 0;
        let thisWeekTests = 0;
        let thisWeekQuestions = 0;

        // Subject → topic → stats
        const subjectMap: Record<string, { total: number; correct: number; count: number; topics: Record<string, { total: number; correct: number }> }> = {};

        // Monthly aggregation
        const monthMap: Record<string, { totalScore: number; count: number }> = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        attempts.forEach((a) => {
          const pct = a.total_questions > 0 ? (a.score / a.total_questions) * 100 : 0;
          totalQ += a.total_questions;
          totalScore += pct;

          const completedAt = new Date(a.completed_at || a.created_at);
          if (completedAt >= weekStart) {
            thisWeekTests++;
            thisWeekQuestions += a.total_questions;
          }

          // Monthly
          const monthKey = `${completedAt.getFullYear()}-${completedAt.getMonth()}`;
          if (!monthMap[monthKey]) monthMap[monthKey] = { totalScore: 0, count: 0 };
          monthMap[monthKey].totalScore += pct;
          monthMap[monthKey].count++;

          // Subject breakdown
          const subjects = a.subjects || [];
          const answers = (a.answers && typeof a.answers === 'object') ? a.answers as Record<string, unknown> : {};
          
          subjects.forEach((subject: string) => {
            if (!subjectMap[subject]) subjectMap[subject] = { total: 0, correct: 0, count: 0, topics: {} };
            subjectMap[subject].total += a.total_questions;
            subjectMap[subject].correct += a.score;
            subjectMap[subject].count++;

            // Try to extract topic-level data from answers
            if (answers && typeof answers === 'object') {
              Object.values(answers).forEach((ans: unknown) => {
                const answer = ans as Record<string, unknown>;
                if (answer && typeof answer === 'object' && answer.topic) {
                  const topicName = String(answer.topic);
                  if (!subjectMap[subject].topics[topicName]) {
                    subjectMap[subject].topics[topicName] = { total: 0, correct: 0 };
                  }
                  subjectMap[subject].topics[topicName].total++;
                  if (answer.is_correct) subjectMap[subject].topics[topicName].correct++;
                }
              });
            }
          });
        });

        // Build subjects array
        const subjectsArr: SubjectAnalytics[] = Object.entries(subjectMap)
          .map(([name, s], idx) => ({
            name,
            accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
            totalQuestions: s.total,
            correctAnswers: s.correct,
            testsCount: s.count,
            color: getColor(name, idx),
            topics: Object.entries(s.topics).map(([tName, t]) => ({
              name: tName,
              accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
              questionsAttempted: t.total,
              correctAnswers: t.correct,
            })).sort((a, b) => a.accuracy - b.accuracy),
          }))
          .sort((a, b) => b.testsCount - a.testsCount);

        // Build monthly performance (last 12 months)
        const monthly: MonthlyPerformance[] = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          const m = monthMap[key];
          monthly.push({
            month: monthNames[d.getMonth()],
            score: m ? Math.round(m.totalScore / m.count) : 0,
            testsCompleted: m ? m.count : 0,
          });
        }

        // Weekly progress (last 7 days)
        const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const weekly: WeeklyProgress[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dayAttempts = attempts.filter((a) => {
            const ad = new Date(a.completed_at || a.created_at);
            return ad.toDateString() === date.toDateString();
          });
          const avg = dayAttempts.length > 0
            ? Math.round(dayAttempts.reduce((sum, a) => sum + (a.total_questions > 0 ? (a.score / a.total_questions) * 100 : 0), 0) / dayAttempts.length)
            : 0;
          weekly.push({ date: weekDays[date.getDay()], score: avg });
        }

        // Fetch weaknesses
        let weaknesses: { subject: string; average_score: number; tests_count: number }[] = [];
        const { data: wData } = await supabase.rpc("get_student_weaknesses", { target_user_id: user.id });
        if (wData) weaknesses = wData;

        setData({
          subjects: subjectsArr,
          monthlyPerformance: monthly,
          weeklyProgress: weekly,
          totalTests: attempts.length,
          totalQuestions: totalQ,
          averageScore: Math.round(totalScore / attempts.length),
          thisWeekTests,
          thisWeekQuestions,
          weaknesses,
        });
      } catch (err) {
        console.error("Analytics data error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user]);

  return { ...data, loading, hasData: data.subjects.length > 0 };
};
