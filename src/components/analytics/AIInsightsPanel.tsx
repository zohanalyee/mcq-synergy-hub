import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertCircle, CheckCircle, Target, Zap, BarChart3, ChevronDown, ChevronUp, BookOpen, Clock, Lightbulb, PlayCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import type { AnalyticsData } from "@/hooks/useAnalyticsData";
import { analyzePerformance, generateStudyPlan, getSubjectStatus, generateRecommendation } from "@/lib/aiCoach";
import { useNavigate } from "react-router-dom";

interface Props {
  data: AnalyticsData;
  onViewRecommendations: () => void;
  onGenerateTest: () => void;
}

const getAccuracyColor = (accuracy: number) => {
  if (accuracy >= 80) return "bg-emerald-500";
  if (accuracy >= 60) return "bg-blue-500";
  if (accuracy >= 40) return "bg-amber-500";
  return "bg-red-500";
};

const getAccuracyTextColor = (accuracy: number) => {
  if (accuracy >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (accuracy >= 60) return "text-blue-600 dark:text-blue-400";
  if (accuracy >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

type ExpandedSection = null | "analytics" | "subjects";

const AIInsightsPanel = ({ data, onViewRecommendations, onGenerateTest }: Props) => {
  const insights = analyzePerformance(data);
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const studyPlan = generateStudyPlan(data);
  const navigate = useNavigate();

  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold mb-1.5 flex items-center gap-2">
              AI Coach Analysis
              <Badge variant="secondary" className="text-xs">Updated just now</Badge>
            </h3>

            <p className="text-sm text-muted-foreground mb-4">{insights.mainInsight}</p>

            <div className="grid md:grid-cols-2 gap-2 mb-4">
              {insights.keyFindings.map((finding, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  {finding.type === "concern" ? (
                    <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  )}
                  <span>{finding.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={onViewRecommendations}>
                <Target className="w-4 h-4 mr-1.5" />
                View Recommendations
              </Button>
              <Button size="sm" variant="outline" onClick={onGenerateTest}>
                <Zap className="w-4 h-4 mr-1.5" />
                Generate Practice Test
              </Button>
              <Button
                size="sm"
                variant={expandedSection === "analytics" ? "secondary" : "ghost"}
                onClick={() => toggleSection("analytics")}
                className="gap-1.5"
              >
                <BarChart3 className="w-4 h-4" />
                View Detailed Analytics
                {expandedSection === "analytics" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </Button>
              <Button
                size="sm"
                variant={expandedSection === "subjects" ? "secondary" : "ghost"}
                onClick={() => toggleSection("subjects")}
                className="gap-1.5"
              >
                <BookOpen className="w-4 h-4" />
                Subject-Wise Analysis
                {expandedSection === "subjects" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Detailed Analytics */}
      <AnimatePresence mode="wait">
        {expandedSection === "analytics" && (
          <motion.div
            key="analytics"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-blue-200/40 dark:border-blue-800/30">
              <div className="grid lg:grid-cols-2 gap-4">
                {/* Subject-wise Accuracy Bars */}
                <div className="rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/10 p-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Subject-wise Accuracy
                  </h4>
                  <div className="space-y-3">
                    {data.subjects.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No subject data yet.</p>
                    ) : (
                      data.subjects.slice(0, 6).map((subject) => (
                        <div key={subject.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium truncate mr-2">{subject.name}</span>
                            <span className={`font-bold tabular-nums ${getAccuracyTextColor(subject.accuracy)}`}>
                              {subject.accuracy}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${subject.accuracy}%` }}
                              transition={{ duration: 0.8, delay: 0.1 }}
                              className={`h-full rounded-full ${getAccuracyColor(subject.accuracy)}`}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {subject.correctAnswers}/{subject.totalQuestions} correct · {subject.testsCount} test{subject.testsCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Personalized Study Plan */}
                <div className="rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/10 p-4">
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Your Personalized Plan
                  </h4>
                  <div className="space-y-2.5">
                    {studyPlan.thisWeek.map((task, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-5 h-5 rounded-full border-2 border-primary/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[9px] font-bold text-primary">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium leading-snug">{task.description}</p>
                          <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px]">{task.duration}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Weekly Goals Progress */}
                  <div className="mt-4 pt-3 border-t border-muted/30">
                    <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Weekly Goals</p>
                    <div className="space-y-2">
                      {studyPlan.goals.map((goal, idx) => {
                        const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
                        return (
                          <div key={idx} className="space-y-0.5">
                            <div className="flex justify-between text-[11px]">
                              <span>{goal.name}</span>
                              <span className="font-semibold tabular-nums">{goal.current}/{goal.target}</span>
                            </div>
                            <Progress value={pct} className="h-1.5" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Expandable Subject-Wise Analysis */}
        {expandedSection === "subjects" && (
          <motion.div
            key="subjects"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-blue-200/40 dark:border-blue-800/30">
              <h4 className="text-sm font-semibold mb-3">Subject-Wise Analysis</h4>
              {data.subjects.length === 0 ? (
                <p className="text-xs text-muted-foreground">No subject data yet. Take a test to see analysis.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {data.subjects.map((subject) => {
                    const status = getSubjectStatus(subject.accuracy);
                    return (
                      <Card key={subject.name} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${status.bg}`}>
                              <BookOpen className={`w-4 h-4 ${status.icon}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">{subject.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                {subject.totalQuestions} questions • {subject.testsCount} tests
                              </p>
                            </div>
                          </div>
                          <Badge variant={status.variant}>{subject.accuracy}%</Badge>
                        </div>

                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Accuracy</span>
                            <span className={status.text}>{status.label}</span>
                          </div>
                          <Progress value={subject.accuracy} className="h-2" />
                        </div>

                        <div className="bg-muted/50 rounded-lg p-2.5 mb-3">
                          <p className="text-xs font-medium mb-0.5 flex items-center gap-1">
                            <Lightbulb className="w-3 h-3 text-amber-500" />
                            AI Recommendation:
                          </p>
                          <p className="text-xs text-muted-foreground">{generateRecommendation(subject)}</p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => navigate("/custom-syllabus")}
                          >
                            <PlayCircle className="w-3.5 h-3.5 mr-1" />
                            Practice
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => navigate("/mock-tests")}
                          >
                            <Zap className="w-3.5 h-3.5 mr-1" />
                            Take Test
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AIInsightsPanel;
