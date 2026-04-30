import { useDeviceCapability } from '@/hooks/useDeviceCapability';

/**
 * AuroraBackground — slow-moving mesh gradient using brand CSS tokens.
 * Pure CSS animation. Heavily blurred + tuned opacity (see .aurora-blob in
 * index.css, with dark-mode override) for a premium SaaS feel.
 * Falls back to a static gradient on low-end devices or when prefers-reduced-motion.
 */
export const AuroraBackground = () => {
  const { isLowEnd, prefersReducedMotion } = useDeviceCapability();
  const animate = !isLowEnd && !prefersReducedMotion;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-20 overflow-hidden pointer-events-none"
      style={{
        background:
          'radial-gradient(ellipse at top, hsl(var(--brand-from) / 0.12), transparent 60%), hsl(var(--background))',
      }}
    >
      <div
        className="aurora-blob"
        style={{
          top: '-15%',
          left: '-10%',
          width: '75vw',
          height: '75vw',
          background: 'hsl(var(--brand-from) / 0.95)',
          animation: animate ? 'aurora-drift-1 22s ease-in-out infinite' : 'none',
        }}
      />
      <div
        className="aurora-blob"
        style={{
          top: '15%',
          right: '-20%',
          width: '70vw',
          height: '70vw',
          background: 'hsl(var(--brand-to) / 0.85)',
          animation: animate ? 'aurora-drift-2 28s ease-in-out infinite' : 'none',
        }}
      />
      <div
        className="aurora-blob"
        style={{
          bottom: '-10%',
          left: '25%',
          width: '65vw',
          height: '65vw',
          background: 'hsl(var(--brand-via, var(--brand-from)) / 0.8)',
          animation: animate ? 'aurora-drift-3 32s ease-in-out infinite' : 'none',
        }}
      />
    </div>
  );
};

export default AuroraBackground;
