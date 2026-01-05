/**
 * StaticBackground - A performant static gradient background for low-end devices
 * Uses pure CSS gradients with no JavaScript animations for optimal performance
 */
export const StaticBackground = () => {
  return (
    <div 
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 20% 40%, hsla(210, 100%, 50%, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse 60% 40% at 80% 60%, hsla(270, 100%, 60%, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse 70% 45% at 50% 80%, hsla(190, 100%, 60%, 0.10) 0%, transparent 50%),
          hsl(var(--background))
        `,
      }}
    />
  );
};
