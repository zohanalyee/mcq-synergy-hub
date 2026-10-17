export interface ProgramRound {
  name: string;
  sponsor: string;
  url: string;
  opens: string;
  closes: string;
  closesIso: string;
  next: string;
}
export function isRoundClosed(closesIso: string | null | undefined, now?: number): boolean;
export function withRoundStatus<T extends { closesIso?: string }>(programs: T[] | undefined, now?: number): (T & { closed: boolean })[];
export function isNthpTest(organization?: string | null, title?: string | null): boolean;
export function isStsTest(organization?: string | null, title?: string | null): boolean;
