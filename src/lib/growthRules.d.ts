export function whatsappChannelUrl(value: unknown): string;
export function whatsappResultUrl(testName: string, percentage: number, path: string | null): string | null;
export function createAttemptTracker(params: { test_slug: string; exam_category: string }, emit: (name: string, params: Record<string, string>) => void): {
  start(): void; finish(): void; abandon(): void; resume(): void;
};