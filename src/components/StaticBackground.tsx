import { useAppearance } from '@/contexts/AppearanceContext';

/**
 * StaticBackground - A performant static gradient background for low-end devices
 * Uses pure CSS gradients with no JavaScript animations for optimal performance
 * Respects atmosphere mode and Mix Library colors from AppearanceContext
 */
export const StaticBackground = () => {
  const { settings, getMixColors } = useAppearance();

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

  // Get dynamic colors from Mix Library
  const mixColors = getMixColors();

  // Adjust gradient intensity based on atmosphere mode
  const gradientIntensity = settings.atmosphereMode === 'aero' ? 0.25 : 0.15;

  // Convert hex to rgba for gradient use
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div 
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 20% 40%, ${hexToRgba(mixColors[0], gradientIntensity)} 0%, transparent 50%),
          radial-gradient(ellipse 60% 40% at 80% 60%, ${hexToRgba(mixColors[1], gradientIntensity)} 0%, transparent 50%),
          radial-gradient(ellipse 70% 45% at 50% 80%, ${hexToRgba(mixColors[2], gradientIntensity - 0.03)} 0%, transparent 50%),
          hsl(var(--background))
        `,
      }}
    />
  );
};
