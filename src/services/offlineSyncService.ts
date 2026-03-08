import { supabase } from "@/integrations/supabase/client";

const CACHE_PREFIX = 'mcq_cache_';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedQuestionSet {
  questions: any[];
  timestamp: number;
  subjectName: string;
  subjectId: string;
}

export interface SyncStatus {
  synced: boolean;
  count: number;
  lastSync: Date | null;
}

/**
 * Get cached questions for a subject from localStorage
 * Returns null if cache is stale (>24h) or missing
 */
export const getCachedQuestions = (subjectId: string): CachedQuestionSet | null => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${subjectId}`);
    if (!raw) return null;

    const cached: CachedQuestionSet = JSON.parse(raw);
    const age = Date.now() - cached.timestamp;

    if (age > CACHE_EXPIRY_MS) {
      localStorage.removeItem(`${CACHE_PREFIX}${subjectId}`);
      return null;
    }

    return cached;
  } catch {
    return null;
  }
};

/**
 * Store questions in localStorage cache
 */
export const setCachedQuestions = (
  subjectId: string,
  subjectName: string,
  questions: any[]
): void => {
  try {
    const data: CachedQuestionSet = {
      questions,
      timestamp: Date.now(),
      subjectName,
      subjectId,
    };
    localStorage.setItem(`${CACHE_PREFIX}${subjectId}`, JSON.stringify(data));
  } catch (e) {
    // localStorage full — silently fail
    console.warn('Offline cache write failed (storage full?):', e);
  }
};

/**
 * Get sync status for a subject
 */
export const getSyncStatus = (subjectId: string): SyncStatus => {
  const cached = getCachedQuestions(subjectId);
  return {
    synced: !!cached && cached.questions.length > 0,
    count: cached?.questions.length ?? 0,
    lastSync: cached ? new Date(cached.timestamp) : null,
  };
};

/**
 * Sync questions for a single subject (DB-only, no AI cost)
 */
export const syncSubjectQuestions = async (
  subjectId: string,
  subjectName: string
): Promise<number> => {
  // Skip if already cached and fresh
  const existing = getCachedQuestions(subjectId);
  if (existing && existing.questions.length > 0) {
    return existing.questions.length;
  }

  try {
    const { data, error } = await supabase.functions.invoke('generate-test', {
      body: {
        topic: subjectName,
        difficulty: 'Medium',
        question_count: 20,
        forceNew: false,
        fetch_only: true,
        partial_mode: false,
      },
    });

    if (error || !data?.questions) return 0;

    setCachedQuestions(subjectId, subjectName, data.questions);
    return data.questions.length;
  } catch {
    return 0;
  }
};

/**
 * Background sync all subjects with rate-limit delay
 * Returns a callback to abort
 */
export const syncAllSubjects = async (
  subjects: { id?: string; title: string }[],
  onProgress?: (synced: number, total: number) => void
): Promise<void> => {
  const total = subjects.length;
  let synced = 0;

  for (const subject of subjects) {
    if (!subject.id) continue;

    await syncSubjectQuestions(subject.id, subject.title);
    synced++;
    onProgress?.(synced, total);

    // 500ms delay between subjects to avoid rate-limiting
    await new Promise((r) => setTimeout(r, 500));
  }
};
