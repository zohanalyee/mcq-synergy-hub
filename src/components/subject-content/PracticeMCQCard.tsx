import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { StudyMode } from "./ModeToggle";
import { scorePracticeAnswers, isDbQuestionId, type ScoredAnswer } from "@/services/practiceScoringService";

interface MCQOption {
  key: string;
  text: string;
}

interface PracticeMCQCardProps {
  id: string;
  title: string;
  question: string;
  options: MCQOption[];
  correctOption: string;
  explanation?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  mode: StudyMode;
  index: number;
  onAnswered?: (id: string, isCorrect: boolean) => void;
  /**
   * When true, the correct answer is unknown in the browser and must be
   * resolved server-side after the user picks (guest flow). Keeps the answer
   * key out of the page until an answer is submitted.
   */
  serverScored?: boolean;
  /**
   * Batch-prefetched server score for this question (guest flow). When present,
   * the card reveals correctness instantly with NO per-question round-trip.
   */
  prefetched?: ScoredAnswer;
}

export const PracticeMCQCard = ({
  id,
  title,
  question,
  options,
  correctOption,
  explanation,
  difficulty,
  mode,
  index,
  onAnswered,
  serverScored,
}: PracticeMCQCardProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  // Server-resolved data (guest flow): correct key + explanation arrive only
  // after the user answers.
  const [resolvedCorrect, setResolvedCorrect] = useState<string>(serverScored ? "" : correctOption);
  const [resolvedExplanation, setResolvedExplanation] = useState<string | undefined>(
    serverScored ? undefined : explanation,
  );

  const effectiveCorrect = serverScored ? resolvedCorrect : correctOption;
  const effectiveExplanation = serverScored ? resolvedExplanation : explanation;

  const handleOptionClick = async (optionKey: string) => {
    if (mode === "read") return; // In read mode, options are not clickable
    if (selectedOption) return; // Already answered

    setSelectedOption(optionKey);

    if (serverScored && isDbQuestionId(id)) {
      // Resolve correctness server-side, then reveal. We send the option TEXT
      // (the server returns the correct answer as text) and map the returned
      // correct answer back to its option key for highlighting.
      const selectedText = options.find((o) => o.key === optionKey)?.text ?? optionKey;
      try {
        const scored = await scorePracticeAnswers([{ id, answer: selectedText }]);
        const s = scored[id];
        if (s) {
          const correctText = (s.correct_answer || "").trim().toLowerCase();
          const matchedKey =
            options.find((o) => o.text.trim().toLowerCase() === correctText)?.key ||
            // fall back to a raw letter if the server returned one
            (["A", "B", "C", "D"].includes((s.correct_option || "").toUpperCase())
              ? (s.correct_option || "").toUpperCase()
              : "");
          setResolvedCorrect(matchedKey);
          setResolvedExplanation(s.explanation || undefined);
          setShowExplanation(true);
          onAnswered?.(id, s.is_correct);
          return;
        }
      } catch (e) {
        console.warn("[PracticeMCQCard] server scoring failed:", e);
      }
      setShowExplanation(true);
      onAnswered?.(id, false);
      return;
    }


    setShowExplanation(true);
    onAnswered?.(id, optionKey === correctOption);
  };


  const getOptionStyle = (optionKey: string) => {
    const isCorrect = optionKey === effectiveCorrect;
    
    // Read Mode: Always show correct answer highlighted in green
    if (mode === "read") {
      if (isCorrect) {
        return "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300";
      }
      return "border-border hover:border-muted-foreground/50";
    }
    
    // Practice Mode: Show feedback after selection
    if (selectedOption) {
      if (isCorrect) {
        return "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300";
      }
      if (optionKey === selectedOption && !isCorrect) {
        return "border-destructive bg-destructive/10 text-destructive";
      }
      return "border-border opacity-50";
    }
    
    // Not answered yet - neutral styling
    return "border-border hover:border-primary hover:bg-primary/5 cursor-pointer";
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case "Easy":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
      case "Medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
      case "Hard":
        return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="glass-card hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                {index + 1}
              </span>
              <CardTitle className="text-base font-semibold leading-tight">{question}</CardTitle>
            </div>
            {difficulty && (
              <Badge className={cn("text-xs shrink-0", getDifficultyColor())}>
                {difficulty}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="space-y-2">
            {options.map((option) => {
              const isCorrect = option.key === effectiveCorrect;
              const isSelected = option.key === selectedOption;
              
              return (
                <button
                  key={option.key}
                  onClick={() => handleOptionClick(option.key)}
                  disabled={mode === "read" || !!selectedOption}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all duration-200",
                    getOptionStyle(option.key)
                  )}
                >
                  <span className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold shrink-0",
                    mode === "read" && isCorrect 
                      ? "bg-emerald-500 text-white" 
                      : selectedOption && isCorrect
                        ? "bg-emerald-500 text-white"
                        : selectedOption && isSelected && !isCorrect
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-secondary text-secondary-foreground"
                  )}>
                    {option.key}
                  </span>
                  <span className="flex-1 text-sm">{option.text}</span>
                  
                  {/* Show icons in practice mode after selection */}
                  {mode === "practice" && selectedOption && (
                    <>
                      {isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      )}
                      {isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-destructive shrink-0" />
                      )}
                    </>
                  )}
                  
                  {/* Show check icon in read mode for correct answer */}
                  {mode === "read" && isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Explanation - Always visible in read mode, shown after answer in practice mode */}
          {effectiveExplanation && (mode === "read" || showExplanation) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
            >
              <div className="flex items-start gap-2">
                <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                    Explanation
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    {effectiveExplanation}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Practice mode result feedback */}
          {mode === "practice" && selectedOption && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "mt-2 p-3 rounded-lg text-center font-medium",
                selectedOption === effectiveCorrect
                  ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300"
              )}
            >
              {selectedOption === effectiveCorrect ? "✓ Correct!" : "✗ Incorrect"}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PracticeMCQCard;
