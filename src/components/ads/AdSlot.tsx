import { useEffect, useRef } from 'react';
import { AD_CLIENT, AD_SLOTS, AdSurface, isAdHost } from '@/config/ads';

interface AdSlotProps {
  /** Which configured surface this unit belongs to. */
  surface: AdSurface;
  /** Optional label for the "Advertisement" caption (policy: ads must be clearly identifiable). */
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * A single responsive AdSense display unit.
 *
 * - Renders only on the published domain (see `isAdHost`).
 * - Renders nothing when the surface has no slot ID configured yet.
 * - Shows a labelled placeholder in dev/preview so layout can be reviewed.
 * - Reserves height via `min-h` to avoid layout shift (CLS).
 */
const AdSlot = ({ surface, className = '' }: AdSlotProps) => {
  const slot = AD_SLOTS[surface];
  const pushed = useRef(false);
  const live = isAdHost() && Boolean(slot);

  useEffect(() => {
    if (!live || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* AdSense script blocked or not yet loaded — fail silently. */
    }
  }, [live]);

  if (!live) {
    if (import.meta.env.PROD) return null;
    return (
      <div
        className={`my-6 min-h-[100px] w-full rounded-lg border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center text-muted-foreground ${className}`}
      >
        <p className="text-xs font-medium">Ad slot (preview only)</p>
        <p className="text-[10px]">surface: {surface}</p>
      </div>
    );
  }

  return (
    <div className={`my-6 w-full ${className}`}>
      <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground text-center">
        Advertisement
      </p>
      <ins
        className="adsbygoogle block w-full min-h-[100px]"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdSlot;
