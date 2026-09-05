import { useNewContentCounts } from '@/hooks/useNewContentCounts';

/** Derived from the single merged counts query — no extra network request. */
export function useNewScholarshipsCount() {
  const query = useNewContentCounts();
  return { ...query, data: query.data?.scholarships ?? 0 };
}
