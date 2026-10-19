import { Button } from '@/components/ui/button';
import { WhatsAppIcon } from '@/components/WhatsAppChannelCTA';
import { whatsappResultUrl } from '@/lib/growthRules';
import { trackResultShare } from '@/lib/growthEvents';

export default function WhatsAppResultShare({ testName, percentage, path }: { testName: string; percentage: number; path: string | null }) {
  const url = whatsappResultUrl(testName, percentage, path);
  if (!url) return null;
  return <Button asChild variant="outline"><a href={url} target="_blank" rel="noopener" onClick={() => trackResultShare('whatsapp')}><WhatsAppIcon className="mr-2 h-4 w-4" />Share my result on WhatsApp</a></Button>;
}