import { useState, useRef } from "react";
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
import { TrendingUp, BookOpen, Target, Award } from "lucide-react";

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
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-20">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <h1 className="text-2xl font-bold">AI Personal Coach</h1>
          <p className="text-muted-foreground text-sm">Personalized insights to boost your performance</p>
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
