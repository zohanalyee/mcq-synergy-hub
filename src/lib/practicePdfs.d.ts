export interface PracticePdf {
  slug: string; exam: 'nthp' | 'sthp'; examLabel: string; title: string; description: string; h1: string;
  hub: { label: string; to: string }; mockTest: { label: string; to: string }; file: string;
  intro: string[]; sections: { section: string; count: number }[];
  preview: { q: string; options: string[]; answer: string; why: string }[];
  faqs: { question: string; answer: string }[]; official: { label: string; url: string }[]; disclaimer: string;
}
export const SITE: string;
export const CHANNEL_FALLBACK: string;
export const PDF_VERIFIED_ON: string;
export const PRACTICE_PDFS: PracticePdf[];
export const STHP_OFFICIAL_SAMPLES: { label: string; url: string }[];
export const PRACTICE_PDF_PATHS: string[];
export function getPracticePdf(slug: string | undefined): PracticePdf | null;
export function getPracticePdfByExam(exam: string): PracticePdf | null;
export function pdfShareUrl(pdf: PracticePdf): string;
export function bodyWordCount(pdf: PracticePdf): number;
