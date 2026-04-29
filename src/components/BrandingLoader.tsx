import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';

interface BrandingLoaderProps {
  message?: string;
  /** Show as full-screen overlay with glassmorphism */
  fullScreen?: boolean;
  /** Show as inline loader (no overlay) */
  inline?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const BrandingLoader = ({
  message = 'Loading...',
  fullScreen = false,
  inline = false,
  size = 'md',
}: BrandingLoaderProps) => {
  const sizeConfig = {
    sm: { logo: 'w-8 h-8', icon: 'h-4 w-4', sparkle: 'h-3 w-3', text: 'text-sm', bar: 'h-0.5 w-32', gap: 'gap-2' },
    md: { logo: 'w-10 h-10', icon: 'h-5 w-5', sparkle: 'h-4 w-4', text: 'text-base', bar: 'h-1 w-48', gap: 'gap-3' },
    lg: { logo: 'w-14 h-14', icon: 'h-7 w-7', sparkle: 'h-5 w-5', text: 'text-lg', bar: 'h-1.5 w-56', gap: 'gap-4' },
  };

  const s = sizeConfig[size];

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center ${s.gap}`}
    >
      {/* Logo + Sparkle */}
      <div className="flex items-center gap-2">
        <div className={`relative flex items-center justify-center ${s.logo} rounded-xl bg-brand-gradient shadow-brand`}>
          <Brain className={`${s.icon} text-white`} />
        </div>

        {/* AI Sparkle - flashing glow */}
        <motion.div
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [0.9, 1.2, 0.9],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ color: 'hsl(var(--brand-from))' }}
        >
          <Sparkles className={`${s.sparkle}`} />
        </motion.div>
      </div>

      {/* Brand Text */}
      <div className="flex items-center gap-1">
        <span
          className={`${s.text} font-bold tracking-tight`}
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          <span className="text-brand-gradient">MCQS</span>
          <span className="text-foreground">AI</span>
        </span>
      </div>

      {/* Status Message */}
      <p className="text-xs text-muted-foreground">{message}</p>

      {/* Animated Gradient Progress Bar */}
      <div className={`${s.bar} rounded-full bg-muted/50 overflow-hidden`}>
        <motion.div
          className="h-full rounded-full bg-brand-gradient"
          style={{ backgroundSize: '200% 100%' }}
          animate={{
            width: ['0%', '60%', '100%', '60%', '0%'],
            backgroundPosition: ['0% 0%', '100% 0%', '200% 0%'],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  );

  if (inline) {
    return (
      <div className="flex items-center justify-center py-8">
        <AnimatePresence>{content}</AnimatePresence>
      </div>
    );
  }

  if (fullScreen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-md" />
          <div className="relative">{content}</div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Default: centered container loader
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <AnimatePresence>{content}</AnimatePresence>
    </div>
  );
};

export default BrandingLoader;
