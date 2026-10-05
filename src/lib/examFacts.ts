import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import snapshot from '@/data/examFactsSnapshot.json';

/**
 * Exam page facts (dates, duration, eligibility, official links…) live in the
 * exam_pages table so admins can edit them without a code change.
 * Resolution order: code defaults <- build-time snapshot <- live DB row.
 * The snapshot keeps prerendered HTML in sync with the DB at publish time;
 * the live row makes admin edits visible to visitors immediately.
 */
export interface ExamPageRow {
  slug: string;
  kind: string;
  facts: Record<string, unknown>;
  test_date: string | null;
  verified_on: string | null;
  include_in_sitemap: boolean;
  status?: string;
}

const SNAPSHOT: Record<string, ExamPageRow> = Object.fromEntries(
  (snapshot as ExamPageRow[]).map((r) => [r.slug, r]),
);

export const getExamSnapshot = (slug: string): ExamPageRow | undefined => SNAPSHOT[slug];

/** Real test date (Pakistan midnight) from the snapshot, or the given fallback. */
export const getExamTestDate = (slug: string, fallbackIso: string): Date => {
  const iso = SNAPSHOT[slug]?.test_date || fallbackIso;
  return new Date(`${iso}T00:00:00+05:00`);
};

const merge = <T extends object>(base: T, facts?: Record<string, unknown>): T =>
  facts ? ({ ...base, ...facts } as T) : base;

export function useExamFacts<T extends object>(slug: string, base: T): T;
export function useExamFacts<T extends object>(slug: string, base: T | null): T | null;
export function useExamFacts<T extends object>(slug: string, base: T | null): T | null {
  const { data } = useQuery({
    queryKey: ['exam-page', slug],
    enabled: !!slug && !!base && typeof window !== 'undefined',
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('exam_pages')
        .select('facts')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();
      if (error) throw error;
      return (data?.facts ?? null) as Record<string, unknown> | null;
    },
  });
  if (!base) return null;
  return merge(base, data ?? SNAPSHOT[slug]?.facts);
}
