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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle, XCircle, ArrowRight, ArrowLeft, Flag, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
        setTimeRemaining(data.time_limit * 60);
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
      <>
        <Header />
        <div className="container mx-auto px-4 pt-28 pb-16 max-w-5xl">
          <div className="mb-8 text-center">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <div className="flex gap-4 justify-center">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-28" />
            </div>
            <Skeleton className="h-2 w-full mt-4" />
          </div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-32" />
              <div className="space-y-3 mt-6">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error || !testData) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 pt-28 pb-16 max-w-5xl">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Test Not Found</h2>
              <p className="text-muted-foreground mb-6">
                {error || "The test session you're looking for doesn't exist or has been removed."}
              </p>
              <Button onClick={() => navigate("/custom-syllabus")}>
                Create a New Quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
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

    // Save test attempt to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("test_attempts").insert({
          user_id: user.id,
          test_type: "custom_quiz",
          score: correctAnswers,
          total_questions: questions.length,
          time_taken: testData.time_limit * 60 - timeRemaining,
          answers: answers,
        });
      }
    } catch (error) {
      console.error("Error saving test attempt:", error);
    }

    toast.success("Test submitted successfully!", {
      description: `You scored ${correctAnswers}/${questions.length}`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const questions = testData.questions || [];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-16 max-w-5xl">
        {/* Test Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 text-foreground">{testData.session_name}</h1>
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <Badge variant="outline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatTime(timeRemaining)}
            </Badge>
            <Badge variant="outline">
              Question {currentQuestion + 1} of {questions.length}
            </Badge>
            <Badge variant="outline">
              Answered: {answeredCount}/{questions.length}
            </Badge>
          </div>
          <Progress value={progress} className="mt-4" />
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
              <Card>
                <CardContent className="p-6">
                  {/* Question */}
                  <div className="mb-6">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-semibold">
                        {questions[currentQuestion].question}
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFlag(currentQuestion)}
                        className={flaggedQuestions.has(currentQuestion) ? "text-yellow-600" : ""}
                      >
                        <Flag className="h-4 w-4" />
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
                        className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <RadioGroupItem value={option} id={`option-${idx}`} />
                        <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  {/* Navigation */}
                  <div className="flex justify-between mt-8">
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

              {/* Question Navigator */}
              <Card className="mt-4">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Question Navigator</h3>
                  <div className="grid grid-cols-10 gap-2">
                    {questions.map((_: any, index: number) => (
                      <Button
                        key={index}
                        variant={currentQuestion === index ? "default" : answers[index] ? "outline" : "ghost"}
                        size="sm"
                        className="relative"
                        onClick={() => setCurrentQuestion(index)}
                      >
                        {index + 1}
                        {flaggedQuestions.has(index) && (
                          <Flag className="h-3 w-3 absolute -top-1 -right-1 text-yellow-600" />
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
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2">Test Completed!</h2>
                <p className="text-xl text-muted-foreground">
                  You scored {score} out of {questions.length}
                </p>
                <div className="text-4xl font-bold text-primary mt-4">
                  {Math.round((score / questions.length) * 100)}%
                </div>
              </div>

              {/* Answer Review */}
              <div className="space-y-4 mt-8 text-left">
                <h3 className="text-xl font-semibold">Review Answers</h3>
                {questions.map((question: any, index: number) => {
                  const userAnswer = answers[index];
                  const isCorrect = userAnswer === question.answer;

                  return (
                    <Alert key={index} className={isCorrect ? "border-green-500" : "border-red-500"}>
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-1" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold mb-2">
                            Q{index + 1}: {question.question}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Your answer:</span>{" "}
                            {userAnswer || "Not answered"}
                          </p>
                          <p className="text-sm text-green-600">
                            <span className="font-medium">Correct answer:</span>{" "}
                            {question.answer}
                          </p>
                        </div>
                      </div>
                    </Alert>
                  );
                })}
              </div>

              <div className="flex gap-4 justify-center mt-8">
                <Button onClick={() => navigate("/custom-syllabus")}>Create Another Quiz</Button>
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default TestSession;
