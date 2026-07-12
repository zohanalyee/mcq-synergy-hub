import { motion, AnimatePresence } from "framer-motion";
import { Flag, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cleanQuestionText } from "@/lib/questionUtils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const { isRTL } = useLanguage();

  // Guard: check if options are valid
  const optionsData = Array.isArray(question.options)
    ? question.options
    : question.options && typeof question.options === 'object'
      ? Object.values(question.options)
      : [];

  if (!question.question || optionsData.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-3 sm:p-4">
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            This question has corrupted data (missing question text or options). 
            It has been skipped. Please report to admin.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
              <h2 className={cn("text-sm sm:text-lg font-semibold leading-snug text-foreground", isRTL && "rtl-text font-nastaliq-heading")}>
                {cleanQuestionText(question.question)}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              aria-label={isFlagged ? "Remove flag from this question" : "Flag this question for review"}
              aria-pressed={isFlagged}
              className={cn(
                "h-9 w-9 sm:h-8 sm:w-8 p-0 shrink-0 rounded-lg",
                isFlagged
                  ? "text-warning bg-warning/10"
                  : "text-muted-foreground"
              )}
              onClick={() => onToggleFlag(questionIndex)}
            >
              <Flag className="h-4 w-4" />
            </Button>
          </div>

          {/* Option cards */}
          <div className="space-y-2" role="radiogroup" aria-label="Answer options">
            {(Array.isArray(question.options)
              ? question.options
              : question.options && typeof question.options === 'object'
                ? Object.values(question.options)
                : []
            ).map((option: string, idx: number) => {
              const isSelected = selectedAnswer === option;
              return (
                <button
                  type="button"
                  key={idx}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onSelectAnswer(questionIndex, option)}
                  className={cn(
                    "w-full text-left glass-card rounded-xl p-2.5 sm:p-3 cursor-pointer transition-all duration-200 min-h-11",
                    "border hover:border-primary/30 hover:shadow-md",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                    isSelected
                      ? "ring-2 ring-info bg-info/10 border-info/50 shadow-[0_0_15px_hsl(var(--info)/0.15)]"
                      : "border-border/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={isSelected ? "default" : "secondary"}
                      className={cn(
                        "h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold",
                        isSelected && "bg-info text-info-foreground"
                      )}
                    >
                      {String.fromCharCode(65 + idx)}
                    </Badge>
                    <span className={cn("text-xs sm:text-sm leading-tight text-foreground", isRTL && "rtl-text font-nastaliq")}>
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuestionCard;
