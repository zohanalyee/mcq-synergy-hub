import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import snapshot from '@/data/whatsappChannelSnapshot.json';
import { whatsappChannelUrl } from '@/lib/growthRules';
import { toast } from 'sonner';

export const useWhatsAppChannel = () => useQuery({
  queryKey: ['whatsapp-channel-url'],
  queryFn: async () => {
    const { data, error } = await supabase.from('system_settings').select('value').eq('key', 'whatsapp_channel_url').maybeSingle();
    if (error) throw error;
    return whatsappChannelUrl(data?.value);
  },
  initialData: whatsappChannelUrl(snapshot),
  initialDataUpdatedAt: 0,
  staleTime: 5 * 60 * 1000,
});

export function useUpdateWhatsAppChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (value: string) => {
      const url = whatsappChannelUrl(value);
      if (value.trim() && !url) throw new Error('Enter an HTTPS WhatsApp channel URL.');
      const { error } = await supabase.from('system_settings').upsert({ key: 'whatsapp_channel_url', value: url, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['whatsapp-channel-url'] }); toast.success('Join Alerts link saved'); },
    onError: () => toast.error('Could not save Join Alerts link'),
  });
}