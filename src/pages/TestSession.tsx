import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle, XCircle, ArrowRight, ArrowLeft, Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GeneratedTest } from "@/services/testGenerationService";

const TestSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const testData = location.state?.test as GeneratedTest;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!testData) {
      toast.error("No test data found");
      navigate("/custom-quizzes");
      return;
    }

    setTimeRemaining(testData.timeLimit * 60);
  }, [testData, navigate]);

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

  if (!testData) {
    return null;
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
    testData.questions.forEach((question, index) => {
      if (answers[index] === question.correctOption) {
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
          total_questions: testData.questions.length,
          time_taken: testData.timeLimit * 60 - timeRemaining,
          answers: answers,
        });
      }
    } catch (error) {
      console.error("Error saving test attempt:", error);
    }

    toast.success("Test submitted successfully!", {
      description: `You scored ${correctAnswers}/${testData.questions.length}`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((currentQuestion + 1) / testData.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-16 max-w-5xl">
        {/* Test Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 text-foreground">{testData.title}</h1>
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <Badge variant="outline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatTime(timeRemaining)}
            </Badge>
            <Badge variant="outline">
              Question {currentQuestion + 1} of {testData.questions.length}
            </Badge>
            <Badge variant="outline">
              Answered: {answeredCount}/{testData.questions.length}
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
                        {testData.questions[currentQuestion].question}
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
                    <div className="flex gap-2">
                      <Badge>{testData.questions[currentQuestion].difficulty}</Badge>
                      <Badge variant="outline">{testData.questions[currentQuestion].subject}</Badge>
                    </div>
                  </div>

                  {/* Options */}
                  <RadioGroup
                    value={answers[currentQuestion] || ""}
                    onValueChange={(value) => handleAnswerChange(currentQuestion, value)}
                  >
                    {Object.entries(testData.questions[currentQuestion].options).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <RadioGroupItem value={key} id={`option-${key}`} />
                        <Label htmlFor={`option-${key}`} className="flex-1 cursor-pointer">
                          <span className="font-semibold mr-2">{key}.</span>
                          {value}
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

                    {currentQuestion === testData.questions.length - 1 ? (
                      <Button onClick={handleSubmit}>Submit Test</Button>
                    ) : (
                      <Button
                        onClick={() =>
                          setCurrentQuestion((prev) => Math.min(testData.questions.length - 1, prev + 1))
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
                    {testData.questions.map((_, index) => (
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
                  You scored {score} out of {testData.questions.length}
                </p>
                <div className="text-4xl font-bold text-primary mt-4">
                  {Math.round((score / testData.questions.length) * 100)}%
                </div>
              </div>

              {/* Answer Review */}
              <div className="space-y-4 mt-8 text-left">
                <h3 className="text-xl font-semibold">Review Answers</h3>
                {testData.questions.map((question, index) => {
                  const userAnswer = answers[index];
                  const isCorrect = userAnswer === question.correctOption;

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
                            {userAnswer ? `${userAnswer}. ${question.options[userAnswer]}` : "Not answered"}
                          </p>
                          <p className="text-sm text-green-600">
                            <span className="font-medium">Correct answer:</span>{" "}
                            {question.correctOption}. {question.options[question.correctOption]}
                          </p>
                          {question.explanation && (
                            <AlertDescription className="mt-2 text-sm">
                              <span className="font-medium">Explanation:</span> {question.explanation}
                            </AlertDescription>
                          )}
                        </div>
                      </div>
                    </Alert>
                  );
                })}
              </div>

              <div className="flex gap-4 justify-center mt-8">
                <Button onClick={() => navigate("/custom-quizzes")}>Create Another Quiz</Button>
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
