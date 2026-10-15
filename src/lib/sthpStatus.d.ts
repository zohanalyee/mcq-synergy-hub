type Snap = { slug: string; test_date?: string | null; facts?: Record<string, unknown> }[];
export declare function getSthpFacts(snapshot: Snap): { applyBy: string; testDate: string; testDateIso: string | null; applyUrl: string };
export declare function sthpIsUpcoming(snapshot: Snap, now?: number): boolean;
export declare function sthpStatusSentence(snapshot: Snap, now?: number): string;
export declare function sthpMetaSentence(snapshot: Snap, now?: number): string;
