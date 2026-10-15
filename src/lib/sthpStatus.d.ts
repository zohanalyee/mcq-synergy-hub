export declare function getSthpFacts(): {
  applyBy: string;
  testDate: string;
  testDateIso: string | null;
  applyUrl: string;
};
export declare function sthpIsUpcoming(now?: number): boolean;
export declare function sthpStatusSentence(now?: number): string;
export declare function sthpMetaSentence(now?: number): string;
