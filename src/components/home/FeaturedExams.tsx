import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Building2, FileText, Timer, Bell, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import snapshot from '@/generated/featuredCards.json';
import examSnapshot from '@/data/examFactsSnapshot.json';
import { visibleCards, pkToday, whatsappAlertUrl, type FeaturedCard } from '@/lib/featuredCards';
import { useWhatsAppChannel } from '@/hooks/useWhatsAppChannel';
import { trackFeaturedClick, trackFeaturedWhatsApp } from '@/lib/growthEvents';
import { cn } from '@/lib/utils';

const ICONS: Record<string, typeof Bell> = { GraduationCap, Building2, FileText, Timer, Bell, Sparkles };
const FACTS: Record<string, any> = Object.fromEntries(
  (examSnapshot as { slug: string; facts: any }[]).map((r) => [r.slug, r.facts]),
);
const SNAP = snapshot as { generatedAt: number; enabled: boolean; cards: FeaturedCard[] };

export default function FeaturedExams({ placement, className }: { placement: 'home' | 'exams'; className?: string }) {
  // First render uses the build date so prerendered HTML and hydration match.
  const [today, setToday] = useState(() => pkToday(SNAP.generatedAt || 0));
  const [cards, setCards] = useState<FeaturedCard[]>(SNAP.cards);
  const [enabled, setEnabled] = useState(SNAP.enabled);
  const { data: channel } = useWhatsAppChannel();
  const initialCount = visibleCards(SNAP.cards, placement, FACTS, pkToday(SNAP.generatedAt || 0), SNAP.enabled).length;

  useEffect(() => {
    setToday(pkToday(Date.now()));
    let off = false;
    Promise.all([
      (supabase as any).from('featured_cards').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('system_settings').select('value').eq('key', 'featured_block_enabled').maybeSingle(),
    ]).then(([c, f]: any[]) => {
      if (off) return;
      if (!c.error && Array.isArray(c.data)) setCards(c.data);
      if (!f.error) setEnabled(f.data ? f.data.value !== false : true);
    }).catch(() => {});
    return () => { off = true; };
  }, []);

  const list = visibleCards(cards, placement, FACTS, today, enabled);
  if (!list.length && !initialCount) return null;
  const source = placement === 'home' ? 'homepage' : 'exams';

  return (
    <section
      aria-label="Featured exams"
      className={cn('featured-exams grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 text-left', className)}
      style={{ minHeight: list.length ? undefined : `${initialCount * 72}px` }}
    >
      {list.map(({ card, state }, i) => {
        const slot = `${placement}-${i + 1}`;
        const Icon = ICONS[card.icon || ''] || Sparkles;
        const soon = card.badge === 'COMING SOON';
        const live = !state.closed && (state.badge === 'LIVE' || state.badge === 'APPLY NOW' || state.badge === 'CLOSING SOON');
        const external = card.href.startsWith('https://');
        const body = (
          <>
            <span className="fe-icon"><Icon className="h-4 w-4" aria-hidden /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide">
                {live && <span className="fe-dot" aria-hidden />}
                <span className={cn('fe-badge', state.closed && 'fe-badge-closed')}>{state.badge}</span>
                {state.note && <span className="text-muted-foreground font-medium">· {state.note}</span>}
              </span>
              <span className="block truncate text-sm font-semibold text-foreground">{card.title}</span>
              <span className="block truncate text-xs text-muted-foreground">{card.subtitle}</span>
            </span>
            {!soon && <span className="fe-cta" aria-hidden><ArrowRight className="h-4 w-4" /></span>}
          </>
        );
        const onClick = () => trackFeaturedClick(slot, card.title, state.badge);
        return (
          <div key={card.id || card.href} className={cn('fe-card', soon && 'fe-soon', state.closed && 'opacity-70')}>
            {external ? (
              <a href={card.href} rel="noopener" target="_blank" className="fe-link" onClick={onClick}>{body}</a>
            ) : (
              <Link to={card.href} className="fe-link" onClick={onClick}>{body}</Link>
            )}
            {soon && (
              <a
                href={whatsappAlertUrl(channel, source)}
                rel="noopener"
                target="_blank"
                className="fe-wa"
                onClick={() => trackFeaturedWhatsApp(slot)}
              >
                <Bell className="h-3.5 w-3.5" aria-hidden /> Get WhatsApp alert
              </a>
            )}
          </div>
        );
      })}
    </section>
  );
}
