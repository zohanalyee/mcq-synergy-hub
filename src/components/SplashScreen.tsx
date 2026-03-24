import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';

const SPLASH_DURATION = 2200; // ms

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter');

  useEffect(() => {
    const timer = setTimeout(() => setPhase('exit'), SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {phase === 'enter' && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background"
        >
          {/* Ambient glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, rgba(34,211,238,0.08) 50%, transparent 70%)',
              }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <div className="relative flex flex-col items-center gap-6">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6, type: 'spring', stiffness: 200 }}
              className="relative"
            >
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-xl shadow-violet-500/30">
                  <Brain className="h-8 w-8 text-white" />
                </div>

                {/* Sparkle */}
                <motion.div
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.3, 0.8],
                    filter: [
                      'drop-shadow(0 0 4px rgba(124,58,237,0.3))',
                      'drop-shadow(0 0 12px rgba(124,58,237,0.9))',
                      'drop-shadow(0 0 4px rgba(124,58,237,0.3))',
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="h-6 w-6 text-violet-400" />
                </motion.div>
              </div>
            </motion.div>

            {/* Brand Text */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <span
                className="text-3xl font-bold tracking-tight"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-cyan-500">
                  MCQS
                </span>
                <span className="text-foreground">AI</span>
              </span>
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-sm text-muted-foreground"
            >
              AI-Powered Exam Prep
            </motion.p>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '12rem' }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="h-1 rounded-full bg-muted/50 overflow-hidden w-48"
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-500 to-violet-500"
                style={{ backgroundSize: '200% 100%' }}
                initial={{ width: '0%' }}
                animate={{
                  width: '100%',
                  backgroundPosition: ['0% 0%', '100% 0%'],
                }}
                transition={{ duration: 1.8, delay: 0.7, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
