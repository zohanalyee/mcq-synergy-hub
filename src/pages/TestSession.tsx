import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle, XCircle, ArrowRight, ArrowLeft, Flag, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SmartFeedbackCard from "@/components/feedback/SmartFeedbackCard";
import { processTestCompletion } from "@/utils/gamification";

type LastUsedTestContext = {
  subject?: string;
  topic?: string;
  subjects: string[];
  topics: string[];
  difficultyLevels: string[];
  questionCount: number;
  timeLimit: number;
  totalQuestions: number;
};

const TestSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [testData, setTestData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  
  // Smart Background Loading state
  const [totalExpected, setTotalExpected] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [remainingCount, setRemainingCount] = useState(0);

  // Persist the context of the just-finished test so "Practice New Questions" never falls back to defaults.
  const [, setLastUsedContext] = useState<LastUsedTestContext>({
    subject: undefined,
    topic: undefined,
    subjects: [],
    topics: [],
    difficultyLevels: [],
    questionCount: 10,
    timeLimit: 30,
    totalQuestions: 0,
  });

  const normalizeStringArray = (value: any): string[] => {
    if (Array.isArray(value)) {
      return value
        .filter((v) => v != null && String(v).trim() !== "")
        .map((v) => String(v).trim());
    }
    if (typeof value === "string" && value.trim()) return [value.trim()];
    return [];
  };

  // Background fetch for remaining questions
  const fetchRemainingQuestions = async (topic: string, difficulty: string, count: number, currentData: any) => {
    try {
      console.log(`🔄 Fetching ${count} remaining questions in background...`);
      
      const { data, error } = await supabase.functions.invoke("generate-test", {
        body: {
          topic,
          difficulty,
          question_count: count,
          forceNew: false, // Use cache first
        },
      });

      if (error) {
        console.error("Background fetch error:", error);
        setIsLoadingMore(false);
        return;
      }

      if (data?.questions && data.questions.length > 0) {
        // Seamlessly append new questions to existing ones
        setTestData((prev: any) => {
          const existingQuestions = prev?.questions || [];
          const newQuestions = data.questions.filter((q: any) => 
            !existingQuestions.some((eq: any) => eq.question === q.question)
          );
          
          console.log(`✅ Appended ${newQuestions.length} new questions`);
          
          return {
            ...prev,
            questions: [...existingQuestions, ...newQuestions]
          };
        });
        
        setRemainingCount(0);
        toast.success(`Loaded ${data.questions.length} more questions`, { duration: 2000 });
      }
    } catch (err) {
      console.error("Background fetch failed:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const fetchTestSession = async () => {
      if (!id) {
        setError("No session ID provided");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("custom_test_sessions")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data) {
          setError("Test session not found");
          setIsLoading(false);
          return;
        }

        setTestData(data);

        const subjectsArr = normalizeStringArray(data.subjects);
        const topicsArr = normalizeStringArray(data.topics);
        const difficultyArr = normalizeStringArray(data.difficulty_levels);
        const safeQuestionCount = typeof data.question_count === "number" ? data.question_count : Number(data.question_count) || 10;
        const safeTimeLimit = typeof data.time_limit === "number" ? data.time_limit : Number(data.time_limit) || 30;
        const safeTotalQuestions = Array.isArray(data.questions) ? data.questions.length : 0;
        
        // Set expected total (use question_count as the total expected)
        const expectedTotal = safeQuestionCount;
        setTotalExpected(expectedTotal);
        
        // Check if we got partial data (fewer questions than expected)
        const remaining = Math.max(0, expectedTotal - safeTotalQuestions);
        setRemainingCount(remaining);
        
        // Start background fetch if there are remaining questions
        if (remaining > 0 && topicsArr[0]) {
          setIsLoadingMore(true);
          fetchRemainingQuestions(topicsArr[0], difficultyArr[0] || "Medium", remaining, data);
        }

        // Persist context for "Practice New Questions" (robust against missing topics array)
        setLastUsedContext({
          subject: subjectsArr[0],
          topic: topicsArr[0],
          subjects: subjectsArr,
          topics: topicsArr,
          difficultyLevels: difficultyArr,
          questionCount: safeQuestionCount,
          timeLimit: safeTimeLimit,
          totalQuestions: safeTotalQuestions,
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
  }, [id]);

  useEffect(() => {
    if (timeRemaining <= 0 || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isSubmitted]);

  if (isLoading) {
    return (
      <Header>
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
          <div className="mb-6 text-center">
            <Skeleton className="h-8 w-48 mx-auto mb-3" />
            <div className="flex gap-3 justify-center">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-2 w-full mt-3" />
          </div>
          <Card>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <div className="space-y-2 mt-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </Header>
    );
  }

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
              <Button onClick={() => navigate("/custom-syllabus")}>
                Create a New Quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </Header>
    );
  }

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const toggleFlag = (questionIndex: number) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    let correctAnswers = 0;
    const questions = testData.questions || [];
    questions.forEach((question: any, index: number) => {
      if (answers[index] === question.answer) {
        correctAnswers++;
      }
    });

    setScore(correctAnswers);
    setIsSubmitted(true);

    // Use centralized gamification processing
    const timeTaken = testData.time_limit * 60 - timeRemaining;
    const result = await processTestCompletion({
      score: correctAnswers,
      totalQuestions: questions.length,
      timeTaken,
      testType: "custom_quiz",
      subjects: testData.subjects || [],
      answers
    });

    if (result.newBadges.length > 0) {
      toast.success(`🏆 New Badge: ${result.newBadges[0].name}!`, {
        description: result.newBadges[0].description,
      });
    } else {
      toast.success("Test submitted successfully!", {
        description: `You scored ${correctAnswers}/${questions.length}`,
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Retry the same test without re-fetching data
  const handleRetry = () => {
    setCurrentQuestion(0);
    setScore(0);
    setIsSubmitted(false);
    setAnswers({});
    setFlaggedQuestions(new Set());
    setTimeRemaining(testData.time_limit * 60);
    toast.info("Test reset! Good luck on your retry.");
  };

  // Generate fresh questions from the Hybrid Engine (fail-safe: never spend credits on unknown context)
  const handleGenerateNew = async () => {
    // STEP 1: Capture Data (extract BEFORE touching state)
    const contextTopic = testData?.topics?.[0] || testData?.subjects?.[0];
    const contextSubject = testData?.subjects?.[0];
    const contextDiff = testData?.difficulty_levels?.[0] || "Medium";

    console.log("🎯 Capturing Context:", { contextTopic, contextSubject });

    // CRITICAL SAFETY CHECK: never spend credits if context is missing
    if (!contextTopic) {
      toast.error("Cannot regenerate: Topic context missing.");
      return;
    }

    // STEP 2: Reset UI (stay on this page; don't null testData)
    setIsLoading(true);
    setScore(0);
    setCurrentQuestion(0);
    setAnswers({});
    setIsSubmitted(false);

    try {
      // STEP 3: Call API (stay on page)
      const { data, error } = await supabase.functions.invoke("generate-test", {
        body: {
          topic: contextTopic,
          difficulty: contextDiff,
          subject: contextSubject ?? null,
          question_count: 10,
        },
      });

      if (error) throw error;

      // STEP 4: Update State (replace questions instantly)
      if (data?.questions) {
        setTestData((prev: any) => ({
          ...(prev ?? {}),
          ...data,
          questions: data.questions,
        }));

        setTimeRemaining((testData?.time_limit || 30) * 60);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        toast.error("Failed to generate. Try again.");
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setIsLoading(false);
      toast.error("Failed to generate. Try again.");
    }
  };

  const questions = testData.questions || [];
  const displayTotal = totalExpected > 0 ? Math.max(totalExpected, questions.length) : questions.length;
  const progress = ((currentQuestion + 1) / displayTotal) * 100;
  const answeredCount = Object.keys(answers).length;

  // Determine source badge
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
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        {/* Test Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold mb-2 text-foreground">{testData.session_name}</h1>
          <div className="flex flex-wrap gap-2 items-center justify-center">
            {sourceBadge && (
              <Badge variant={sourceBadge.variant} className="text-xs">
                {sourceBadge.icon} {sourceBadge.text}
              </Badge>
            )}
            {isLoadingMore && (
              <Badge variant="outline" className="text-xs animate-pulse">
                🔄 Loading more...
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(timeRemaining)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Q {currentQuestion + 1}/{questions.length}{remainingCount > 0 ? ` (+${remainingCount})` : ''}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Answered: {answeredCount}/{questions.length}
            </Badge>
          </div>
          <Progress value={progress} className="mt-3" />
        </div>

        {!isSubmitted ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="glass-card">
                <CardContent className="p-4">
                  {/* Question */}
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <h2 className="text-base font-semibold leading-tight">
                        {questions[currentQuestion].question}
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 w-7 p-0 shrink-0 ${flaggedQuestions.has(currentQuestion) ? "text-yellow-600" : ""}`}
                        onClick={() => toggleFlag(currentQuestion)}
                      >
                        <Flag className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Options */}
                  <RadioGroup
                    value={answers[currentQuestion] || ""}
                    onValueChange={(value) => handleAnswerChange(currentQuestion, value)}
                  >
                    {questions[currentQuestion].options.map((option: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors glass-card"
                      >
                        <RadioGroupItem value={option} id={`option-${idx}`} />
                        <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer text-sm">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  {/* Navigation */}
                  <div className="flex justify-between mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                      disabled={currentQuestion === 0}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>

                    {currentQuestion === questions.length - 1 ? (
                      <Button onClick={handleSubmit}>Submit Test</Button>
                    ) : (
                      <Button
                        onClick={() =>
                          setCurrentQuestion((prev) => Math.min(questions.length - 1, prev + 1))
                        }
                      >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-3">
                <CardContent className="p-3">
                  <h3 className="font-semibold mb-2 text-sm">Question Navigator</h3>
                  <div className="grid grid-cols-10 gap-1.5">
                    {questions.map((_: any, index: number) => (
                      <Button
                        key={index}
                        variant={currentQuestion === index ? "default" : answers[index] ? "outline" : "ghost"}
                        size="sm"
                        className="relative h-7 w-7 p-0 text-xs"
                        onClick={() => setCurrentQuestion(index)}
                      >
                        {index + 1}
                        {flaggedQuestions.has(index) && (
                          <Flag className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5 text-yellow-600" />
                        )}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        ) : (
          /* Results */
          <Card>
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <h2 className="text-2xl font-bold mb-2">Test Completed!</h2>
                <p className="text-lg text-muted-foreground">
                  You scored {score} out of {questions.length}
                </p>
                <div className="text-3xl font-bold text-primary mt-3">
                  {Math.round((score / questions.length) * 100)}%
                </div>
              </div>

              {/* Smart Feedback Card */}
              <SmartFeedbackCard
                score={score}
                totalQuestions={questions.length}
                timeTaken={testData.time_limit * 60 - timeRemaining}
                subjects={testData.subjects || []}
                testType="custom_quiz"
                onRetry={handleRetry}
                onGenerateNew={handleGenerateNew}
              />

              {/* Answer Review */}
              <div className="space-y-3 mt-6 text-left">
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
                            Q{index + 1}: {question.question}
                          </p>
                          <p className="text-xs">
                            <span className="font-medium">Your answer:</span>{" "}
                            {userAnswer || "Not answered"}
                          </p>
                          <p className="text-xs text-green-600">
                            <span className="font-medium">Correct:</span>{" "}
                            {question.answer}
                          </p>
                        </div>
                      </div>
                    </Alert>
                  );
                })}
              </div>

              <div className="flex gap-3 justify-center mt-6 flex-wrap">
                <Button size="sm" onClick={() => navigate("/custom-syllabus")}>Create Another Quiz</Button>
                <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Header>
  );
};

export default TestSession;
