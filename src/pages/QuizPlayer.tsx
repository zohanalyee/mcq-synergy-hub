import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Lightbulb, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BrandingLoader from "@/components/BrandingLoader";
import { supabase } from "@/integrations/supabase/client";
import { cleanQuestionText } from "@/lib/questionUtils";
import {
  resolveCorrectAnswer,
  checkUserAnswer,
  normalizeQuestion,
  normalizeOptions,
} from "@/lib/testEvaluation";
import { processTestCompletion, triggerConfetti } from "@/utils/gamification";
import { scorePracticeAnswers, isDbQuestionId } from "@/services/practiceScoringService";
import { extractIdFromSlug } from "@/utils/slugify";
import QuizHUD from "@/components/quiz/QuizHUD";
import QuizOption, { QuizOptionState } from "@/components/quiz/QuizOption";
import QuizTimerRing from "@/components/quiz/QuizTimerRing";
import QuizResultScreen from "@/components/quiz/QuizResultScreen";
import { GuestResultGate } from "@/components/quiz/GuestResultGate";
import { loadGuestSession } from "@/lib/guestSession";
import { useAuth } from "@/contexts/AuthContext";
import ResultAdviceCard from "@/components/shared/ResultAdviceCard";

const LETTERS = ["A", "B", "C", "D", "E", "F"];
const AUTO_ADVANCE_MS = 4000;
const SPEED_BONUS_THRESHOLD_S = 5;

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const QuizPlayer = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const locationState = location.state as { returnPath?: string } | null;
  const returnPath = locationState?.returnPath || "/quizzes";

  // Session data
  const [testData, setTestData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Game state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [perQTime, setPerQTime] = useState(20); // seconds per question
  const [remaining, setRemaining] = useState(20);
  const [isFinished, setIsFinished] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const startedAtRef = useRef<number>(Date.now());
  const questionStartRef = useRef<number>(Date.now());
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questions = testData?.questions || [];
  const total = questions.length;
  const currentQ = questions[currentIdx];
  const subjectName = testData?.subjects?.[0] || "";

  // Fetch session
  useEffect(() => {
    const fetch = async () => {
      if (!id) {
        setError("No session ID provided");
        setIsLoading(false);
        return;
      }
      const sessionId = extractIdFromSlug(id);
      try {
        let data: any = null;
        if (sessionId.startsWith('guest-')) {
          data = loadGuestSession(sessionId);
        } else {
          const { data: row, error: e } = await supabase
            .from("custom_test_sessions")
            .select("*")
            .eq("id", sessionId)
            .maybeSingle();
          if (e) throw e;
          data = row;
        }
        if (!data) {
          setError("Quiz session not found");
          setIsLoading(false);
          return;
        }
        const normalized = {
          ...data,
          questions: Array.isArray(data.questions)
            ? (data.questions as any[]).map(normalizeQuestion)
            : [],
        };
        setTestData(normalized);

        const qCount = normalized.questions.length || 1;
        const tlMin =
          typeof data.time_limit === "number"
            ? data.time_limit
            : Number(data.time_limit) || 15;
        const per = clamp(Math.round((tlMin * 60) / qCount), 10, 45);
        setPerQTime(per);
        setRemaining(per);

        startedAtRef.current = Date.now();
        questionStartRef.current = Date.now();
        setIsLoading(false);
      } catch (err) {
        console.error("Quiz fetch error:", err);
        setError("Failed to load quiz");
        setIsLoading(false);
      }
    };
    fetch();
  }, [id]);

  // Per-question timer
  useEffect(() => {
    if (isLoading || isFinished || revealed) return;
    if (remaining <= 0) {
      handleTimeout();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, revealed, isFinished, isLoading]);

  // Reset timer on question change
  useEffect(() => {
    if (isLoading || isFinished) return;
    setRemaining(perQTime);
    setSelected(null);
    setRevealed(false);
    questionStartRef.current = Date.now();
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, perQTime, isLoading]);

  const optionsArr: string[] = useMemo(
    () => (currentQ ? normalizeOptions(currentQ.options) : []),
    [currentQ],
  );

  const handleTimeout = useCallback(() => {
    if (revealed || isFinished || !currentQ) return;
    setRevealed(true);
    setStreak(0);
    setAnswers((a) => ({ ...a, [currentIdx]: "" }));
    toast("⏰ Time's up!", { duration: 1500, position: "top-center" });
    autoAdvanceRef.current = setTimeout(() => goNext(), AUTO_ADVANCE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, isFinished, currentQ, currentIdx]);

  const handleSelect = async (optText: string) => {
    if (revealed || !currentQ) return;
    setSelected(optText);
    setAnswers((a) => ({ ...a, [currentIdx]: optText }));

    // SERVER-SIDE SCORING: guest questions arrive answer-free. Resolve the
    // correct answer/explanation server-side only AFTER the user picks, then
    // merge it into the question so the reveal + explanation render correctly.
    let isCorrect: boolean;
    if (!resolveCorrectAnswer(currentQ) && isDbQuestionId(currentQ?.id)) {
      const scored = await scorePracticeAnswers([{ id: currentQ.id, answer: optText }]);
      const s = scored[currentQ.id];
      if (s) {
        setTestData((prev: any) =>
          prev
            ? {
                ...prev,
                questions: prev.questions.map((x: any, i: number) =>
                  i === currentIdx
                    ? { ...x, answer: s.correct_answer, explanation: s.explanation }
                    : x,
                ),
              }
            : prev,
        );
        isCorrect = s.is_correct;
      } else {
        isCorrect = checkUserAnswer(currentQ, optText);
      }
    } else {
      isCorrect = checkUserAnswer(currentQ, optText);
    }
    setRevealed(true);


    const elapsed = (Date.now() - questionStartRef.current) / 1000;

    if (isCorrect) {
      const speedBonus = elapsed < SPEED_BONUS_THRESHOLD_S ? 5 : 0;
      const gained = 10 + speedBonus;
      setScore((s) => s + gained);
      setCorrectCount((c) => c + 1);
      setStreak((s) => {
        const next = s + 1;
        setMaxStreak((m) => Math.max(m, next));
        if (next === 3) toast.success("🔥 3 in a row!", { duration: 1500, position: "top-center" });
        else if (next === 5) toast.success("🔥🔥 5 streak — on fire!", { duration: 1800, position: "top-center" });
        else if (next === 10) toast.success("🔥🔥🔥 10 streak — unstoppable!", { duration: 2000, position: "top-center" });
        return next;
      });
      if (speedBonus > 0) {
        toast(`⚡ +${speedBonus} speed bonus`, { duration: 1200, position: "bottom-center" });
      }
    } else {
      setStreak(0);
    }

    autoAdvanceRef.current = setTimeout(() => goNext(), AUTO_ADVANCE_MS);
  };

  const goNext = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    if (currentIdx + 1 >= total) {
      finishQuiz();
    } else {
      setCurrentIdx((i) => i + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, total]);

  const finishQuiz = useCallback(async () => {
    if (submittedOnce) return;
    setSubmittedOnce(true);
    setIsFinished(true);
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);

    const timeTaken = Math.round((Date.now() - startedAtRef.current) / 1000);
    const accuracy = total > 0 ? correctCount / total : 0;
    if (accuracy >= 0.8) {
      try { triggerConfetti(); } catch {}
    }

    try {
      await processTestCompletion({
        score: correctCount,
        totalQuestions: total,
        timeTaken,
        testType: "quiz",
        subjects: testData?.subjects || [],
        answers,
      });
    } catch (err) {
      console.warn("processTestCompletion error (non-blocking):", err);
    }
  }, [submittedOnce, total, correctCount, testData?.subjects, answers]);

  const handleExit = () => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    navigate(returnPath);
  };

  // ----- Renders -----

  if (isLoading) {
    return <BrandingLoader fullScreen size="lg" message="Loading your quiz..." />;
  }

  if (error || !testData || total === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {error || "This quiz has no questions."}
            </p>
            <Button onClick={() => navigate("/quizzes")}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isFinished) {
    const timeTaken = Math.round((Date.now() - startedAtRef.current) / 1000);
    if (!user) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
          <div className="max-w-2xl mx-auto px-4 pt-6">
            <ResultAdviceCard
              score={total > 0 ? Math.round((correctCount / total) * 100) : 0}
              subject={subjectName}
              isGuest={true}
            />
          </div>
          <GuestResultGate
            open={true}
            onClose={() => navigate(returnPath)}
            score={score}
            total={total}
            correctCount={correctCount}
            returnPath={returnPath}
          />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
        <QuizResultScreen
          title={testData.session_name || "Quiz"}
          score={score}
          totalQuestions={total}
          correctCount={correctCount}
          maxStreak={maxStreak}
          timeTakenSeconds={timeTaken}
          questions={questions}
          answers={answers}
          onPlayAgain={() => navigate("/quizzes")}
          onTryAnother={() => navigate("/quizzes")}
        />
      </div>
    );
  }

  const correctText = currentQ ? resolveCorrectAnswer(currentQ) : "";
  const isLastQuestion = currentIdx + 1 >= total;

  const optionState = (text: string): QuizOptionState => {
    if (!revealed) return selected === text ? "selected" : "idle";
    const isCorrect = text.trim().toLowerCase() === correctText.trim().toLowerCase();
    if (isCorrect) return "correct";
    if (selected === text) return "incorrect";
    return "idle";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-32 sm:pb-28">
      <QuizHUD
        title={testData.session_name || "Quiz"}
        current={currentIdx + 1}
        total={total}
        streak={streak}
        score={score}
        onExit={handleExit}
      />

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* Timer */}
        <div className="flex justify-center mb-3">
          <QuizTimerRing remaining={remaining} total={perQTime} size={52} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            {subjectName && (
              <p className="text-xs uppercase tracking-wider text-brand-gradient font-bold text-center mb-1.5">
                {subjectName}
              </p>
            )}

            <h2 className="text-base sm:text-lg font-semibold text-center leading-snug mb-4 px-2">
              {cleanQuestionText(currentQ.question || currentQ.title || "")}
            </h2>

            <div className="space-y-2">
              {optionsArr.map((opt, i) => (
                <QuizOption
                  key={`${currentIdx}-${i}`}
                  letter={LETTERS[i] || String(i + 1)}
                  text={opt}
                  state={optionState(opt)}
                  disabled={revealed}
                  onClick={() => handleSelect(opt)}
                />
              ))}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {revealed && currentQ.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-primary mb-0.5">
                            Explanation
                          </p>
                          <p className="text-sm text-foreground/90 leading-relaxed">
                            {currentQ.explanation}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky Next button — always reachable, no scrolling required */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-16 sm:bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border py-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
          >
            <div className="max-w-2xl mx-auto">
              <Button size="lg" onClick={goNext} className="w-full">
                {isLastQuestion ? (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Finish Quiz
                  </>
                ) : (
                  <>
                    Next Question
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizPlayer;
