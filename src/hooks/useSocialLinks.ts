import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SocialLinks {
  facebook: string;
  instagram: string;
  tiktok: string;
  twitter: string;
  youtube: string;
}

const defaultLinks: SocialLinks = {
  facebook: '',
  instagram: '',
  tiktok: '',
  twitter: '',
  youtube: '',
};

export const useSocialLinks = () => {
  return useQuery({
    queryKey: ['social-links'],
    queryFn: async (): Promise<SocialLinks> => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'social_links')
        .maybeSingle();

      if (error) throw error;
      return data?.value ? { ...defaultLinks, ...(data.value as unknown as SocialLinks) } : defaultLinks;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateSocialLinks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (links: SocialLinks) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ value: links as any, updated_at: new Date().toISOString() })
        .eq('key', 'social_links');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-links'] });
      toast.success('Social media links updated!');
    },
    onError: () => {
      toast.error('Failed to update social links');
    },
  });
};
