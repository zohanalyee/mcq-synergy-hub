import { useState, useRef, useEffect } from "react";
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
import CoachGreetingCard from "@/components/coach/CoachGreetingCard";
import SubjectAnalysisCard from "@/components/analytics/SubjectAnalysisCard";
import StudyPlanSection from "@/components/analytics/StudyPlanSection";
import TopicAnalysis from "@/components/analytics/TopicAnalysis";
import QuickTestGenerator from "@/components/analytics/QuickTestGenerator";
import TestHistorySection from "@/components/analytics/TestHistorySection";
import AchievementsSection from "@/components/analytics/AchievementsSection";
import { TrendingUp, BookOpen, Target, Award, Brain, Sparkles } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import ProgressIndicator from "@/components/ai-coach/ProgressIndicator";
import WeeklyTrendChart from "@/components/ai-coach/WeeklyTrendChart";
import SubjectBreakdown from "@/components/ai-coach/SubjectBreakdown";
import AchievementsGrid from "@/components/ai-coach/AchievementsGrid";
import StudyPlanCalendar from "@/components/ai-coach/StudyPlanCalendar";
import TypewriterText from "@/components/TypewriterText";
import { useUserCredits, refreshCreditsBroadcast } from "@/hooks/useUserCredits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import CoachAdviceCard, { type CoachMood } from "@/components/coach/CoachAdviceCard";




const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const data = useAnalyticsData();
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const subjectRef = useRef<HTMLDivElement>(null);
  const { remaining: aiCredits } = useUserCredits();
  const { language } = useLanguage();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [aiMood, setAiMood] = useState<CoachMood>("neutral");
  const [adviceUsedForAttempt, setAdviceUsedForAttempt] = useState(false);

  const [lastAttemptCount, setLastAttemptCount] = useState(0);

  // Reset gate when user attempts a new test
  useEffect(() => {
    if (data.totalTests > lastAttemptCount) {
      setAdviceUsedForAttempt(false);
      setLastAttemptCount(data.totalTests);
    }
  }, [data.totalTests, lastAttemptCount]);

  const handleGetAIAdvice = async () => {
    if (!user) return;

    if (adviceUsedForAttempt) {
      toast.info("Pehle ek aur test do! 🎯", {
        description: "Nayi advice ke liye ek aur attempt chahiye — taake hum tumhari progress properly evaluate kar sakein!",
        duration: 4000,
      });
      return;
    }

    if (aiCredits < 10) {
      toast.error("Credits kam hain!", {
        description: "AI Coach advice ke liye 10 credits chahiye.",
      });
      return;
    }

    setAiLoading(true);
    try {
      const recentAttempts = (data.recentAttempts || []).slice(0, 5).map((t: any) => ({
        subject: (Array.isArray(t.subjects) ? t.subjects[0] : t.subject) || 'General',
        score: t.total_questions ? Math.round((t.score / t.total_questions) * 100) : (t.score || 0),
        date: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'recently',
      }));

      const response = await supabase.functions.invoke("generate-test", {
        body: {
          mode: "ai_coach",
          language: language || 'en',
          user_stats: {
            totalTests: data.totalTests,
            avgScore: data.averageScore,
            weakSubjects: data.subjects
              .filter((s: any) => s.accuracy < 60)
              .map((s: any) => `${s.name} (${s.accuracy}%)`),
            strongSubjects: data.subjects
              .filter((s: any) => s.accuracy >= 80)
              .map((s: any) => s.name),
            recentAttempts,
          },
        },
      });

      const advice = (response.data as any)?.advice;
      if (advice) {
        setAiAdvice(advice);
        setAdviceUsedForAttempt(true);
        refreshCreditsBroadcast();
      } else {
        const weak = data.subjects.filter((s: any) => s.accuracy < 60).map((s: any) => s.name);
        const strong = data.subjects.filter((s: any) => s.accuracy >= 80).map((s: any) => s.name);
        const fallback = [
          `${data.totalTests} tests diye hain — mehnat dikh rahi hai! 💪`,
          weak.length ? `${weak.slice(0, 2).join(' aur ')} mein aur practice chahiye — kal 15 min do!` : `Koi weak subject nahi — keep it up!`,
          strong.length ? `${strong[0]} mein mast ho — aur push karo! 🔥` : '',
        ].filter(Boolean).join(' ');
        setAiAdvice(fallback);
        setAdviceUsedForAttempt(true);
      }
    } catch (e) {
      console.error("AI advice failed:", e);
      toast.error("Advice nahi mili — dobara try karo!");
    } finally {
      setAiLoading(false);
    }
  };

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
        <PageHeader
          icon={Brain}
          title="Dashboard & AI Coach"
          tagline="Personalized insights to boost your performance"
          description={
            <TypewriterText
              prefix="Your AI Coach is "
              phrases={[
                'Analyzing your weak points...',
                'Building your study plan...',
                'Tracking your daily streak...',
              ]}
              className="text-xs md:text-sm text-primary/80 font-medium"
              minHeightClass="min-h-[3rem] md:min-h-[2rem]"
            />
          }
        />

        {/* Greeting + intent quick-select (entry point only — flows unchanged) */}
        <CoachGreetingCard
          lastAttempt={data.recentAttempts?.[0]}
          totalTests={data.totalTests}
          onSuggestForMe={() => setTestDialogOpen(true)}
        />

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

        {/* AI Coach Advice */}
        <Card className="mb-4 border-purple-200/60 dark:border-purple-900/40 bg-gradient-to-br from-purple-50/60 to-blue-50/60 dark:from-purple-950/20 dark:to-blue-950/20">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Personalized AI Coach Advice
              </p>
              <p className="text-xs text-muted-foreground">
                Get a tailored study plan based on your stats. Costs 10 AI credits.
              </p>
            </div>
            <button
              onClick={handleGetAIAdvice}
              disabled={aiLoading || aiCredits < 10}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-all shrink-0"
            >
              {aiLoading
                ? '⏳ Ustaad soch raha hai...'
                : adviceUsedForAttempt
                ? '✅ Advice mili — test do phir aao!'
                : '✨ Ustaad Se Pooch (10 credits)'}
            </button>
          </CardContent>
          {aiAdvice && <CoachAdviceCard advice={aiAdvice} mood={aiMood} />}

        </Card>

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
