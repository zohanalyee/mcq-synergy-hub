import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useSocialLinks } from '@/hooks/useSocialLinks';
import { WhatsAppIcon } from '@/components/WhatsAppChannelCTA';

const HIDDEN_PREFIXES = ['/test-session', '/quiz-player', '/admin', '/auth', '/sign-in', '/sign-up'];
const DISMISS_KEY = 'mcqsai_wa_fab_dismissed';
const HEADLINES = [
  '📢 Daily Govt Jobs & Alerts',
  '🎓 Sukkur IBA STHP & Scholarships',
  '⚡ MDCAT & Past Paper Mock Tests',
  '📝 Daily Solved MCQs & Answer Keys',
];

/** Floating "Join WhatsApp Channel" button with rotating headlines; hidden during tests and admin. */
const WhatsAppFloatingButton = () => {
  const { pathname } = useLocation();
  const { data } = useSocialLinks();
  const [idx, setIdx] = useState(0);
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % HEADLINES.length), 3500);
    return () => clearInterval(t);
  }, []);
  const url = data?.whatsapp;
  if (!url || dismissed || HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const close = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  return (
    <div className="fixed right-3 bottom-20 lg:bottom-6 lg:right-6 z-40 flex items-center gap-1.5">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join MCQsAI WhatsApp Channel for daily papers and answer keys"
        className="group flex items-center gap-2 rounded-full bg-brand-gradient text-primary-foreground shadow-lg pl-2 pr-3 py-2 hover:scale-105 transition-transform"
      >
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-background/20">
          <span className="absolute inset-0 rounded-full bg-background/30 animate-ping" aria-hidden="true" />
          <WhatsAppIcon className="relative h-5 w-5" />
        </span>
        <span className="text-xs font-semibold leading-tight min-w-[150px] sm:min-w-[190px]" aria-live="off">
          <span key={idx} className="block animate-fade-in whitespace-nowrap">{HEADLINES[idx]}</span>
          <span className="block text-[10px] font-normal opacity-90">Join WhatsApp</span>
        </span>
      </a>
      <button
        type="button"
        onClick={close}
        aria-label="Close WhatsApp button"
        className="h-6 w-6 rounded-full bg-card border border-border text-muted-foreground flex items-center justify-center shadow hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default WhatsAppFloatingButton;
