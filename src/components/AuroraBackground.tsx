import { useDeviceCapability } from '@/hooks/useDeviceCapability';

/**
 * AuroraBackground — slow-moving mesh gradient using brand CSS tokens.
 * - Pure CSS animation (no JS rAF), so it's cheap.
 * - Heavily blurred + low opacity for subtlety.
 * - Falls back to a static gradient on low-end devices or when the OS
 *   prefers-reduced-motion is set (handled in CSS via .aurora-blob rule).
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
          'radial-gradient(ellipse at top, hsl(var(--brand-from) / 0.05), transparent 60%), hsl(var(--background))',
      }}
    >
      <div
        className="aurora-blob"
        style={{
          top: '-10%',
          left: '-10%',
          width: '60vw',
          height: '60vw',
          background: 'hsl(var(--brand-from) / 0.55)',
          animation: animate ? 'aurora-drift-1 22s ease-in-out infinite' : 'none',
        }}
      />
      <div
        className="aurora-blob"
        style={{
          top: '20%',
          right: '-15%',
          width: '55vw',
          height: '55vw',
          background: 'hsl(var(--brand-to) / 0.5)',
          animation: animate ? 'aurora-drift-2 28s ease-in-out infinite' : 'none',
        }}
      />
      <div
        className="aurora-blob"
        style={{
          bottom: '-15%',
          left: '15%',
          width: '50vw',
          height: '50vw',
          background: 'hsl(var(--brand-via, var(--brand-from)) / 0.45)',
          animation: animate ? 'aurora-drift-3 32s ease-in-out infinite' : 'none',
        }}
      />
    </div>
  );
};

export default AuroraBackground;
