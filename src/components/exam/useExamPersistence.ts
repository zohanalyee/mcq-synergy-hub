import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

interface ExamPersistState {
  currentQuestion: number;
  answers: Record<number, string>;
  flaggedQuestions: number[];
  timeRemaining: number;
  savedAt: number;
}

interface UseExamPersistenceProps {
  sessionId: string | undefined;
  isSubmitted: boolean;
}

interface ExamStateSnapshot {
  currentQuestion: number;
  answers: Record<number, string>;
  flaggedQuestions: Set<number>;
  timeRemaining: number;
}

export function useExamPersistence({ sessionId, isSubmitted }: UseExamPersistenceProps) {
  const storageKey = sessionId ? `exam-state-${sessionId}` : null;
  const timerSaveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestState = useRef<ExamStateSnapshot | null>(null);

  // Save state to localStorage
  const saveState = useCallback(
    (state: ExamStateSnapshot) => {
      if (!storageKey || isSubmitted) return;
      const persistState: ExamPersistState = {
        currentQuestion: state.currentQuestion,
        answers: state.answers,
        flaggedQuestions: Array.from(state.flaggedQuestions),
        timeRemaining: state.timeRemaining,
        savedAt: Date.now(),
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(persistState));
      } catch {
        // localStorage full or unavailable – silent fail
      }
    },
    [storageKey, isSubmitted]
  );

  // Save on every interaction (call this from the parent)
  const persistNow = useCallback(
    (state: ExamStateSnapshot) => {
      latestState.current = state;
      // Save answers/question immediately, but time is batched
      if (!storageKey || isSubmitted) return;
      const persistState: ExamPersistState = {
        currentQuestion: state.currentQuestion,
        answers: state.answers,
        flaggedQuestions: Array.from(state.flaggedQuestions),
        timeRemaining: state.timeRemaining,
        savedAt: Date.now(),
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(persistState));
      } catch {
        // silent
      }
    },
    [storageKey, isSubmitted]
  );

  // Save timer every 5 seconds
  useEffect(() => {
    if (!storageKey || isSubmitted) return;

    timerSaveInterval.current = setInterval(() => {
      if (latestState.current) {
        saveState(latestState.current);
      }
    }, 5000);

    return () => {
      if (timerSaveInterval.current) clearInterval(timerSaveInterval.current);
    };
  }, [storageKey, isSubmitted, saveState]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (latestState.current && storageKey && !isSubmitted) {
        const persistState: ExamPersistState = {
          currentQuestion: latestState.current.currentQuestion,
          answers: latestState.current.answers,
          flaggedQuestions: Array.from(latestState.current.flaggedQuestions),
          timeRemaining: latestState.current.timeRemaining,
          savedAt: Date.now(),
        };
        try {
          localStorage.setItem(storageKey, JSON.stringify(persistState));
        } catch {
          // silent
        }
      }
    };
  }, [storageKey, isSubmitted]);

  // Restore state on mount
  const restoreState = useCallback((): ExamPersistState | null => {
    if (!storageKey) return null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const saved: ExamPersistState = JSON.parse(raw);
      // Only restore if saved less than 4 hours ago
      if (Date.now() - saved.savedAt > 4 * 60 * 60 * 1000) {
        localStorage.removeItem(storageKey);
        return null;
      }
      toast.info("Session restored from where you left off", { duration: 3000 });
      return saved;
    } catch {
      return null;
    }
  }, [storageKey]);

  // Clear on submit
  const clearState = useCallback(() => {
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // silent
      }
    }
  }, [storageKey]);

  return { persistNow, restoreState, clearState };
}
