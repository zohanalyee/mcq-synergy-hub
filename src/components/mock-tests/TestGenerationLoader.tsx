import { motion } from "framer-motion";
import { Brain, Sparkles, Database, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

type TestGenerationLoaderProps = {
  isVisible: boolean;
  topicName: string;
};

const loadingSteps = [
  { icon: Database, text: "Checking Question Bank...", progress: 25 },
  { icon: Zap, text: "Loading cached questions...", progress: 50 },
  { icon: Brain, text: "Generating new questions...", progress: 75 },
  { icon: Sparkles, text: "Building your test...", progress: 90 },
];

export const TestGenerationLoader = ({ isVisible, topicName }: TestGenerationLoaderProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % loadingSteps.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const CurrentIcon = loadingSteps[currentStep].icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <div className="bg-card border rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 text-center">
        {/* Animated Icon */}
        <motion.div
          key={currentStep}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative mx-auto mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <CurrentIcon className="h-10 w-10 text-primary" />
            </motion.div>
          </div>
          
          {/* Pulse rings */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/20"
            animate={{ scale: [1, 2], opacity: [0.3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
        </motion.div>

        {/* Topic Name */}
        <h2 className="text-xl font-bold mb-2 text-foreground">
          Building your Test
        </h2>
        <p className="text-muted-foreground mb-4 text-sm">
          {topicName}
        </p>

        {/* Progress Bar */}
        <Progress value={loadingSteps[currentStep].progress} className="h-2 mb-4" />

        {/* Current Step Text */}
        <motion.p
          key={loadingSteps[currentStep].text}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-primary font-medium"
        >
          {loadingSteps[currentStep].text}
        </motion.p>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/20"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [-10, 10, -10],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
