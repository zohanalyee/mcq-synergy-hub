import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertCircle, Loader2, Award, Clock, SkipForward, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cleanQuestionText } from "@/lib/questionUtils";
import { resolveCorrectAnswer, checkUserAnswer, normalizeQuestion } from "@/lib/testEvaluation";
import { scorePracticeAnswers, mergeScoredIntoQuestions, isDbQuestionId } from "@/services/practiceScoringService";
import SmartFeedbackCard from "@/components/feedback/SmartFeedbackCard";
import { processTestCompletion } from "@/utils/gamification";
import { AICoachService } from "@/services/aiCoachService";
import ExamHeader from "@/components/exam/ExamHeader";
import QuestionCard from "@/components/exam/QuestionCard";
import QuestionPalette from "@/components/exam/QuestionPalette";
import ExamNavBar from "@/components/exam/ExamNavBar";
import NeuralFocusPlayer from "@/components/exam/NeuralFocusPlayer";
import { useExamMotivation } from "@/components/exam/useExamMotivation";
import { useExamPersistence } from "@/components/exam/useExamPersistence";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { JobTestRewardDialog } from "@/components/jobs/JobTestRewardDialog";
import { JobTestKeepGoingDialog } from "@/components/jobs/JobTestKeepGoingDialog";
import { recordJobTestProgress, jobTestIdFromTitle } from "@/services/jobTestProgressService";
import { useAuth } from "@/contexts/AuthContext";
import { GuestResultGate } from "@/components/quiz/GuestResultGate";
import { loadGuestSession } from "@/lib/guestSession";
import ResultAdviceCard from "@/components/shared/ResultAdviceCard";

type LastUsedTestContext = {
  subject?: string;
  topic?: string;
  subjects: string[];
  topics: string[];
  difficultyLevels: string[];
  questionCount: number;
  timeLimit: number;
  totalQuestions: number;
  returnPath?: string;
};

function extractTopicString(topics: any): string | null {
  if (!topics) return null;
  if (typeof topics === 'string') return topics;
  if (Array.isArray(topics)) {
    if (topics.length === 0) return null;
    if (typeof topics[0] === 'string') return topics[0];
    if (typeof topics[0] === 'object' && topics[0] !== null) {
      const first = topics[0];
      if (first.subject) return first.subject;
      if (first.topics && Array.isArray(first.topics) && first.topics.length > 0) return first.topics[0];
      if (first.name) return first.name;
    }
  }
  return null;
}

const TestSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [testData, setTestData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [isImproving, setIsImproving] = useState(false);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [syllabusSheetOpen, setSyllabusSheetOpen] = useState(false);
  const [jobReward, setJobReward] = useState<{ open: boolean; score: number; unlocked: number; delta: number } | null>(null);
  const [jobKeepGoing, setJobKeepGoing] = useState<{ open: boolean; score: number; weakTopics: string[] } | null>(null);

  const hasRestoredRef = useRef(false);
  const questionStartRef = useRef<number>(Date.now());
  const preTestAchievementsRef = useRef<Set<string> | null>(null);

  const locationState = location.state as { returnPath?: string } | null;

  const [lastUsedContext, setLastUsedContext] = useState<LastUsedTestContext>({
    subject: undefined,
    topic: undefined,
    subjects: [],
    topics: [],
    difficultyLevels: [],
    questionCount: 10,
    timeLimit: 30,
    totalQuestions: 0,
    returnPath: locationState?.returnPath || "/custom-syllabus",
  });

  const questions = testData?.questions || [];
  const displayTotal = questions.length;

  // Hooks
  const { onAnswer, markQuestionArrival, resetMotivation } = useExamMotivation({
    totalQuestions: displayTotal,
  });

  const { persistNow, restoreState, clearState } = useExamPersistence({
    sessionId: id,
    isSubmitted,
  });

  const normalizeStringArray = (value: any): string[] => {
    if (Array.isArray(value)) {
      return value.filter((v) => v != null && String(v).trim() !== "").map((v) => String(v).trim());
    }
    if (typeof value === "string" && value.trim()) return [value.trim()];
    return [];
  };

  // Fetch test session — single load, no polling
  useEffect(() => {
    const fetchTestSession = async () => {
      if (!id) { setError("No session ID provided"); setIsLoading(false); return; }
      try {
        let data: any = null;

        // GUEST PATH — sessions live only in sessionStorage (RLS forbids
        // anonymous inserts into custom_test_sessions).
        if (id.startsWith("guest-")) {
          data = loadGuestSession(id);
        } else {
          const { data: row, error: fetchError } = await supabase
            .from("custom_test_sessions").select("*").eq("id", id).maybeSingle();
          if (fetchError) throw fetchError;
          data = row;
        }

        if (!data) { setError("Test session not found"); setIsLoading(false); return; }

        const normalizedData = {
          ...data,
          questions: Array.isArray(data.questions)
            ? (data.questions as any[]).map(normalizeQuestion)
            : []
        };
        setTestData(normalizedData);
        const subjectsArr = normalizeStringArray(normalizedData.subjects);
        const topicsArr = normalizeStringArray(data.topics);
        const difficultyArr = normalizeStringArray(data.difficulty_levels);
        const safeTimeLimit = typeof data.time_limit === "number" ? data.time_limit : Number(data.time_limit) || 30;
        const safeTotalQuestions = normalizedData.questions.length;

        setLastUsedContext({
          subject: subjectsArr[0], topic: extractTopicString(data.topics) || topicsArr[0],
          subjects: subjectsArr, topics: topicsArr, difficultyLevels: difficultyArr,
          questionCount: safeTotalQuestions, timeLimit: safeTimeLimit,
          totalQuestions: safeTotalQuestions, returnPath: locationState?.returnPath || "/custom-syllabus",
        });

        setTimeRemaining(safeTimeLimit * 60);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching test session:", err);
        setError("Failed to load test session");
        setIsLoading(false);
        toast.error("Failed to load test session");
      }
    };
    fetchTestSession();
  }, [id, locationState?.returnPath]);

  // Restore persisted state after test data loads
  useEffect(() => {
    if (testData && !isLoading && !hasRestoredRef.current) {
      hasRestoredRef.current = true;
      const saved = restoreState();
      if (saved) {
        setCurrentQuestion(saved.currentQuestion);
        setAnswers(saved.answers);
        setFlaggedQuestions(new Set(saved.flaggedQuestions));
        if (saved.timeRemaining > 0) setTimeRemaining(saved.timeRemaining);
      }
    }
  }, [testData, isLoading, restoreState]);

  // Timer with 10-second warning
  useEffect(() => {
    if (timeRemaining <= 0 || isSubmitted) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === 11) {
          toast.warning("⏰ 10 seconds remaining!", { duration: 3000, position: "bottom-center" });
        }
        if (prev <= 1) { handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitted]);

  // Persist state on every change
  useEffect(() => {
    if (testData && !isSubmitted) {
      persistNow({ currentQuestion, answers, flaggedQuestions, timeRemaining });
    }
  }, [currentQuestion, answers, flaggedQuestions, testData, isSubmitted, persistNow, timeRemaining]);

  // Mark question arrival for speed detection + reset per-question timer
  useEffect(() => {
    markQuestionArrival();
    questionStartRef.current = Date.now();
  }, [currentQuestion, markQuestionArrival]);

  // Snapshot pre-test achievements once user is known, so we can detect new unlocks
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !alive) return;
        const list = await AICoachService.getAchievements(user.id);
        if (alive) preTestAchievementsRef.current = new Set(list.filter((a) => a.unlocked).map((a) => a.id));
      } catch {
        /* ignore */
      }
    })();
    return () => { alive = false; };
  }, []);

  // Syllabus tracker data
  const syllabusMap = useMemo(() => {
    if (!questions.length) return [];
    const subjectMap = new Map<string, { name: string; total: number; attempted: number; isCurrent: boolean }>();
    questions.forEach((q: any, index: number) => {
      const subjectName = q.subject || "General";
      const existing = subjectMap.get(subjectName) || { name: subjectName, total: 0, attempted: 0, isCurrent: false };
      existing.total++;
      if (answers[index] !== undefined) existing.attempted++;
      if (index === currentQuestion) existing.isCurrent = true;
      subjectMap.set(subjectName, existing);
    });
    return Array.from(subjectMap.values());
  }, [questions, answers, currentQuestion]);

  // Loading skeleton
  if (isLoading) {
    return (
      <Header>
        <div className="max-w-5xl mx-auto px-3 sm:px-4 pt-2 test-container">
          <div className="mb-2">
            <Skeleton className="h-12 w-full rounded-2xl mb-2" />
            <Skeleton className="h-1.5 w-full" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-48 w-64 rounded-2xl hidden lg:block" />
          </div>
        </div>
      </Header>
    );
  }

  // Error state
  if (error || !testData) {
    return (
      <Header>
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
              <h2 className="text-xl font-bold mb-2">Test Not Found</h2>
              <p className="text-muted-foreground text-sm mb-4">
                {error || "The test session doesn't exist or has been removed."}
              </p>
              <Button onClick={() => navigate("/custom-syllabus")}>Create a New Quiz</Button>
            </CardContent>
          </Card>
        </div>
      </Header>
    );
  }

  // Handlers
  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
    const newAnsweredCount = Object.keys({ ...answers, [questionIndex]: answer }).length;
    onAnswer(newAnsweredCount, questionIndex);
  };

  const toggleFlag = (questionIndex: number) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) newSet.delete(questionIndex);
      else newSet.add(questionIndex);
      return newSet;
    });
  };

  const resolveAnswer = (question: any): string => resolveCorrectAnswer(question);
  const checkAnswer = (question: any, userAnswer: string | undefined): boolean => checkUserAnswer(question, userAnswer);

  const handleSubmit = async () => {
    console.log('=== TEST SUBMISSION DEBUG ===');
    let correctAnswers = 0;
    const attemptRecords: { question: any; isCorrect: boolean }[] = [];
    questions.forEach((question: any, index: number) => {
      const userAns = answers[index];
      const resolvedAns = resolveAnswer(question);
      const isCorrect = checkAnswer(question, userAns);

      console.log(`Q${index + 1}:`, {
        rawAnswer: question.answer,
        resolvedAnswer: resolvedAns,
        userAnswer: userAns,
        optionsType: Array.isArray(question.options) ? 'array' : typeof question.options,
        options: question.options,
        isCorrect
      });

      if (isCorrect) correctAnswers++;
      // Only track questions the user actually attempted
      if (userAns !== undefined) attemptRecords.push({ question, isCorrect });
    });
    console.log(`=== RESULT: ${correctAnswers}/${questions.length} ===`);

    setScore(correctAnswers);
    setIsSubmitted(true);
    clearState();

    // AI Coach: track each attempted question (non-blocking, errors swallowed)
    // Derive test_type from session_name pattern
    const sessionName: string = testData?.session_name || "";
    const testType: "job_test" | "subject_test" | "syllabus" | "practice" =
      sessionName.startsWith("Job Test:") ? "job_test"
      : sessionName.startsWith("Subject:") ? "subject_test"
      : sessionName.toLowerCase().includes("syllabus") ? "syllabus"
      : "practice";
    const sessionId: string | null = testData?.id || id || null;
    // Average time per attempted question (best-effort: total elapsed / attempted count)
    const totalElapsed = (testData?.time_limit ?? 30) * 60 - timeRemaining;
    const avgTimePerQ = attemptRecords.length > 0 ? Math.max(1, Math.round(totalElapsed / attemptRecords.length)) : 0;

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        for (const { question, isCorrect } of attemptRecords) {
          const text = question.question || question.title || "";
          const subj = question.subject || "General";
          const topic = question.topic || "";
          const qid = typeof question.id === "string" ? question.id : null;
          const diff = (question.difficulty || "medium").toString();
          // Phase 3: detailed tracking (also updates Phase 1 aggregate internally)
          AICoachService.trackAttemptDetailed(
            user.id, sessionId, text, qid, subj, topic, diff, isCorrect, avgTimePerQ, testType
          ).catch((e) => console.error("[AICoach] trackDetailed failed:", e));
        }
        // Phase 2: suggest a single retry topic if any are due
        AICoachService.getTopicsNeedingRetry(user.id, 1)
          .then((rows) => {
            const r = rows[0];
            if (r) {
              toast.info(`Tip: revisit ${r.topic} (last seen ${r.daysAgo}d ago)`, { duration: 6000 });
            }
          })
          .catch(() => {});
        // Phase 3: detect newly-unlocked achievements
        setTimeout(() => {
          AICoachService.getAchievements(user.id)
            .then((list) => {
              const before = preTestAchievementsRef.current ?? new Set<string>();
              const justUnlocked = list.filter((a) => a.unlocked && !before.has(a.id));
              if (justUnlocked.length > 0) {
                const a = justUnlocked[0];
                toast.success(`🏆 Achievement unlocked: ${a.title}`, {
                  description: a.description,
                  duration: 7000,
                });
              }
            })
            .catch(() => {});
        }, 1500); // brief delay so aggregate writes settle
      } catch (e) {
        console.error("[AICoach] tracking batch failed:", e);
      }
    })();

    const timeTaken = testData.time_limit * 60 - timeRemaining;
    const questionIds = questions.map((q: any) => q.id).filter(Boolean);
    
    let subjects = testData.subjects || [];
    if (Array.isArray(subjects)) subjects = subjects.filter(Boolean);
    if (subjects.length === 0 && questions.length > 0) {
      subjects = [...new Set(questions.map((q: any) => q.subject).filter(Boolean))];
    }
    
    const result = await processTestCompletion({
      score: correctAnswers, totalQuestions: questions.length, timeTaken,
      testType: "custom_quiz", subjects, answers,
      questionIds,
    });

    if (result.newBadges.length > 0) {
      toast.success(`🏆 New Badge: ${result.newBadges[0].name}!`, { description: result.newBadges[0].description });
    } else {
      toast.success("Test submitted successfully!", { description: `You scored ${correctAnswers}/${questions.length}` });
    }

    // Phase 3: record job test progress (uses sessionName "Job Test: {title}" convention)
    if (sessionName.startsWith("Job Test:")) {
      const jobTitle = sessionName.replace(/^Job Test:\s*/, "").trim();
      const jobTestId = jobTestIdFromTitle(jobTitle);
      const scorePct = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;

      // Compute weak topics: subjects with <70% in this attempt
      const subjectStats = new Map<string, { correct: number; total: number }>();
      questions.forEach((q: any, i: number) => {
        const subj = q.subject || q.topic || "General";
        const s = subjectStats.get(subj) || { correct: 0, total: 0 };
        s.total += 1;
        if (checkAnswer(q, answers[i])) s.correct += 1;
        subjectStats.set(subj, s);
      });
      const weakTopics = Array.from(subjectStats.entries())
        .filter(([, s]) => s.total > 0 && s.correct / s.total < 0.7)
        .map(([k]) => k);

      // Record job-test progress for both guests (by IP) and logged-in users.
      // The edge function uses service-role internally, so guests don't hit RLS.
      const prog = await recordJobTestProgress(jobTestId, scorePct, weakTopics);
      if (prog) {
        if (prog.qualified) {
          setJobReward({ open: true, score: scorePct, unlocked: prog.unlocked, delta: prog.unlocked_delta || 0 });
        } else {
          setJobKeepGoing({ open: true, score: scorePct, weakTopics });
        }
      }
    }
  };

  const handleRetry = () => {
    const originalTimeLimit = lastUsedContext.timeLimit || testData?.time_limit || 30;
    setCurrentQuestion(0); setScore(0); setIsSubmitted(false);
    setAnswers({}); setFlaggedQuestions(new Set());
    setTimeRemaining(originalTimeLimit * 60);
    resetMotivation();
    toast.info("Test reset! Good luck on your retry.");
  };

  const handleGenerateNew = async () => {
    navigate(lastUsedContext.returnPath || "/custom-syllabus");
  };

  const handleImprove = async () => {
    navigate(lastUsedContext.returnPath || "/custom-syllabus");
  };

  const handleCreateAnother = () => {
    navigate(lastUsedContext.returnPath || "/custom-syllabus");
  };

  const progress = ((currentQuestion + 1) / displayTotal) * 100;
  const answeredCount = Object.keys(answers).length;
  const canSubmit = true; // Session is always complete when created

  const getSourceBadge = () => {
    const source = testData?.source;
    if (source === 'cache') return { icon: '⚡', text: 'From Bank', variant: 'default' as const };
    if (source === 'cache_partial') return { icon: '⏳', text: 'Partial + Loading', variant: 'secondary' as const };
    if (source === 'hybrid') return { icon: '🔀', text: 'Mixed', variant: 'secondary' as const };
    if (source === 'ai') return { icon: '🤖', text: 'AI Generated', variant: 'outline' as const };
    return null;
  };

  const sourceBadge = getSourceBadge();

  return (
    <Header>
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-0 pb-2 test-container">
        {!isSubmitted ? (
          questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <AlertCircle className="w-10 h-10 text-destructive" />
              <h2 className="text-xl font-semibold">No Questions Available</h2>
              <p className="text-muted-foreground max-w-md">
                This test session has no questions. Please go back and try again.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate(locationState?.returnPath || '/mock-tests')}
              >
                ← Go Back
              </Button>
            </div>
          ) : (
          <>
            {/* Exam Header */}
            <ExamHeader
              sessionName={testData.session_name}
              currentQuestion={currentQuestion}
              totalQuestions={questions.length}
              answeredCount={answeredCount}
              timeRemaining={timeRemaining}
              progress={progress}
              isLoadingMore={false}
              remainingCount={0}
              sourceBadge={sourceBadge}
              isMusicOpen={isMusicOpen}
              onToggleMusic={() => setIsMusicOpen((prev) => !prev)}
            />

            {/* Music Player (collapsible) */}
            <NeuralFocusPlayer isOpen={isMusicOpen} />

            {/* Mobile Syllabus Map Button */}
            {syllabusMap.length > 0 && (
              <div className="lg:hidden mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs gap-1.5"
                  onClick={() => setSyllabusSheetOpen(true)}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Syllabus Map
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 ml-auto">
                    {Object.keys(answers).length}/{questions.length}
                  </Badge>
                </Button>
              </div>
            )}

            {/* Mobile Syllabus Sheet */}
            <Sheet open={syllabusSheetOpen} onOpenChange={setSyllabusSheetOpen}>
              <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
                <SheetTitle className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                  <BookOpen className="h-4 w-4" />
                  Syllabus Map
                </SheetTitle>
                <div className="space-y-3">
                  {syllabusMap.map((subject) => {
                    const pct = subject.total > 0 ? Math.round((subject.attempted / subject.total) * 100) : 0;
                    return (
                      <div key={subject.name} className={`p-2.5 rounded-lg border transition-colors ${subject.isCurrent ? "border-primary/50 bg-primary/5" : "border-border/30"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{subject.name}</span>
                          {subject.isCurrent && (
                            <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4">Now</Badge>
                          )}
                        </div>
                        <Progress value={pct} className="h-1.5" />
                        <p className="text-xs text-muted-foreground mt-1">{subject.attempted}/{subject.total} done</p>
                      </div>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>

            {/* Three-column layout: Syllabus + Question + Palette */}
            <div className="flex gap-4 flex-1 min-h-0">
              {/* Syllabus Tracker Sidebar (desktop only) */}
              <div className="hidden lg:block w-56 shrink-0">
                <Card className="sticky top-4">
                  <CardContent className="p-3">
                    <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      Syllabus Map
                    </h4>
                    <div className="space-y-3">
                      {syllabusMap.map((subject) => {
                        const pct = subject.total > 0 ? Math.round((subject.attempted / subject.total) * 100) : 0;
                        return (
                          <div key={subject.name} className={`p-2 rounded-lg border transition-colors ${subject.isCurrent ? "border-primary/50 bg-primary/5" : "border-border/30"}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium truncate">{subject.name}</span>
                              {subject.isCurrent && (
                                <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4">Now</Badge>
                              )}
                            </div>
                            <Progress value={pct} className="h-1.5" />
                            <p className="text-[10px] text-muted-foreground mt-1">{subject.attempted}/{subject.total} done</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Main question area */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex-1 overflow-y-auto min-h-0 pb-2 scrollbar-thin">
                  {(() => {
                    const blurbSubject =
                      questions[currentQuestion]?.subject ||
                      questions[currentQuestion]?.topic ||
                      testData?.session_name ||
                      'these';
                    return (
                      <p className="text-sm text-muted-foreground mb-3 ml-1 leading-relaxed max-w-3xl">
                        You are practicing {blurbSubject} multiple-choice questions designed for
                        Pakistani competitive and board exam preparation. Each question includes the
                        correct answer and explanation so you can learn as you go. Use this practice
                        test to assess your knowledge and track your progress.
                      </p>
                    );
                  })()}
                  <Badge variant="secondary" className="mb-2 ml-1">
                    Section: {questions[currentQuestion]?.subject || questions[currentQuestion]?.topic || 'General'}
                  </Badge>
                  <QuestionCard
                    question={questions[currentQuestion]}
                    questionIndex={currentQuestion}
                    selectedAnswer={answers[currentQuestion]}
                    isFlagged={flaggedQuestions.has(currentQuestion)}
                    onSelectAnswer={handleAnswerChange}
                    onToggleFlag={toggleFlag}
                  />
                </div>

                {/* Bottom Navigation */}
                <ExamNavBar
                  currentQuestion={currentQuestion}
                  totalQuestions={questions.length}
                  canSubmit={canSubmit}
                  remainingCount={0}
                  isFlagged={flaggedQuestions.has(currentQuestion)}
                  onPrevious={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                  onNext={() => setCurrentQuestion((prev) => Math.min(questions.length - 1, prev + 1))}
                  onToggleFlag={() => toggleFlag(currentQuestion)}
                  onSubmit={handleSubmit}
                  paletteButton={
                    <QuestionPalette
                      totalQuestions={questions.length}
                      currentQuestion={currentQuestion}
                      answers={answers}
                      flaggedQuestions={flaggedQuestions}
                      onNavigate={setCurrentQuestion}
                    />
                  }
                />
              </div>

              {/* Desktop sidebar palette */}
              <div className="hidden lg:block">
                <QuestionPalette
                  totalQuestions={questions.length}
                  currentQuestion={currentQuestion}
                  answers={answers}
                  flaggedQuestions={flaggedQuestions}
                  onNavigate={setCurrentQuestion}
                />
              </div>
            </div>
          </>
          )
        ) : (
          /* Results */
          (() => {
            const totalQ = questions.length;
            const attemptedQ = Object.keys(answers).length;
            const correctCount = questions.filter((q: any, i: number) => checkAnswer(q, answers[i])).length;
            const wrongCount = attemptedQ - correctCount;
            const skippedCount = totalQ - attemptedQ;
            const percentage = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
            const passingPercent = 50;
            const isPassed = percentage >= passingPercent;
            const timeTaken = testData.time_limit * 60 - timeRemaining;
            const minutes = Math.floor(timeTaken / 60);
            const seconds = timeTaken % 60;

            // Guests get a single bilingual sign-in gate instead of the full
            // premium results screen / analytics / answer review.
            if (!user) {
              return (
                <GuestResultGate
                  open={true}
                  onClose={() => navigate(lastUsedContext.returnPath || "/mock-tests")}
                  score={correctCount}
                  total={totalQ}
                  correctCount={correctCount}
                  returnPath={lastUsedContext.returnPath || "/mock-tests"}
                />
              );
            }

            return (
              <div className="space-y-4">
                {/* Pass/Fail Banner */}
                <Card className={`border-2 ${isPassed ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
                  <CardContent className="py-6 text-center">
                    {isPassed ? (
                      <>
                        <Award className="h-14 w-14 text-green-500 mx-auto mb-3" />
                        <h1 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">Congratulations! 🎉</h1>
                        <p className="text-green-600/80 dark:text-green-400/80">You passed the test!</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-14 w-14 text-red-500 mx-auto mb-3" />
                        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">Keep Trying! 💪</h1>
                        <p className="text-red-600/80 dark:text-red-400/80">You need {passingPercent}% to pass. Review and try again!</p>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Score + Stats */}
                <Card>
                  <CardContent className="py-5 text-center">
                    <h2 className="text-lg font-semibold mb-1">{testData.session_name || 'Test'}</h2>
                    <div className="text-5xl font-bold text-primary my-2">{percentage}%</div>
                    <p className="text-muted-foreground text-sm">{correctCount} / {totalQ} correct</p>
                    <Badge variant={isPassed ? "default" : "destructive"} className="mt-2">
                      {isPassed ? "PASSED" : "FAILED"}
                    </Badge>
                  </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: CheckCircle, label: 'Correct', value: correctCount, cls: 'text-green-500' },
                    { icon: XCircle, label: 'Wrong', value: wrongCount, cls: 'text-red-500' },
                    { icon: SkipForward, label: 'Skipped', value: skippedCount, cls: 'text-amber-500' },
                    { icon: Clock, label: 'Time', value: `${minutes}m ${seconds}s`, cls: 'text-blue-500' },
                  ].map((s, i) => (
                    <Card key={i}>
                      <CardContent className="py-3 text-center px-1">
                        <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.cls}`} />
                        <div className="text-lg font-bold">{s.value}</div>
                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <ResultAdviceCard
                  name={(user?.user_metadata as any)?.full_name || user?.email?.split('@')[0]}
                  score={percentage}
                  subject={(testData as any)?.subject || (testData as any)?.session_name}
                  topic={(testData as any)?.topic}
                  isGuest={!user}
                />

                <SmartFeedbackCard
                  score={score}
                  totalQuestions={totalQ}
                  timeTaken={timeTaken}
                  subjects={testData.subjects || []}
                  testType="custom_quiz"
                  onRetry={handleRetry}
                  onGenerateNew={handleGenerateNew}
                  onImprove={handleImprove}
                  isImproving={isImproving}
                />

                {/* Answer Review */}
                <div className="space-y-3 text-left">
                  <h3 className="text-lg font-semibold">Review Answers</h3>
                  {questions.map((question: any, index: number) => {
                    const userAnswer = answers[index];
                    const isCorrect = checkAnswer(question, userAnswer);
                    const correctText = resolveAnswer(question);
                    const explanation = question.explanation;
                    return (
                      <Alert key={index} className={isCorrect ? "border-green-500" : "border-red-500"}>
                        <div className="flex items-start gap-2">
                          {isCorrect ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <Badge variant="outline" className="mb-1 text-[10px]">
                              Section: {question.subject || question.topic || 'General'}
                            </Badge>
                            <p className="font-medium text-sm mb-1 break-words">
                              Q{index + 1}: {cleanQuestionText(question.question)}
                            </p>
                            <p className="text-xs">
                              <span className="font-medium">Your answer:</span> {userAnswer || "Not answered"}
                            </p>
                            <p className="text-xs text-green-600">
                              <span className="font-medium">Correct:</span> {correctText}
                            </p>
                            {explanation && (
                              <div className={`mt-2 p-2.5 rounded-md text-xs ${isCorrect ? "bg-blue-500/10 border border-blue-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
                                <p className={`font-semibold mb-0.5 flex items-center gap-1 ${isCorrect ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"}`}>
                                  <BookOpen className="h-3 w-3" />
                                  {isCorrect ? "Why this is correct:" : "Explanation:"}
                                </p>
                                <p className="text-muted-foreground leading-relaxed">{explanation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Alert>
                    );
                  })}
                </div>

                <div className="flex gap-3 justify-center flex-wrap">
                  <Button size="sm" onClick={handleCreateAnother}>Create Another Quiz</Button>
                  <button
                    onClick={() => navigate('/analytics')}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-full text-sm font-medium"
                  >
                    📊 AI Coach — View Full Analysis
                  </button>
                </div>
              </div>
            );
          })()
        )}
      </div>
      {jobReward && (
        <JobTestRewardDialog
          open={jobReward.open}
          score={jobReward.score}
          unlocked={jobReward.unlocked}
          unlockedDelta={jobReward.delta}
          onClose={() => setJobReward(null)}
          onContinue={() => { setJobReward(null); navigate("/mock-tests"); }}
        />
      )}
      {jobKeepGoing && (
        <JobTestKeepGoingDialog
          open={jobKeepGoing.open}
          score={jobKeepGoing.score}
          weakTopics={jobKeepGoing.weakTopics}
          onClose={() => setJobKeepGoing(null)}
          onPracticeWeak={() => { setJobKeepGoing(null); navigate("/mock-tests"); }}
          onRetry={() => { setJobKeepGoing(null); handleRetry(); }}
        />
      )}
    </Header>
  );
};

export default TestSession;
