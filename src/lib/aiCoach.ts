import type { SubjectAnalytics, MonthlyPerformance, AnalyticsData } from "@/hooks/useAnalyticsData";

export interface KeyFinding {
  type: "concern" | "success";
  text: string;
}

export interface PerformanceInsights {
  mainInsight: string;
  keyFindings: KeyFinding[];
}

export interface StudyPlan {
  thisWeek: { description: string; duration: string }[];
  recommendedTests: { name: string; questions: number; duration: string; reason: string }[];
  goals: { name: string; current: number; target: number }[];
}

export interface TrendAnalysis {
  trend: string;
  anomalies: { start: string; end: string }[];
}

export const analyzePerformance = (data: AnalyticsData): PerformanceInsights => {
  const { subjects, totalQuestions, monthlyPerformance } = data;
  const weakSubjects = subjects.filter((s) => s.accuracy < 60);
  const strongSubjects = subjects.filter((s) => s.accuracy >= 80);

  const recent = monthlyPerformance.slice(-3).filter((m) => m.testsCompleted > 0);
  const older = monthlyPerformance.slice(0, 6).filter((m) => m.testsCompleted > 0);
  const recentAvg = recent.length > 0 ? recent.reduce((s, m) => s + m.score, 0) / recent.length : 0;
  const olderAvg = older.length > 0 ? older.reduce((s, m) => s + m.score, 0) / older.length : 0;
  const isDeclining = recentAvg < olderAvg - 10;

  let mainInsight = "";
  if (subjects.length === 0) {
    mainInsight = "Start taking tests to get personalized coaching insights!";
  } else if (weakSubjects.length > 0) {
    mainInsight = `You're struggling with ${weakSubjects.slice(0, 2).map((s) => s.name).join(" and ")}. Let's create a focused practice plan to improve these areas.`;
  } else if (isDeclining) {
    mainInsight = "Your scores have dropped recently. This might indicate burnout or increased difficulty. Let's adjust your study strategy.";
  } else if (strongSubjects.length > 0) {
    mainInsight = `Great progress! You're performing well across ${strongSubjects.length} subject${strongSubjects.length > 1 ? "s" : ""}. Let's maintain this momentum.`;
  } else {
    mainInsight = "You're making steady progress. Focus on your weaker topics to push your scores higher.";
  }

  const keyFindings: KeyFinding[] = [];

  if (weakSubjects.length > 0) {
    keyFindings.push({
      type: "concern",
      text: `${weakSubjects[0].name} accuracy is ${weakSubjects[0].accuracy}% (target: 75%)`,
    });
  }

  if (isDeclining) {
    keyFindings.push({
      type: "concern",
      text: `Performance declined by ${Math.abs(Math.round(recentAvg - olderAvg))}% recently`,
    });
  }

  keyFindings.push({
    type: "success",
    text: `Completed ${totalQuestions} questions across all subjects`,
  });

  if (strongSubjects.length > 0) {
    keyFindings.push({
      type: "success",
      text: `Mastered ${strongSubjects.length} subject${strongSubjects.length > 1 ? "s" : ""} with 80%+ accuracy`,
    });
  }

  return { mainInsight, keyFindings };
};

export const generateRecommendation = (subject: SubjectAnalytics): string => {
  const weakTopic = subject.topics.length > 0 ? subject.topics[0].name : "fundamental concepts";
  if (subject.accuracy < 50) {
    return `Start with basics. Focus on ${weakTopic} before attempting full tests.`;
  } else if (subject.accuracy < 70) {
    return `Practice weak topics daily. Attempt 10 questions on ${weakTopic} for 7 days.`;
  } else if (subject.accuracy < 85) {
    return `You're close to mastery! Focus on ${weakTopic} to reach 85%+.`;
  }
  return "Excellent work! Maintain with weekly practice tests and explore advanced topics.";
};

export const generateStudyPlan = (data: AnalyticsData): StudyPlan => {
  const weakSubjects = data.subjects.filter((s) => s.accuracy < 70);
  const focusName = weakSubjects[0]?.name || "Mixed Subjects";

  return {
    thisWeek: [
      { description: `Practice ${focusName} — 20 questions daily`, duration: "15-20 min/day" },
      { description: "Review mistakes from last 3 tests", duration: "30 min" },
      { description: "Complete 2 full-length practice tests", duration: "2 hrs total" },
    ],
    recommendedTests: [
      { name: `${focusName} Focus Test`, questions: 20, duration: "20 min", reason: "Targets your weakest areas" },
      { name: "Comprehensive Review", questions: 50, duration: "50 min", reason: "All subjects balanced" },
    ],
    goals: [
      { name: "Questions Attempted", current: data.thisWeekQuestions, target: 100 },
      { name: "Tests Completed", current: data.thisWeekTests, target: 5 },
      { name: "Average Accuracy", current: data.averageScore, target: 75 },
    ],
  };
};

export const analyzePerformanceTrend = (monthlyData: MonthlyPerformance[]): TrendAnalysis => {
  const withData = monthlyData.filter((m) => m.testsCompleted > 0);
  if (withData.length < 2) return { trend: "Take more tests to see trend analysis.", anomalies: [] };

  const scores = withData.map((d) => d.score);
  const recent = scores.slice(-3);
  const older = scores.slice(0, Math.max(1, scores.length - 3));
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

  let trend = "";
  if (recentAvg > olderAvg + 5) {
    trend = `Great progress! Your scores improved by ${Math.round(recentAvg - olderAvg)}% recently.`;
  } else if (recentAvg < olderAvg - 5) {
    trend = `Performance declined by ${Math.round(olderAvg - recentAvg)}%. Consider reviewing your study schedule.`;
  } else {
    trend = `Steady performance at ~${Math.round(recentAvg)}%. Focus on weak topics to boost scores.`;
  }

  const anomalies: { start: string; end: string }[] = [];
  for (let i = 1; i < monthlyData.length; i++) {
    if (monthlyData[i].score > 0 && monthlyData[i - 1].score > 0 && monthlyData[i].score < monthlyData[i - 1].score - 15) {
      anomalies.push({ start: monthlyData[i - 1].month, end: monthlyData[i].month });
    }
  }

  return { trend, anomalies };
};

export const getSubjectStatus = (accuracy: number) => {
  if (accuracy >= 80) {
    return { label: "Excellent", variant: "default" as const, bg: "bg-green-100 dark:bg-green-900/20", icon: "text-green-600", text: "text-green-600" };
  } else if (accuracy >= 60) {
    return { label: "Good", variant: "secondary" as const, bg: "bg-blue-100 dark:bg-blue-900/20", icon: "text-blue-600", text: "text-blue-600" };
  }
  return { label: "Needs Improvement", variant: "destructive" as const, bg: "bg-orange-100 dark:bg-orange-900/20", icon: "text-orange-600", text: "text-orange-600" };
};
