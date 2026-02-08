import { useRef, useCallback } from "react";
import { toast } from "sonner";

interface UseExamMotivationProps {
  totalQuestions: number;
}

export function useExamMotivation({ totalQuestions }: UseExamMotivationProps) {
  const answerTimestamps = useRef<number[]>([]);
  const triggeredMilestones = useRef<Set<number>>(new Set());
  const questionArrivalTime = useRef<number>(Date.now());
  const lastSpeedToastQuestion = useRef<number>(-5);

  const resetMotivation = useCallback(() => {
    answerTimestamps.current = [];
    triggeredMilestones.current = new Set();
    questionArrivalTime.current = Date.now();
    lastSpeedToastQuestion.current = -5;
  }, []);

  const markQuestionArrival = useCallback(() => {
    questionArrivalTime.current = Date.now();
  }, []);

  const onAnswer = useCallback(
    (answeredCount: number, questionIndex: number) => {
      const now = Date.now();
      answerTimestamps.current.push(now);

      // --- Streak Detection ---
      const timestamps = answerTimestamps.current;
      if (timestamps.length >= 3) {
        const last3 = timestamps.slice(-3);
        const elapsed = last3[2] - last3[0];
        if (elapsed <= 120_000) {
          toast("🔥 On Fire! 3 in a row!", {
            duration: 3000,
            position: "bottom-center",
          });
        }
      }

      // --- Speed Detection ---
      const timeSinceArrival = now - questionArrivalTime.current;
      if (
        timeSinceArrival <= 10_000 &&
        questionIndex - lastSpeedToastQuestion.current >= 5
      ) {
        lastSpeedToastQuestion.current = questionIndex;
        toast("⚡ Speedster!", {
          duration: 2000,
          position: "bottom-center",
        });
      }

      // --- Milestone Detection ---
      if (totalQuestions > 0) {
        const pct = Math.round((answeredCount / totalQuestions) * 100);
        const milestones: Record<number, string> = {
          25: "🚀 Great start! Keep it up!",
          50: "💪 Halfway there! Keep pushing!",
          75: "🏁 Almost done! Finish strong!",
        };

        for (const [threshold, message] of Object.entries(milestones)) {
          const t = Number(threshold);
          if (pct >= t && !triggeredMilestones.current.has(t)) {
            triggeredMilestones.current.add(t);
            toast(message, {
              duration: 3000,
              position: "bottom-center",
            });
          }
        }
      }
    },
    [totalQuestions]
  );

  return { onAnswer, markQuestionArrival, resetMotivation };
}
