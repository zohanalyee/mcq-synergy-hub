import { Suspense, useEffect, useRef, useState } from 'react';

interface DeferredSectionProps {
  /** Reserved height so the placeholder never causes layout shift when content mounts. */
  minHeight: number;
  children: React.ReactNode;
}

/**
 * Mounts below-the-fold homepage sections only when they approach the viewport.
 * During prerender (no window / no IntersectionObserver) only the reserved
 * placeholder is emitted, so no lazy child can suspend server-side.
 * Purely a loading strategy — no visual or brand change.
 */
const DeferredSection = ({ minHeight, children }: DeferredSectionProps) => {
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
      { rootMargin: '300px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={visible ? undefined : { minHeight }}>
      {visible ? <Suspense fallback={<div style={{ minHeight }} />}>{children}</Suspense> : null}
    </div>
  );
};

export default DeferredSection;
