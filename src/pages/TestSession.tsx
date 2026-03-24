import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, AlertCircle, Loader2, Award, Clock, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cleanQuestionText } from "@/lib/questionUtils";
import SmartFeedbackCard from "@/components/feedback/SmartFeedbackCard";
import { processTestCompletion } from "@/utils/gamification";
import ExamHeader from "@/components/exam/ExamHeader";
import QuestionCard from "@/components/exam/QuestionCard";
import QuestionPalette from "@/components/exam/QuestionPalette";
import ExamNavBar from "@/components/exam/ExamNavBar";
import NeuralFocusPlayer from "@/components/exam/NeuralFocusPlayer";
import { useExamMotivation } from "@/components/exam/useExamMotivation";
import { useExamPersistence } from "@/components/exam/useExamPersistence";

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

  // Smart Background Loading state
  const [expectedTotal, setExpectedTotal] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [remainingCount, setRemainingCount] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollAttemptsRef = useRef(0);
  const MAX_POLL_ATTEMPTS = 15;
  const hasRestoredRef = useRef(false);

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
  const displayTotal = expectedTotal > 0 ? Math.max(expectedTotal, questions.length) : questions.length;

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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Background fetch for remaining questions
  const pollForMoreQuestions = useCallback(async () => {
    if (!testData || remainingCount <= 0 || pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setIsLoadingMore(false);
      return;
    }

    pollAttemptsRef.current += 1;
    const currentQuestionCount = testData.questions?.length || 0;
    const topicForPolling = extractTopicString(testData.topics) ||
      testData.subjects?.[0] ||
      testData.session_name?.replace(/^(Job Test:|Test:)\s*/, '') ||
      null;
    const difficultyForPolling = testData.difficulty_levels?.[0] || "Medium";

    if (!topicForPolling) {
      if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
      setIsLoadingMore(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("generate-test", {
        body: { topic: topicForPolling, difficulty: difficultyForPolling, question_count: expectedTotal, fetch_only: true },
      });
      if (error) return;

      if (data?.questions && data.questions.length > currentQuestionCount) {
        const existingQuestions = testData.questions || [];
        const existingQuestionTexts = new Set(existingQuestions.map((q: any) => q.question));
        const newQuestions = data.questions.filter((q: any) => !existingQuestionTexts.has(q.question));

        if (newQuestions.length > 0) {
          setTestData((prev: any) => ({ ...prev, questions: [...(prev?.questions || []), ...newQuestions] }));
          const newTotal = currentQuestionCount + newQuestions.length;
          const newRemaining = Math.max(0, expectedTotal - newTotal);
          setRemainingCount(newRemaining);

          if (newRemaining > 0) {
            toast.info(`Loaded ${newQuestions.length} more questions`, { duration: 2000 });
          } else {
            toast.success(`All ${expectedTotal} questions loaded!`, { duration: 3000 });
            if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
            setIsLoadingMore(false);
          }
        }
      }
    } catch { /* silent */ }
  }, [testData, remainingCount, expectedTotal]);

  // Start polling when we have remaining questions
  useEffect(() => {
    if (remainingCount > 0 && !isSubmitted && !pollIntervalRef.current) {
      setIsLoadingMore(true);
      pollAttemptsRef.current = 0;
      const initialTimeout = setTimeout(() => {
        pollForMoreQuestions();
        pollIntervalRef.current = setInterval(pollForMoreQuestions, 3000);
      }, 3000);
      return () => {
        clearTimeout(initialTimeout);
        if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
      };
    }
  }, [remainingCount, isSubmitted, pollForMoreQuestions]);

  // Fetch test session
  useEffect(() => {
    const fetchTestSession = async () => {
      if (!id) { setError("No session ID provided"); setIsLoading(false); return; }
      try {
        const { data, error: fetchError } = await supabase
          .from("custom_test_sessions").select("*").eq("id", id).maybeSingle();
        if (fetchError) throw fetchError;
        if (!data) { setError("Test session not found"); setIsLoading(false); return; }

        setTestData(data);
        const subjectsArr = normalizeStringArray(data.subjects);
        const topicsArr = normalizeStringArray(data.topics);
        const difficultyArr = normalizeStringArray(data.difficulty_levels);
        const safeQuestionCount = typeof data.question_count === "number" ? data.question_count : Number(data.question_count) || 10;
        const safeTimeLimit = typeof data.time_limit === "number" ? data.time_limit : Number(data.time_limit) || 30;
        const safeTotalQuestions = Array.isArray(data.questions) ? data.questions.length : 0;

        setExpectedTotal(safeQuestionCount);
        setRemainingCount(Math.max(0, safeQuestionCount - safeTotalQuestions));

        setLastUsedContext({
          subject: subjectsArr[0], topic: extractTopicString(data.topics) || topicsArr[0],
          subjects: subjectsArr, topics: topicsArr, difficultyLevels: difficultyArr,
          questionCount: safeQuestionCount, timeLimit: safeTimeLimit,
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

  // Mark question arrival for speed detection
  useEffect(() => {
    markQuestionArrival();
  }, [currentQuestion, markQuestionArrival]);

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

  const handleSubmit = async () => {
    let correctAnswers = 0;
    questions.forEach((question: any, index: number) => {
      const userAns = (answers[index] || '').trim().toLowerCase();
      const correctAns = (question.answer || '').trim().toLowerCase();
      // Also check if answer is a letter key (A/B/C/D) that maps to an option
      let resolvedCorrectAns = correctAns;
      if (['a','b','c','d'].includes(correctAns) && question.options) {
        const opts = Array.isArray(question.options) ? question.options : Object.values(question.options || {});
        const idx = correctAns.charCodeAt(0) - 97; // a=0, b=1, etc.
        if (opts[idx]) resolvedCorrectAns = String(opts[idx]).trim().toLowerCase();
      }
      if (userAns && (userAns === correctAns || userAns === resolvedCorrectAns)) correctAnswers++;
    });

    setScore(correctAnswers);
    setIsSubmitted(true);
    clearState();

    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    setIsLoadingMore(false);

    const timeTaken = testData.time_limit * 60 - timeRemaining;
    const questionIds = questions.map((q: any) => q.id).filter(Boolean);
    
    // Extract subjects: prefer session subjects, fallback to extracting from questions
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
    toast.error("AI Quiz Generation Temporarily Unavailable", {
      description: "New quiz generation is paused. Please start a new test from Custom Syllabus or Quizzes page.",
    });
  };

  const handleImprove = async () => {
    toast.error("AI Improvement Quiz Temporarily Unavailable", {
      description: "This feature is paused while we upgrade our AI system. Please start a new test from Custom Syllabus.",
    });
  };

  const handleCreateAnother = () => {
    navigate(lastUsedContext.returnPath || "/custom-syllabus");
  };

  const progress = ((currentQuestion + 1) / displayTotal) * 100;
  const answeredCount = Object.keys(answers).length;
  const allQuestionsLoaded = remainingCount === 0;
  const canSubmit = allQuestionsLoaded || questions.length >= expectedTotal;

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
      <div className="max-w-5xl mx-auto px-3 sm:px-4 pt-0 pb-2 test-container">
        {!isSubmitted ? (
          <>
            {/* Exam Header */}
            <ExamHeader
              sessionName={testData.session_name}
              currentQuestion={currentQuestion}
              totalQuestions={questions.length}
              answeredCount={answeredCount}
              timeRemaining={timeRemaining}
              progress={progress}
              isLoadingMore={isLoadingMore}
              remainingCount={remainingCount}
              sourceBadge={sourceBadge}
              isMusicOpen={isMusicOpen}
              onToggleMusic={() => setIsMusicOpen((prev) => !prev)}
            />

            {/* Music Player (collapsible) */}
            <NeuralFocusPlayer isOpen={isMusicOpen} />

            {/* Two-column layout: Question + Palette */}
            <div className="flex gap-4 flex-1 min-h-0">
              {/* Main question area */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex-1 overflow-y-auto min-h-0 pb-2 scrollbar-thin">
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
                  remainingCount={remainingCount}
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
        ) : (
          /* Results */
          (() => {
            const totalQ = questions.length;
            const attemptedQ = Object.keys(answers).length;
            const correctCount = questions.filter((q: any, i: number) => {
              const userAns = (answers[i] || '').trim().toLowerCase();
              const correctAns = (q.answer || '').trim().toLowerCase();
              let resolved = correctAns;
              if (['a','b','c','d'].includes(correctAns) && q.options) {
                const opts = Array.isArray(q.options) ? q.options : Object.values(q.options || {});
                const idx = correctAns.charCodeAt(0) - 97;
                if (opts[idx]) resolved = String(opts[idx]).trim().toLowerCase();
              }
              return userAns && (userAns === correctAns || userAns === resolved);
            }).length;
            const wrongCount = attemptedQ - correctCount;
            const skippedCount = totalQ - attemptedQ;
            const percentage = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
            const passingPercent = 50;
            const isPassed = percentage >= passingPercent;
            const timeTaken = testData.time_limit * 60 - timeRemaining;
            const minutes = Math.floor(timeTaken / 60);
            const seconds = timeTaken % 60;

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
                    const isCorrect = userAnswer === question.answer;
                    return (
                      <Alert key={index} className={isCorrect ? "border-green-500" : "border-red-500"}>
                        <div className="flex items-start gap-2">
                          {isCorrect ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm mb-1 break-words">
                              Q{index + 1}: {cleanQuestionText(question.question)}
                            </p>
                            <p className="text-xs">
                              <span className="font-medium">Your answer:</span> {userAnswer || "Not answered"}
                            </p>
                            <p className="text-xs text-green-600">
                              <span className="font-medium">Correct:</span> {question.answer}
                            </p>
                          </div>
                        </div>
                      </Alert>
                    );
                  })}
                </div>

                <div className="flex gap-3 justify-center flex-wrap">
                  <Button size="sm" onClick={handleCreateAnother}>Create Another Quiz</Button>
                  <Button size="sm" variant="outline" onClick={() => navigate("/analytics")}>AI Coach</Button>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </Header>
  );
};

export default TestSession;
