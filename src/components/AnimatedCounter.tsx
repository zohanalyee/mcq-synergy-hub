
import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface CounterProps {
  from: number;
  to: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const AnimatedCounter = ({ 
  from, 
  to, 
  duration = 2, 
  delay = 0,
  prefix = '',
  suffix = '',
  className = ''
}: CounterProps) => {
  const [count, setCount] = useState(from);
  const nodeRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(nodeRef, { once: true, amount: 0.5 });
  const [hasAnimated, setHasAnimated] = useState(false);

  // Reset animation if target value changes
  useEffect(() => {
    setHasAnimated(false);
    setCount(from);
  }, [to, from]);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
      
      let startTime: number;
      let animationFrame: number;
      
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        
        setCount(Math.floor(from + progress * (to - from)));
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(step);
        }
      };
      
      const timeoutId = setTimeout(() => {
        animationFrame = requestAnimationFrame(step);
      }, delay * 1000);
      
      return () => {
        clearTimeout(timeoutId);
        cancelAnimationFrame(animationFrame);
      };
    }
  }, [isInView, hasAnimated, from, to, duration, delay]);

  return (
    <motion.div
      ref={nodeRef}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: delay }}
      className={className}
    >
      {prefix}{count.toLocaleString()}{suffix}
    </motion.div>
  );
};

export default AnimatedCounter;
