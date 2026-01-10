import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import { Clock, CheckCircle, XCircle, ArrowRight, ArrowLeft, Flag, AlertCircle, Loader2 } from "lucide-react";
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
  returnPath?: string; // Track where user came from
};

// Helper to extract topic string from various formats
function extractTopicString(topics: any): string | null {
  if (!topics) return null;
  
  // If it's a string, use directly
  if (typeof topics === 'string') return topics;
  
  // If it's an array
  if (Array.isArray(topics)) {
    if (topics.length === 0) return null;
    
    // Array of strings
    if (typeof topics[0] === 'string') return topics[0];
    
    // Array of objects like { subject: "Physics", topics: ["Mechanics", "Optics"] }
    if (typeof topics[0] === 'object' && topics[0] !== null) {
      const first = topics[0];
      // Try to get subject name or first topic
      if (first.subject) return first.subject;
      if (first.topics && Array.isArray(first.topics) && first.topics.length > 0) {
        return first.topics[0];
      }
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
  const [isImproving, setIsImproving] = useState(false); // Loading state for Improve button
  
  // Smart Background Loading state
  const [expectedTotal, setExpectedTotal] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [remainingCount, setRemainingCount] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollAttemptsRef = useRef(0);
  const MAX_POLL_ATTEMPTS = 15;

  // Get returnPath from navigation state (for Smart Return)
  const locationState = location.state as { returnPath?: string } | null;

  // Persist the context of the just-finished test so "Retake" never falls back to defaults.
  const [lastUsedContext, setLastUsedContext] = useState<LastUsedTestContext>({
    subject: undefined,
    topic: undefined,
    subjects: [],
    topics: [],
    difficultyLevels: [],
    questionCount: 10,
    timeLimit: 30,
    totalQuestions: 0,
    returnPath: locationState?.returnPath || "/custom-syllabus", // Default fallback
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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Background fetch for remaining questions using fetch_only mode
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
    
    // Extract topic for polling
    const topicForPolling = extractTopicString(testData.topics) || 
                           testData.subjects?.[0] || 
                           testData.session_name?.replace(/^(Job Test:|Test:)\s*/, '') ||
                           null;
    
    const difficultyForPolling = testData.difficulty_levels?.[0] || "Medium";

    if (!topicForPolling) {
      console.log("⚠️ Background Fetching: Cannot determine topic for polling");
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setIsLoadingMore(false);
      return;
    }

    console.log(`🔄 Background Fetching: Attempt ${pollAttemptsRef.current}/${MAX_POLL_ATTEMPTS} - ${currentQuestionCount} questions loaded out of ${expectedTotal} expected`);

    try {
      // Use fetch_only to just get cached questions without triggering new AI generation
      const { data, error } = await supabase.functions.invoke("generate-test", {
        body: {
          topic: topicForPolling,
          difficulty: difficultyForPolling,
          question_count: expectedTotal, // Request full amount
          fetch_only: true, // CRITICAL: Don't trigger AI, just fetch from DB
        },
      });

      if (error) {
        console.error("Background fetch error:", error);
        return;
      }

      if (data?.questions && data.questions.length > currentQuestionCount) {
        // Filter to only add NEW questions (avoid duplicates)
        const existingQuestions = testData.questions || [];
        const existingQuestionTexts = new Set(existingQuestions.map((q: any) => q.question));
        
        const newQuestions = data.questions.filter((q: any) => 
          !existingQuestionTexts.has(q.question)
        );
        
        if (newQuestions.length > 0) {
          console.log(`✅ Background Fetching: Appended ${newQuestions.length} new questions`);
          
          setTestData((prev: any) => {
            const updatedQuestions = [...(prev?.questions || []), ...newQuestions];
            return {
              ...prev,
              questions: updatedQuestions
            };
          });

          // Update remaining count
          const newTotal = currentQuestionCount + newQuestions.length;
          const newRemaining = Math.max(0, expectedTotal - newTotal);
          setRemainingCount(newRemaining);
          
          // Show progress toast
          if (newRemaining > 0) {
            toast.info(`Loaded ${newQuestions.length} more questions`, { duration: 2000 });
          } else {
            toast.success(`All ${expectedTotal} questions loaded!`, { duration: 3000 });
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            setIsLoadingMore(false);
          }
        }
      }
    } catch (err) {
      console.error("Background fetch failed:", err);
    }
  }, [testData, remainingCount, expectedTotal]);

  // Start polling when we have remaining questions
  useEffect(() => {
    if (remainingCount > 0 && !isSubmitted && !pollIntervalRef.current) {
      console.log(`🚀 Starting background polling for ${remainingCount} remaining questions`);
      setIsLoadingMore(true);
      pollAttemptsRef.current = 0;
      
      // Initial poll after 3 seconds, then every 3 seconds
      const initialTimeout = setTimeout(() => {
        pollForMoreQuestions();
        pollIntervalRef.current = setInterval(pollForMoreQuestions, 3000);
      }, 3000);
      
      return () => {
        clearTimeout(initialTimeout);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };
    }
  }, [remainingCount, isSubmitted, pollForMoreQuestions]);

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
        
        // Set expected total from the stored question_count (this is the REQUESTED total)
        setExpectedTotal(safeQuestionCount);
        
        // Check if we got partial data (fewer questions than expected)
        const remaining = Math.max(0, safeQuestionCount - safeTotalQuestions);
        setRemainingCount(remaining);
        
        console.log(`📊 TestSession Loaded: ${safeTotalQuestions} questions, expected ${safeQuestionCount}, remaining ${remaining}`);

        // Persist context for "Retake (Same Settings)"
        setLastUsedContext({
          subject: subjectsArr[0],
          topic: extractTopicString(data.topics) || topicsArr[0],
          subjects: subjectsArr,
          topics: topicsArr,
          difficultyLevels: difficultyArr,
          questionCount: safeQuestionCount,
          timeLimit: safeTimeLimit,
          totalQuestions: safeTotalQuestions,
          returnPath: locationState?.returnPath || "/custom-syllabus",
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
        <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-2 test-container">
          <div className="mb-2">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-1.5 w-full" />
          </div>
          <Card>
            <CardContent className="p-2.5 sm:p-3 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <div className="space-y-1.5">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
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

    // Stop polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsLoadingMore(false);

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

  // Retry the same test with PRESERVED time limit
  const handleRetry = () => {
    const originalTimeLimit = lastUsedContext.timeLimit || testData?.time_limit || 30;
    
    setCurrentQuestion(0);
    setScore(0);
    setIsSubmitted(false);
    setAnswers({});
    setFlaggedQuestions(new Set());
    setTimeRemaining(originalTimeLimit * 60); // USE PRESERVED TIME LIMIT
    toast.info("Test reset! Good luck on your retry.");
  };

  // "Retake (Same Settings)" - Generate fresh questions using SAME SETTINGS
  const handleGenerateNew = async () => {
    // STEP 1: Capture Data from lastUsedContext (preserves original settings)
    const contextTopic = lastUsedContext.topic || extractTopicString(testData?.topics) || testData?.subjects?.[0];
    const contextSubject = lastUsedContext.subject || testData?.subjects?.[0];
    const contextDiff = lastUsedContext.difficultyLevels?.[0] || testData?.difficulty_levels?.[0] || "Medium";
    const contextQuestionCount = lastUsedContext.questionCount || testData?.question_count || 10;
    const contextTimeLimit = lastUsedContext.timeLimit || testData?.time_limit || 30;

    console.log("🎯 Retake with SAME Settings:", { 
      topic: contextTopic, 
      difficulty: contextDiff, 
      questionCount: contextQuestionCount,
      timeLimit: contextTimeLimit 
    });

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
    setFlaggedQuestions(new Set());
    setIsSubmitted(false);

    try {
      // STEP 3: Call API with PRESERVED settings
      const { data, error } = await supabase.functions.invoke("generate-test", {
        body: {
          topic: contextTopic,
          difficulty: contextDiff,
          subject: contextSubject ?? null,
          question_count: contextQuestionCount, // USE ORIGINAL SETTING
          partial_mode: contextQuestionCount > 20,
        },
      });

      if (error) throw error;

      // STEP 4: Update State with PRESERVED time limit
      if (data?.questions) {
        setTestData((prev: any) => ({
          ...(prev ?? {}),
          ...data,
          questions: data.questions,
        }));

        // USE ORIGINAL TIME LIMIT
        setTimeRemaining(contextTimeLimit * 60);
        setExpectedTotal(contextQuestionCount);
        setRemainingCount(Math.max(0, contextQuestionCount - (data.questions?.length || 0)));
        setIsLoading(false);
        
        toast.success(`New quiz started with ${data.questions.length} questions!`);
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

  // NEW: "Improve [Subject]" - Smart Remedial: Generate new test with wrong answers + fresh questions (NO REDIRECT)
  const handleImprove = async () => {
    const questions = testData.questions || [];
    const wrongQuestions: any[] = [];
    
    // Collect wrong answers
    questions.forEach((question: any, index: number) => {
      if (answers[index] !== question.answer) {
        wrongQuestions.push(question);
      }
    });

    const contextTopic = lastUsedContext.topic || extractTopicString(testData?.topics) || testData?.subjects?.[0];
    const contextSubject = lastUsedContext.subject || testData?.subjects?.[0];
    const contextDiff = lastUsedContext.difficultyLevels?.[0] || testData?.difficulty_levels?.[0] || "Medium";
    const contextTimeLimit = lastUsedContext.timeLimit || testData?.time_limit || 30;
    
    // Calculate how many fresh questions to add
    const wrongCount = wrongQuestions.length;
    const freshCount = Math.max(5, Math.ceil(wrongCount * 0.5)); // At least 5 fresh, or 50% more
    const totalNeeded = wrongCount + freshCount;

    console.log("🔧 Smart Remedial:", { 
      wrongCount, 
      freshCount, 
      totalNeeded,
      topic: contextTopic 
    });

    if (!contextTopic) {
      toast.error("Cannot generate: Topic context missing.");
      return;
    }

    setIsImproving(true);

    try {
      // Fetch fresh questions (forceNew to avoid duplicates)
      const { data, error } = await supabase.functions.invoke("generate-test", {
        body: {
          topic: contextTopic,
          difficulty: contextDiff,
          subject: contextSubject ?? null,
          question_count: freshCount,
          forceNew: true, // Skip cache to get different questions
        },
      });

      if (error) throw error;

      const freshQuestions = data?.questions || [];
      
      // Combine wrong questions + fresh questions
      const combinedQuestions = [...wrongQuestions, ...freshQuestions];
      
      // Shuffle the combined questions
      for (let i = combinedQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combinedQuestions[i], combinedQuestions[j]] = [combinedQuestions[j], combinedQuestions[i]];
      }

      // Reset UI and start new test (NO REDIRECT - stays on same page)
      setTestData((prev: any) => ({
        ...(prev ?? {}),
        questions: combinedQuestions,
        session_name: `${contextSubject || contextTopic} - Focused Practice`,
      }));
      
      setTimeRemaining(contextTimeLimit * 60);
      setExpectedTotal(combinedQuestions.length);
      setRemainingCount(0);
      setCurrentQuestion(0);
      setScore(0);
      setAnswers({});
      setFlaggedQuestions(new Set());
      setIsSubmitted(false);
      
      toast.success(`Starting focused practice: ${wrongCount} review + ${freshQuestions.length} fresh questions!`);
    } catch (error) {
      console.error("Improve generation failed:", error);
      toast.error("Failed to generate improvement quiz. Try again.");
    } finally {
      setIsImproving(false);
    }
  };

  // Smart Return: Go back to source page
  const handleCreateAnother = () => {
    const returnPath = lastUsedContext.returnPath || "/custom-syllabus";
    navigate(returnPath);
  };

  const questions = testData.questions || [];
  const displayTotal = expectedTotal > 0 ? Math.max(expectedTotal, questions.length) : questions.length;
  const progress = ((currentQuestion + 1) / displayTotal) * 100;
  const answeredCount = Object.keys(answers).length;

  // Check if all questions are loaded
  const allQuestionsLoaded = remainingCount === 0;
  const canSubmit = allQuestionsLoaded || questions.length >= expectedTotal;

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
      <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-2 sm:pt-3 pb-2 test-container">
        {/* Compact Test Header */}
        <div className="mb-2 sm:mb-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h1 className="text-sm sm:text-base font-bold text-foreground truncate flex-1">
              {testData.session_name}
            </h1>
            <Badge variant="outline" className="flex items-center gap-1 text-[10px] sm:text-xs shrink-0 py-0.5 px-1.5">
              <Clock className="h-3 w-3" />
              {formatTime(timeRemaining)}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              Q {currentQuestion + 1}/{questions.length}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              • {answeredCount} answered
            </span>
            {sourceBadge && (
              <Badge variant={sourceBadge.variant} className="text-[10px] py-0 px-1">
                {sourceBadge.icon} {sourceBadge.text}
              </Badge>
            )}
            {isLoadingMore && (
              <Badge variant="outline" className="text-[10px] py-0 px-1 flex items-center gap-0.5 animate-pulse">
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                +{remainingCount}
              </Badge>
            )}
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {!isSubmitted ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Question Area */}
            <div className="flex-1 overflow-y-auto min-h-0 pb-2 scrollbar-thin">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="glass-card">
                    <CardContent className="p-2.5 sm:p-3">
                      {/* Question with scroll for long text */}
                      <div className="mb-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 max-h-[22vh] overflow-y-auto scrollbar-thin pr-1">
                            <h2 className="text-sm sm:text-base font-semibold leading-snug">
                              {questions[currentQuestion].question}
                            </h2>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-6 w-6 p-0 shrink-0 ${flaggedQuestions.has(currentQuestion) ? "text-yellow-600" : ""}`}
                            onClick={() => toggleFlag(currentQuestion)}
                          >
                            <Flag className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Compact Options */}
                      <RadioGroup
                        value={answers[currentQuestion] || ""}
                        onValueChange={(value) => handleAnswerChange(currentQuestion, value)}
                        className="space-y-1.5"
                      >
                        {questions[currentQuestion].options.map((option: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center space-x-2 p-2 sm:p-2.5 rounded-md border hover:bg-accent/50 transition-colors glass-card"
                          >
                            <RadioGroupItem value={option} id={`option-${idx}`} className="h-4 w-4" />
                            <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer text-xs sm:text-sm leading-tight">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {/* Question Navigator - Collapsible on mobile */}
                  <details className="mt-2 sm:hidden">
                    <summary className="text-[10px] text-muted-foreground cursor-pointer py-1 px-1">
                      ▸ Question Navigator
                    </summary>
                    <div className="grid grid-cols-10 gap-1 mt-1 p-1.5 bg-card rounded-lg border">
                      {questions.map((_: any, index: number) => (
                        <Button
                          key={index}
                          variant={currentQuestion === index ? "default" : answers[index] ? "outline" : "ghost"}
                          size="sm"
                          className="relative h-6 w-6 p-0 text-[10px]"
                          onClick={() => setCurrentQuestion(index)}
                        >
                          {index + 1}
                          {flaggedQuestions.has(index) && (
                            <Flag className="h-2 w-2 absolute -top-0.5 -right-0.5 text-yellow-600" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </details>

                  {/* Desktop Navigator */}
                  <Card className="mt-2 hidden sm:block">
                    <CardContent className="p-2">
                      <h3 className="font-medium mb-1.5 text-xs">Navigator</h3>
                      <div className="grid grid-cols-10 gap-1">
                        {questions.map((_: any, index: number) => (
                          <Button
                            key={index}
                            variant={currentQuestion === index ? "default" : answers[index] ? "outline" : "ghost"}
                            size="sm"
                            className="relative h-6 w-6 p-0 text-xs"
                            onClick={() => setCurrentQuestion(index)}
                          >
                            {index + 1}
                            {flaggedQuestions.has(index) && (
                              <Flag className="h-2 w-2 absolute -top-0.5 -right-0.5 text-yellow-600" />
                            )}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Fixed Navigation Bar - Always visible at bottom */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t pt-2 pb-safe mt-auto z-10">
              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                  className="h-9"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  <span className="hidden xs:inline">Prev</span>
                </Button>

                {currentQuestion === questions.length - 1 ? (
                  <Button 
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    title={!canSubmit ? `Waiting for ${remainingCount} more questions to load...` : undefined}
                    className="h-9"
                  >
                    {!canSubmit && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                    {canSubmit ? 'Submit' : 'Loading...'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() =>
                      setCurrentQuestion((prev) => Math.min(questions.length - 1, prev + 1))
                    }
                    className="h-9"
                  >
                    <span className="hidden xs:inline">Next</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
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
                onImprove={handleImprove}
                isImproving={isImproving}
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
                <Button size="sm" onClick={handleCreateAnother}>Create Another Quiz</Button>
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
