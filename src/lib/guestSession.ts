/**
 * Guest session — single source of truth.
 *
 * Every guest quiz / test / mock test stores its session under exactly
 * one sessionStorage key:
 *
 *     mcqsai_guest_session_{id}
 *
 * Older keys (mcqsai_guest_quiz_, mcqsai_guest_test_) are still accepted
 * by `loadGuestSession` for back-compat with already-open tabs, and are
 * silently migrated to the canonical key.
 */

export const GUEST_SESSION_PREFIX = 'mcqsai_guest_session_';
const LEGACY_PREFIXES = ['mcqsai_guest_quiz_', 'mcqsai_guest_test_'];

export interface GuestSession {
  id: string;
  session_name?: string;
  questions: any[];
  time_limit: number;
  subjects: string[];
  topics: string[];
  difficulty_levels?: string[];
  question_count?: number;
  is_active: true;
  [k: string]: any;
}

export const createGuestSessionId = (): string => {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `guest-${rnd}`;
};

export const buildGuestSession = (input: {
  id?: string;
  questions: any[];
  time_limit: number;
  subjects?: string[];
  topics?: string[];
  session_name?: string;
  difficulty_levels?: string[];
}): GuestSession => ({
  id: input.id ?? createGuestSessionId(),
  session_name: input.session_name ?? 'Practice',
  questions: input.questions ?? [],
  time_limit: input.time_limit,
  subjects: input.subjects ?? [],
  topics: input.topics ?? [],
  difficulty_levels: input.difficulty_levels ?? ['Easy', 'Medium', 'Hard'],
  question_count: input.questions?.length ?? 0,
  is_active: true,
});

export const saveGuestSession = (session: GuestSession): void => {
  try {
    sessionStorage.setItem(
      `${GUEST_SESSION_PREFIX}${session.id}`,
      JSON.stringify(session),
    );
  } catch {
    // sessionStorage may be unavailable (private mode); ignore.
  }
};

/**
 * Load a guest session by id. Tries the canonical key first, then the
 * legacy keys. If found via a legacy key, it is migrated to the
 * canonical key so subsequent reads are consistent.
 */
export const loadGuestSession = (id: string): GuestSession | null => {
  if (!id) return null;
  try {
    let raw = sessionStorage.getItem(`${GUEST_SESSION_PREFIX}${id}`);
    let usedLegacy = false;

    if (!raw) {
      for (const prefix of LEGACY_PREFIXES) {
        const legacy = sessionStorage.getItem(`${prefix}${id}`);
        if (legacy) {
          raw = legacy;
          usedLegacy = true;
          break;
        }
      }
    }

    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestSession;
    if (usedLegacy) {
      try {
        sessionStorage.setItem(
          `${GUEST_SESSION_PREFIX}${id}`,
          JSON.stringify(parsed),
        );
      } catch {}
    }
    return parsed;
  } catch {
    return null;
  }
};
