import { motion, AnimatePresence } from "framer-motion";
import { Flame, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface QuizHUDProps {
  title: string;
  current: number; // 1-based
  total: number;
  streak: number;
  score: number;
  onExit: () => void;
}

const QuizHUD = ({ title, current, total, streak, score, onExit }: QuizHUDProps) => {
  const pct = Math.min(100, Math.round(((current - 1) / Math.max(1, total)) * 100));

  return (
    <div className="sticky top-0 z-30 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            aria-label="Exit quiz"
            className="shrink-0 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold truncate text-brand-gradient">{title}</p>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                Q {current} / {total}
              </span>
            </div>
            <Progress value={pct} className="h-1.5 mt-1.5" indicatorClassName="bg-brand-gradient" />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1.5 ml-11">
          <AnimatePresence>
            {streak > 0 && (
              <motion.div
                key={`streak-${streak}`}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 text-xs font-semibold"
              >
                <Flame className="h-3 w-3" />
                {streak} streak
              </motion.div>
            )}
          </AnimatePresence>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Star className="h-3 w-3" />
            {score} pts
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizHUD;
