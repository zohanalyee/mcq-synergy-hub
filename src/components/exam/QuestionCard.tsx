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
                    "group relative overflow-hidden w-full text-left rounded-xl p-2.5 sm:p-3 cursor-pointer transition-all duration-200 min-h-11",
                    "border hover:-translate-y-px hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                    isSelected
                      ? "border-primary/60 bg-primary/10 shadow-[0_6px_20px_-6px_hsl(var(--primary)/0.35)]"
                      : "border-border/60 bg-card/60"
                  )}
                >
                  {isSelected && <span className="absolute left-0 top-0 bottom-0 w-1 bg-brand-gradient" aria-hidden />}
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={isSelected ? "default" : "secondary"}
                      className={cn(
                        "h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold transition-all",
                        isSelected
                          ? "bg-brand-gradient text-primary-foreground border-0 scale-110 shadow-md"
                          : "group-hover:bg-primary/15 group-hover:text-primary"
                      )}
                    >
                      {String.fromCharCode(65 + idx)}
                    </Badge>
                    <span className={cn("flex-1 text-xs sm:text-sm leading-tight", isSelected ? "font-semibold text-foreground" : "text-foreground", isRTL && "rtl-text font-nastaliq")}>
                      {option}
                    </span>
                    {isSelected && (
                      <span className="h-5 w-5 shrink-0 rounded-full bg-brand-gradient text-primary-foreground flex items-center justify-center text-[10px] font-bold" aria-hidden>✓</span>
                    )}
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
