import { useEffect, useState, useRef } from 'react';

export type ScrollDirection = 'up' | 'down';

interface Options {
  /** Minimum delta in px before a direction change is committed. */
  threshold?: number;
  /** Don't hide when within this many px from the top. */
  topOffset?: number;
}

/**
 * Tracks vertical scroll direction with hysteresis so the navbars don't
 * flicker on tiny scroll wobbles. Returns 'up' on scroll up (show nav) and
 * 'down' on scroll down past `topOffset` (hide nav). Always 'up' near the top.
 */
export function useScrollDirection({ threshold = 8, topOffset = 80 }: Options = {}) {
  const [direction, setDirection] = useState<ScrollDirection>('up');
  const lastY = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const ticking = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const update = () => {
      const y = window.scrollY;
      const diff = y - lastY.current;

      if (y < topOffset) {
        if (direction !== 'up') setDirection('up');
        lastY.current = y;
        ticking.current = false;
        return;
      }

      if (Math.abs(diff) >= threshold) {
        const next: ScrollDirection = diff > 0 ? 'down' : 'up';
        if (next !== direction) setDirection(next);
        lastY.current = y;
      }
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(update);
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [direction, threshold, topOffset]);

  return direction;
}
