/**
 * Guest result carry-forward.
 *
 * When a guest finishes a test we stash a compact result payload in
 * localStorage (survives tab close, unlike the sessionStorage guest session).
 * After the guest signs in / signs up, `GuestResultCarryForward` picks it up
 * and persists the attempt to the database so their work is never lost.
 */

const KEY = 'mcqsai_pending_guest_result';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface PendingGuestResult {
  testName: string;
  testType: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
  subjects: string[];
  answers: Record<string, string>;
  questionIds: string[];
  returnPath?: string;
  savedAt: number;
}

export const savePendingGuestResult = (
  data: Omit<PendingGuestResult, 'savedAt'>,
): void => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {
    // storage full / private mode — carry-forward simply won't happen
  }
};

export const loadPendingGuestResult = (): PendingGuestResult | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingGuestResult;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      clearPendingGuestResult();
      return null;
    }
    return parsed;
  } catch {
    clearPendingGuestResult();
    return null;
  }
};

export const clearPendingGuestResult = (): void => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
};

export const hasPendingGuestResult = (): boolean => loadPendingGuestResult() !== null;
