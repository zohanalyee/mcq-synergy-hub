import { useRef } from "react";
import { motion } from "framer-motion";
import { useDeviceCapability } from "@/hooks/useDeviceCapability";
import { useAppearance } from "@/contexts/AppearanceContext";

interface LiquidBackgroundProps {
  speed?: number;
  intensity?: number;
  blobCount?: number;
}

export const LiquidBackground = ({ 
  speed = 20, 
  intensity = 1,
  blobCount = 5 
}: LiquidBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isLowEnd, isTouchDevice } = useDeviceCapability();
  const { settings, getMixColors } = useAppearance();

  // Don't render on low-end devices - let StaticBackground handle it
  if (isLowEnd) {
    return null;
  }

  // Don't render blobs in "solid" atmosphere mode
  if (settings.atmosphereMode === 'solid') {
    return null;
  }

  // Get dynamic colors from Mix Library
  const mixColors = getMixColors();

  // Reduce blob count on medium devices (touch but high-power)
  const effectiveBlobCount = isTouchDevice ? Math.min(blobCount, 3) : blobCount;

  // Adjust blob opacity based on atmosphere mode
  const blobOpacity = settings.atmosphereMode === 'aero' ? 0.5 : 0.3;

  // Create blobs with dynamic colors from Mix Library
  const blobs = Array.from({ length: effectiveBlobCount }, (_, i) => {
    // Cycle through the 3 mix colors
    const colorIndex = i % 3;
    return {
      id: i,
      color: mixColors[colorIndex],
      size: 400 + i * 100,
      delay: i * 2,
    };
  });

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{
        background: "hsl(var(--background))",
      }}
    >
      {/* Animated gradient blobs with dynamic Mix Library colors */}
      {blobs.map((blob) => (
        <motion.div
          key={blob.id}
          className="absolute rounded-full blur-3xl mix-blend-screen liquid-blob"
          style={{
            width: blob.size * intensity,
            height: blob.size * intensity,
            left: `${20 + blob.id * 15}%`,
            top: `${10 + blob.id * 12}%`,
            willChange: 'transform',
            opacity: blobOpacity,
            background: `radial-gradient(circle, ${blob.color} 0%, transparent 70%)`,
          }}
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -100, 50, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: speed + blob.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
