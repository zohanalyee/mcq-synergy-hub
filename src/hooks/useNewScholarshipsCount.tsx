import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useNewScholarshipsCount() {
  return useQuery({
    queryKey: ['new-scholarships-count'],
    queryFn: async () => {
      // Get scholarships posted in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count, error } = await supabase
        .from('content_items')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'scholarship')
        .eq('status', 'approved')
        .gte('created_at', sevenDaysAgo.toISOString());
      
      if (error) {
        console.error('Error fetching new scholarships count:', error);
        return 0;
      }
      
      return count || 0;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}
