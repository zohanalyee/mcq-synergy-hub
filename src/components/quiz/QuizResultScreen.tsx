import { useState } from "react";
import { motion } from "framer-motion";
import { Award, Flame, Target, Clock, RotateCcw, Sparkles, ChevronDown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cleanQuestionText } from "@/lib/questionUtils";

interface QuizResultScreenProps {
  title: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  maxStreak: number;
  timeTakenSeconds: number;
  questions: any[];
  answers: Record<number, string>;
  onPlayAgain: () => void;
  onTryAnother: () => void;
}

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const QuizResultScreen = ({
  title,
  score,
  totalQuestions,
  correctCount,
  maxStreak,
  timeTakenSeconds,
  questions,
  answers,
  onPlayAgain,
  onTryAnother,
}: QuizResultScreenProps) => {
  const [showReview, setShowReview] = useState(false);
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = accuracy >= 60;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden border-2 shadow-xl">
          <div className={`h-2 ${passed ? "bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" : "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500"}`} />
          <CardContent className="pt-8 pb-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${passed ? "bg-green-500/15 text-green-600" : "bg-orange-500/15 text-orange-600"}`}
            >
              {passed ? <Award className="h-10 w-10" /> : <Sparkles className="h-10 w-10" />}
            </motion.div>

            <h2 className="text-2xl sm:text-3xl font-bold mb-1">
              {passed ? "Great work!" : "Keep going!"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">{title}</p>

            <div className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent mb-1">
              {accuracy}%
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {correctCount} of {totalQuestions} correct
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl bg-muted/50 p-3">
                <div className="flex items-center justify-center text-primary mb-1">
                  <Target className="h-4 w-4" />
                </div>
                <div className="text-lg font-bold">{score}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Score</div>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <div className="flex items-center justify-center text-orange-500 mb-1">
                  <Flame className="h-4 w-4" />
                </div>
                <div className="text-lg font-bold">{maxStreak}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Best Streak</div>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <div className="flex items-center justify-center text-cyan-500 mb-1">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="text-lg font-bold tabular-nums">{fmtTime(timeTakenSeconds)}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Time</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={onPlayAgain} className="flex-1" size="lg">
                <RotateCcw className="mr-2 h-4 w-4" />
                Play Again
              </Button>
              <Button onClick={onTryAnother} variant="outline" className="flex-1" size="lg">
                Try Another Quiz
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setShowReview((v) => !v)}
              className="mt-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showReview ? "rotate-180" : ""}`} />
              {showReview ? "Hide" : "Review"} answers
            </button>
          </CardContent>
        </Card>

        {showReview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 space-y-3"
          >
            {questions.map((q, idx) => {
              const userAns = answers[idx] || "";
              const correctText = (q.answer || "").toString();
              const isCorrect =
                userAns && userAns.trim().toLowerCase() === correctText.trim().toLowerCase();
              return (
                <Card key={idx} className="border">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full text-white ${isCorrect ? "bg-green-500" : "bg-destructive"}`}>
                        {isCorrect ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      </span>
                      <p className="text-sm font-medium">
                        {idx + 1}. {cleanQuestionText(q.question || "")}
                      </p>
                    </div>
                    <div className="ml-8 space-y-1 text-xs">
                      {!isCorrect && userAns && (
                        <p className="text-destructive">Your answer: {userAns}</p>
                      )}
                      <p className="text-green-600 dark:text-green-400">
                        Correct: {correctText}
                      </p>
                      {q.explanation && (
                        <p className="text-muted-foreground mt-1.5 leading-relaxed">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default QuizResultScreen;
