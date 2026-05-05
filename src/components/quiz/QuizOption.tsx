import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuizOptionState = "idle" | "selected" | "correct" | "incorrect" | "revealed";

interface QuizOptionProps {
  letter: string; // "A" | "B" | ...
  text: string;
  state: QuizOptionState;
  disabled?: boolean;
  onClick: () => void;
}

const QuizOption = ({ letter, text, state, disabled, onClick }: QuizOptionProps) => {
  const isCorrect = state === "correct" || state === "revealed";
  const isWrong = state === "incorrect";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      animate={
        isCorrect
          ? { scale: [1, 1.03, 1] }
          : isWrong
          ? { x: [0, -6, 6, -4, 4, 0] }
          : { scale: 1 }
      }
      transition={{ duration: 0.4 }}
      className={cn(
        "w-full flex items-center gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border text-left transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        state === "idle" &&
          "border-border bg-card hover:bg-accent hover:border-primary/40 cursor-pointer",
        state === "selected" &&
          "border-transparent bg-brand-gradient-soft shadow-brand [background-image:var(--gradient-brand-soft),var(--gradient-brand)] [background-origin:border-box] [background-clip:padding-box,border-box]",
        isCorrect && "border-green-500 bg-green-500/10",
        isWrong && "border-destructive bg-destructive/10",
        disabled && state === "idle" && "opacity-60 cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-md font-bold text-sm",
          state === "idle" && "bg-muted text-foreground",
          state === "selected" && "bg-brand-gradient text-white shadow-brand",
          isCorrect && "bg-green-500 text-white",
          isWrong && "bg-destructive text-destructive-foreground",
        )}
      >
        {isCorrect ? <Check className="h-4 w-4" /> : isWrong ? <X className="h-4 w-4" /> : letter}
      </span>
      <span className="flex-1 text-sm font-medium leading-snug">{text}</span>
    </motion.button>
  );
};

export default QuizOption;
