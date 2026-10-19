import { useWhatsAppChannel } from '@/hooks/useWhatsAppChannel';
import { trackWhatsAppJoin } from '@/lib/growthEvents';

export default function JoinAlertsLink({ placement, className = 'text-sm text-primary hover:underline' }: { placement: string; className?: string }) {
  const { data: url } = useWhatsAppChannel();
  if (!url) return null;
  return <a href={url} rel="noopener" className={className} onClick={() => trackWhatsAppJoin(placement)}>Join Alerts</a>;
}