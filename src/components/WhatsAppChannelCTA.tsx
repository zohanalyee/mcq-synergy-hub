import { Button } from '@/components/ui/button';
import { useSocialLinks } from '@/hooks/useSocialLinks';

export const WhatsAppIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 01-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.43 9.43 0 01-1.45-5.03c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.89.98 6.68 2.77a9.38 9.38 0 012.76 6.68c0 5.21-4.24 9.44-9.45 9.44zm8.04-17.48A11.3 11.3 0 0012.05.7C5.79.7.69 5.8.69 12.07c0 2 .52 3.96 1.52 5.68L.6 23.3l5.69-1.49a11.33 11.33 0 005.43 1.38h.01c6.26 0 11.36-5.1 11.36-11.36 0-3.04-1.18-5.89-3.33-8.04z" />
  </svg>
);

interface Props { message: string }

/** Follow-our-WhatsApp-channel callout; link comes from admin Social Links. */
const WhatsAppChannelCTA = ({ message }: Props) => {
  const { data } = useSocialLinks();
  const url = data?.whatsapp;
  if (!url) return null;
  return (
    <div className="my-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
      <div className="flex items-center gap-2 flex-1 text-sm text-foreground">
        <WhatsAppIcon className="h-6 w-6 shrink-0 text-primary" />
        <span>{message}</span>
      </div>
      <Button asChild size="sm" className="shrink-0">
        <a href={url} target="_blank" rel="noopener noreferrer">Join Channel</a>
      </Button>
    </div>
  );
};

export default WhatsAppChannelCTA;
