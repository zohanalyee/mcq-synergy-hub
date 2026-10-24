export interface PastPaperPage {
  slug: string; exam: 'nthp' | 'sthp'; examLabel: string; title: string; description: string; h1: string;
  intro: string[]; officialHeading: string; officialStatus: string[];
  official: { label: string; url: string }[]; guess: string;
  faqs: { question: string; answer: string }[]; disclaimer: string;
}
export const PAST_PAPER_PAGES: PastPaperPage[];
export const PAST_PAPER_PATHS: string[];
export function getPastPaperPage(exam: string): PastPaperPage | null;
