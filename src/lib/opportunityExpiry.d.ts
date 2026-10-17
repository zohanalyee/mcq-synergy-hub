export const EXPIRED_GRACE_DAYS: number;
export const NO_DEADLINE_MAX_AGE_DAYS: number;
export function pakistanToday(now?: Date): string;
export function isListingExpired(
  listing?: { deadline?: string | null; created_at?: string | null },
  today?: string,
): boolean;
