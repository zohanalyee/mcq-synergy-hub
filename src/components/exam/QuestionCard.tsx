import { motion, AnimatePresence } from "framer-motion";
import { Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: {
    question: string;
    options: string[];
    answer: string;
  };
  questionIndex: number;
  selectedAnswer: string | undefined;
  isFlagged: boolean;
  onSelectAnswer: (questionIndex: number, answer: string) => void;
  onToggleFlag: (questionIndex: number) => void;
}

const QuestionCard = ({
  question,
  questionIndex,
  selectedAnswer,
  isFlagged,
  onSelectAnswer,
  onToggleFlag,
}: QuestionCardProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={questionIndex}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="glass-card rounded-2xl p-3 sm:p-4">
          {/* Question header */}
          <div className="flex justify-between items-start gap-2 mb-3">
            <div className="flex-1 max-h-[28vh] overflow-y-auto scrollbar-thin pr-1">
              <h2 className="text-sm sm:text-lg font-semibold leading-snug text-foreground">
                {question.question}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 w-7 p-0 shrink-0 rounded-lg",
                isFlagged
                  ? "text-orange-500 bg-orange-500/10"
                  : "text-muted-foreground"
              )}
              onClick={() => onToggleFlag(questionIndex)}
            >
              <Flag className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Option cards */}
          <div className="space-y-2">
            {(Array.isArray(question.options)
              ? question.options
              : question.options && typeof question.options === 'object'
                ? Object.values(question.options)
                : []
            ).map((option: string, idx: number) => {
              const isSelected = selectedAnswer === option;
              return (
                <div
                  key={idx}
                  onClick={() => onSelectAnswer(questionIndex, option)}
                  className={cn(
                    "glass-card rounded-xl p-2.5 sm:p-3 cursor-pointer transition-all duration-200",
                    "border hover:border-primary/30 hover:shadow-md",
                    isSelected
                      ? "ring-2 ring-blue-500 bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                      : "border-border/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={isSelected ? "default" : "secondary"}
                      className={cn(
                        "h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold",
                        isSelected && "bg-blue-500 text-white"
                      )}
                    >
                      {String.fromCharCode(65 + idx)}
                    </Badge>
                    <span className="text-xs sm:text-sm leading-tight text-foreground">
                      {option}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuestionCard;
