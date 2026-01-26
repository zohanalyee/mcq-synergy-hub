import { useAppearance } from '@/contexts/AppearanceContext';

/**
 * StaticBackground - A performant static gradient background for low-end devices
 * Uses pure CSS gradients with no JavaScript animations for optimal performance
 * Respects atmosphere mode from AppearanceContext
 */
export const StaticBackground = () => {
  const { settings } = useAppearance();

  // For solid mode, use a simple solid background
  if (settings.atmosphereMode === 'solid') {
    return (
      <div 
        className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
        style={{
          background: 'hsl(var(--background))',
        }}
      />
    );
  }

  // Adjust gradient intensity based on atmosphere mode
  const gradientIntensity = settings.atmosphereMode === 'aero' ? 0.2 : 0.12;

  return (
    <div 
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 20% 40%, hsla(210, 100%, 50%, ${gradientIntensity + 0.03}) 0%, transparent 50%),
          radial-gradient(ellipse 60% 40% at 80% 60%, hsla(270, 100%, 60%, ${gradientIntensity}) 0%, transparent 50%),
          radial-gradient(ellipse 70% 45% at 50% 80%, hsla(190, 100%, 60%, ${gradientIntensity - 0.02}) 0%, transparent 50%),
          hsl(var(--background))
        `,
      }}
    />
  );
};
