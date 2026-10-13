import { useRef, useCallback } from "react";
import { toast } from "sonner";

interface UseExamMotivationProps {
  totalQuestions: number;
}

// One shared toast slot: every new cheer replaces the previous one,
// so messages never stack or cover the exam controls.
const MOTIVATION_TOAST_ID = "exam-motivation";
const MIN_GAP_MS = 8_000;

export function useExamMotivation({ totalQuestions }: UseExamMotivationProps) {
  const answerTimestamps = useRef<number[]>([]);
  const triggeredMilestones = useRef<Set<number>>(new Set());
  const questionArrivalTime = useRef<number>(Date.now());
  const lastSpeedToastQuestion = useRef<number>(-10);
  const streakCount = useRef(0);
  const lastToastAt = useRef(0);

  const resetMotivation = useCallback(() => {
    answerTimestamps.current = [];
    triggeredMilestones.current = new Set();
    questionArrivalTime.current = Date.now();
    lastSpeedToastQuestion.current = -10;
    streakCount.current = 0;
    lastToastAt.current = 0;
  }, []);

  const markQuestionArrival = useCallback(() => {
    questionArrivalTime.current = Date.now();
  }, []);

  const show = (message: string, force = false) => {
    const now = Date.now();
    if (!force && now - lastToastAt.current < MIN_GAP_MS) return;
    lastToastAt.current = now;
    toast(message, {
      id: MOTIVATION_TOAST_ID,
      duration: 1800,
      position: "top-center",
      className: "!py-2 !px-3 !text-xs !font-medium !w-auto !min-w-0",
    });
  };

  const onAnswer = useCallback(
    (answeredCount: number, questionIndex: number) => {
      const now = Date.now();
      const prev = answerTimestamps.current[answerTimestamps.current.length - 1];
      answerTimestamps.current.push(now);

      // Milestones take priority (shown once each)
      if (totalQuestions > 0) {
        const pct = Math.round((answeredCount / totalQuestions) * 100);
        const milestones: [number, string][] = [
          [75, "🏁 Almost done — finish strong!"],
          [50, "💪 Halfway there!"],
          [25, "🚀 Great start!"],
        ];
        for (const [t, msg] of milestones) {
          if (pct >= t && !triggeredMilestones.current.has(t)) {
            milestones.forEach(([m]) => m <= t && triggeredMilestones.current.add(m));
            show(msg, true);
            return;
          }
        }
      }

      // Streak: consecutive answers within 40s each; cheer only at 5, 10, 15…
      streakCount.current = prev && now - prev <= 40_000 ? streakCount.current + 1 : 1;
      if (streakCount.current >= 5 && streakCount.current % 5 === 0) {
        show(`🔥 ${streakCount.current} in a row!`);
        return;
      }

      // Speed: at most once every 10 questions
      if (
        now - questionArrivalTime.current <= 8_000 &&
        questionIndex - lastSpeedToastQuestion.current >= 10
      ) {
        lastSpeedToastQuestion.current = questionIndex;
        show("⚡ Speedster!");
      }
    },
    [totalQuestions]
  );

  return { onAnswer, markQuestionArrival, resetMotivation };
}
