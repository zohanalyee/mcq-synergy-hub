export function whatsappChannelUrl(value: unknown): string;
export function whatsappResultUrl(testName: string, percentage: number, path: string | null): string | null;
export function scoreBand(percentage: number): '0-39' | '40-59' | '60-79' | '80-100';
export function createAttemptTracker(params: { test_slug: string; exam_category: string }, emit: (name: string, params: Record<string, string | number | boolean>) => void): {
  start(): void; finish(): void; abandon(): void;
  complete(extra: Record<string, string | number | boolean>): void;
};
export function normalizeGaPath(path: string): string;
export function isAdminPath(path: string): boolean;
