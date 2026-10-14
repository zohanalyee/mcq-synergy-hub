export const SIBLING_WINDOW: number;
export function hubPathOf(topicPath: string): string;
export function topicLinks(
  order: Record<string, string[]>,
  topicPath: string,
): { hub: string; prev: string | null; next: string | null; siblings: string[] };
export function humanizeSlug(slug: string): string;
