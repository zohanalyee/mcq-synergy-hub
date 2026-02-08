import { ArrowLeft, ArrowRight, Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExamNavBarProps {
  currentQuestion: number;
  totalQuestions: number;
  canSubmit: boolean;
  remainingCount: number;
  isFlagged: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleFlag: () => void;
  onSubmit: () => void;
  paletteButton?: React.ReactNode;
}

const ExamNavBar = ({
  currentQuestion,
  totalQuestions,
  canSubmit,
  remainingCount,
  isFlagged,
  onPrevious,
  onNext,
  onToggleFlag,
  onSubmit,
  paletteButton,
}: ExamNavBarProps) => {
  const isLastQuestion = currentQuestion === totalQuestions - 1;

  return (
    <div className="sticky bottom-0 z-10 glass-card backdrop-blur-sm border-t border-border/50 pt-2 pb-safe mt-auto">
      <div className="flex items-center justify-between gap-2">
        {/* Previous */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={currentQuestion === 0}
          className="h-9"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          <span className="hidden xs:inline">Prev</span>
        </Button>

        {/* Center: Flag + Palette (mobile) */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFlag}
            className={cn(
              "h-9",
              isFlagged && "border-orange-500/50 text-orange-500 bg-orange-500/10"
            )}
          >
            <Flag className="h-3.5 w-3.5 mr-1" />
            <span className="hidden xs:inline">Review</span>
          </Button>

          {/* Mobile palette trigger */}
          {paletteButton && (
            <div className="lg:hidden">
              {paletteButton}
            </div>
          )}
        </div>

        {/* Next / Submit */}
        {isLastQuestion ? (
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={!canSubmit}
            title={!canSubmit ? `Waiting for ${remainingCount} more questions to load...` : undefined}
            className="h-9"
          >
            {!canSubmit && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            {canSubmit ? "Submit" : "Loading..."}
          </Button>
        ) : (
          <Button size="sm" onClick={onNext} className="h-9">
            <span className="hidden xs:inline">Next</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ExamNavBar;
