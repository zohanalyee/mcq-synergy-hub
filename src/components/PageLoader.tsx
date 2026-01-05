import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from '@/contexts/LoadingContext';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';

const PageLoader = () => {
  const { isLoading } = useLoading();
  const { isLowEnd } = useDeviceCapability();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
        >
          {/* Adaptive backdrop: minimal blur on low-end, full blur on high-end */}
          <div className={`absolute inset-0 ${isLowEnd ? 'bg-background/80' : 'bg-background/60 backdrop-blur-sm'}`} />
          
          {/* Loader content */}
          <div className="relative flex flex-col items-center gap-4">
            {/* Simplified loader for low-end devices */}
            <div className="relative w-16 h-16" style={{ transform: 'translateZ(0)' }}>
              {/* Single gradient spinning ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, transparent, hsl(var(--primary)), transparent)',
                  maskImage: 'radial-gradient(transparent 55%, black 56%, black 100%)',
                  WebkitMaskImage: 'radial-gradient(transparent 55%, black 56%, black 100%)',
                  willChange: 'transform',
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              
              {/* Center dot - static on low-end */}
              {isLowEnd ? (
                <div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-primary" />
              ) : (
                <motion.div
                  className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-gradient-to-br from-primary to-primary/60"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageLoader;
