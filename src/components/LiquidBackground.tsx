import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const blobs = Array.from({ length: blobCount }, (_, i) => ({
    id: i,
    color: i % 4 === 0 ? "liquid-blue" : 
           i % 4 === 1 ? "liquid-violet" : 
           i % 4 === 2 ? "liquid-cyan" : "liquid-orange",
    size: 400 + i * 100,
    delay: i * 2,
  }));

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{
        background: "hsl(var(--background))",
      }}
    >
      {/* Backdrop blur layer */}
      <div className="absolute inset-0 backdrop-blur-[100px]" />
      
      {/* Animated gradient blobs */}
      {blobs.map((blob) => (
        <motion.div
          key={blob.id}
          className={`absolute rounded-full blur-3xl opacity-30 mix-blend-screen ${blob.color}`}
          style={{
            width: blob.size * intensity,
            height: blob.size * intensity,
            left: `${20 + blob.id * 15}%`,
            top: `${10 + blob.id * 12}%`,
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

      {/* Interactive cursor glow */}
      <motion.div
        className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 mix-blend-screen liquid-cyan pointer-events-none"
        animate={{
          x: mousePos.x - 192,
          y: mousePos.y - 192,
        }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 200,
        }}
      />
    </div>
  );
};
