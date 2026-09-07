import { Suspense, useEffect, useRef, useState } from 'react';

interface DeferredSectionProps {
  /** Reserved height kept in place so mounting the section cannot shift the page. */
  minHeight: number;
  /** How early (before entering the viewport) the section should mount. */
  rootMargin?: string;
  children: React.ReactNode;
}

/**
 * Mounts below-the-fold homepage sections only when they approach the viewport.
 * During prerender (no window / no IntersectionObserver) only the reserved
 * placeholder is emitted, so no lazy child can suspend server-side.
 * Purely a loading strategy — no visual or brand change.
 */
const DeferredSection = ({ minHeight, rootMargin = '300px 0px', children }: DeferredSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} style={minHeight ? { minHeight } : undefined}>
      {visible ? <Suspense fallback={<div style={{ minHeight }} />}>{children}</Suspense> : null}
    </div>
  );
};

export default DeferredSection;
