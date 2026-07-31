import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  loadPendingGuestResult,
  clearPendingGuestResult,
} from '@/lib/guestResultCarry';
import { processTestCompletion } from '@/utils/gamification';

/**
 * Watches for a guest test result stashed before sign-in and persists it to
 * the account as soon as the user is authenticated. Renders nothing.
 */
const GuestResultCarryForward = () => {
  const { user } = useAuth();
  const runningRef = useRef(false);

  useEffect(() => {
    if (!user || runningRef.current) return;
    const pending = loadPendingGuestResult();
    if (!pending) return;

    runningRef.current = true;
    (async () => {
      try {
        await processTestCompletion({
          score: pending.score,
          totalQuestions: pending.totalQuestions,
          timeTaken: pending.timeTaken,
          testType: pending.testType || 'custom_quiz',
          subjects: pending.subjects || [],
          answers: pending.answers || {},
          questionIds: pending.questionIds || [],
        });
        clearPendingGuestResult();
        const pct =
          pending.totalQuestions > 0
            ? Math.round((pending.score / pending.totalQuestions) * 100)
            : 0;
        toast.success('Your earlier test has been saved! 🎉', {
          description: `${pending.testName} — ${pending.score}/${pending.totalQuestions} (${pct}%) · آپ کا پچھلا ٹیسٹ محفوظ ہو گیا`,
          duration: 7000,
        });
      } catch (e) {
        console.warn('[GuestResultCarryForward] save failed:', e);
      } finally {
        runningRef.current = false;
      }
    })();
  }, [user]);

  return null;
};

export default GuestResultCarryForward;
