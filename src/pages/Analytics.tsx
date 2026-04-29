import { useState, useRef } from "react";
import SEOHead from '@/components/SEOHead';
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, PieChart, ResponsiveContainer, Line, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { analyzePerformanceTrend } from "@/lib/aiCoach";
import AIInsightsPanel from "@/components/analytics/AIInsightsPanel";
import EmptyCoachState from "@/components/coach/EmptyCoachState";
import SubjectAnalysisCard from "@/components/analytics/SubjectAnalysisCard";
import StudyPlanSection from "@/components/analytics/StudyPlanSection";
import TopicAnalysis from "@/components/analytics/TopicAnalysis";
import QuickTestGenerator from "@/components/analytics/QuickTestGenerator";
import TestHistorySection from "@/components/analytics/TestHistorySection";
import AchievementsSection from "@/components/analytics/AchievementsSection";
import { TrendingUp, BookOpen, Target, Award, Brain, Sparkles } from "lucide-react";
import ProgressIndicator from "@/components/ai-coach/ProgressIndicator";
import WeeklyTrendChart from "@/components/ai-coach/WeeklyTrendChart";
import SubjectBreakdown from "@/components/ai-coach/SubjectBreakdown";
import AchievementsGrid from "@/components/ai-coach/AchievementsGrid";
import StudyPlanCalendar from "@/components/ai-coach/StudyPlanCalendar";

const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const data = useAnalyticsData();
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const subjectRef = useRef<HTMLDivElement>(null);

  // No auth check needed — InstantAuthGuard handles it at route level

  if (data.loading) {
    return (
      <Header>
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-12 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </Header>
    );
  }

  if (!data.hasData) {
    return (
      <Header>
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-12">
          <EmptyCoachState />
        </div>
      </Header>
    );
  }

  const trendAnalysis = analyzePerformanceTrend(data.monthlyPerformance);

  const statCards = [
    { label: "Total Tests", value: data.totalTests, icon: BookOpen, color: "text-blue-500" },
    { label: "Questions", value: data.totalQuestions, icon: Target, color: "text-emerald-500" },
    { label: "Avg Score", value: `${data.averageScore}%`, icon: Award, color: "text-purple-500" },
    { label: "This Week", value: data.thisWeekTests, icon: TrendingUp, color: "text-orange-500" },
  ];

  return (
    <Header>
      <SEOHead
        title="AI Personal Coach & Performance Analytics"
        description="Track your exam preparation progress with AI-powered analytics, personalized insights, and performance trends."
        keywords="performance analytics, AI coach, study progress, exam tracking, personalized insights"
        noindex
      />
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative mb-6 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-cyan-50/60 via-background to-blue-50/60 dark:from-cyan-950/30 dark:via-background dark:to-blue-950/30 px-5 py-5 md:px-7 md:py-6 shadow-sm"
        >
          <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative flex items-center gap-3 md:gap-4">
            <div className="flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-primary-foreground shadow-lg shadow-primary/20 ring-1 ring-white/30">
              <Brain className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold leading-tight bg-gradient-to-r from-primary via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Dashboard & AI Coach
              </h1>
              <p className="text-muted-foreground text-xs md:text-sm flex items-center gap-1.5 mt-0.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                Personalized insights to boost your performance
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {statCards.map((s) => (
            <Card key={s.label} className="p-3">
              <div className="flex items-center gap-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xl font-bold mt-1">{s.value}</p>
            </Card>
          ))}
        </div>

        {/* AI Insights */}
        <AIInsightsPanel
          data={data}
          onViewRecommendations={() => subjectRef.current?.scrollIntoView({ behavior: "smooth" })}
          onGenerateTest={() => setTestDialogOpen(true)}
        />

        {/* Phase 3 — Weekly trend + subject breakdown */}
        {user?.id && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <WeeklyTrendChart userId={user.id} />
            <SubjectBreakdown userId={user.id} />
          </div>
        )}

        {/* AI Coach Phase 2 — weakness map + retry queue */}
        {user?.id && (
          <div className="mb-6">
            <ProgressIndicator userId={user.id} />
          </div>
        )}

        {/* Phase 3 — 7-day study plan + achievements */}
        {user?.id && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <StudyPlanCalendar userId={user.id} />
            <AchievementsGrid userId={user.id} />
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-2.5 text-sm">
                          <p className="font-semibold">{d.month}</p>
                          <p>Score: <span className="font-medium">{d.score}%</span></p>
                          <p className="text-xs text-muted-foreground">{d.testsCompleted} tests</p>
                        </div>
                      );
                    }}
                  />
                  <ReferenceLine y={75} stroke="hsl(var(--primary))" strokeDasharray="3 3" strokeOpacity={0.5} />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
              {trendAnalysis.trend && (
                <div className="mt-3 p-2.5 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium flex items-center gap-1.5 mb-0.5">
                    <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                    Trend Analysis
                  </p>
                  <p className="text-xs text-muted-foreground">{trendAnalysis.trend}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Subject Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data.subjects.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="accuracy"
                    nameKey="name"
                    label={({ name, accuracy }) => `${name}: ${accuracy}%`}
                  >
                    {data.subjects.slice(0, 6).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div ref={subjectRef} />

        {/* Achievements */}
        <AchievementsSection
          totalTests={data.totalTests}
          averageScore={data.averageScore}
          totalQuestions={data.totalQuestions}
        />

        {/* Test History */}
        <TestHistorySection attempts={data.recentAttempts} />

        {/* Study Plan */}
        <StudyPlanSection data={data} />

        {/* Topic Drill-Down */}
        <TopicAnalysis subjects={data.subjects} />

        {/* Quick Test FAB */}
        <QuickTestGenerator data={data} open={testDialogOpen} onOpenChange={setTestDialogOpen} />
      </div>
    </Header>
  );
};

export default Analytics;
