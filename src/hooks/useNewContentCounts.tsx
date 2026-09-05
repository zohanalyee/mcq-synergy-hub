import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NewContentCounts {
  jobs: number;
  scholarships: number;
}

/**
 * Single lightweight query that returns BOTH the "new jobs" and "new scholarships"
 * badge counts for the header/sidebar. Replaces two separate count-head requests.
 * Cached long (and persisted across route changes) — these badges are cosmetic.
 */
export function useNewContentCounts() {
  return useQuery<NewContentCounts>({
    queryKey: ['new-content-counts'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('content_items')
        .select('category')
        .in('category', ['job', 'scholarship'])
        .eq('status', 'approved')
        .gte('created_at', sevenDaysAgo.toISOString())
        .limit(1000);

      if (error) {
        console.error('Error fetching new content counts:', error);
        return { jobs: 0, scholarships: 0 };
      }

      let jobs = 0;
      let scholarships = 0;
      for (const row of data ?? []) {
        if (row.category === 'job') jobs++;
        else if (row.category === 'scholarship') scholarships++;
      }
      return { jobs, scholarships };
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
