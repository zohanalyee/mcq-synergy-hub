export interface FeaturedCard {
  id?: string; title: string; subtitle: string; badge: string; href: string;
  deadline_date?: string | null; exam_slug?: string | null; closed_days?: number;
  sort_order?: number; is_active: boolean; icon?: string | null; placements: 'home' | 'exams' | 'both';
}
export interface CardState { badge: string; note: string; closed: boolean; deadline: string | null }
export const BADGES: string[];
export const ICONS: string[];
export const CLOSING_SOON_DAYS: number;
export const WHATSAPP_FALLBACK: string;
export function pkToday(nowMs: number): string;
export function daysBetween(a: string, b: string): number;
export function parseDateText(t: unknown): string | null;
export function resolveDeadline(card: FeaturedCard, facts: Record<string, any>, today: string): string | null;
export function isValidHref(href: unknown): boolean;
export function cardState(card: FeaturedCard, facts: Record<string, any>, today: string): CardState | null;
export function visibleCards(cards: FeaturedCard[], placement: 'home' | 'exams', facts: Record<string, any>, today: string, enabled?: boolean): { card: FeaturedCard; state: CardState }[];
export function whatsappAlertUrl(base: string | null | undefined, source: string): string;
