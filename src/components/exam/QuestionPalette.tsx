import { useState } from "react";
import { Grid3X3, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface QuestionPaletteProps {
  totalQuestions: number;
  currentQuestion: number;
  answers: Record<number, string>;
  flaggedQuestions: Set<number>;
  onNavigate: (index: number) => void;
}

const PaletteGrid = ({
  totalQuestions,
  currentQuestion,
  answers,
  flaggedQuestions,
  onNavigate,
}: QuestionPaletteProps) => (
  <div>
    <div className="grid grid-cols-8 sm:grid-cols-6 gap-1.5 mb-3">
      {Array.from({ length: totalQuestions }, (_, index) => {
        const isAnswered = answers[index] !== undefined;
        const isFlagged = flaggedQuestions.has(index);
        const isCurrent = index === currentQuestion;

        return (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className={cn(
              "relative h-8 w-8 p-0 text-xs font-medium rounded-lg transition-all",
              isCurrent && "ring-2 ring-blue-500",
              isFlagged && !isCurrent && "bg-orange-500 text-white hover:bg-orange-600",
              isAnswered && !isFlagged && !isCurrent && "bg-emerald-500 text-white hover:bg-emerald-600",
              !isAnswered && !isFlagged && !isCurrent && "bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30"
            )}
            onClick={() => onNavigate(index)}
          >
            {index + 1}
            {isFlagged && (
              <Flag className="h-2 w-2 absolute -top-0.5 -right-0.5" />
            )}
          </Button>
        );
      })}
    </div>

    {/* Legend */}
    <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground pt-2 border-t border-border/50">
      <div className="flex items-center gap-1">
        <div className="h-3 w-3 rounded bg-emerald-500" />
        <span>Answered</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="h-3 w-3 rounded bg-red-500/20 border border-red-500/30" />
        <span>Unanswered</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="h-3 w-3 rounded bg-orange-500" />
        <span>Review</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="h-3 w-3 rounded ring-2 ring-blue-500" />
        <span>Current</span>
      </div>
    </div>
  </div>
);

const QuestionPalette = (props: QuestionPaletteProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  if (!isMobile) {
    // Desktop: sidebar card
    return (
      <div className="hidden lg:block w-64 shrink-0">
        <div className="glass-card rounded-2xl p-3 sticky top-24">
          <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
            Question Palette
          </h3>
          <PaletteGrid {...props} />
        </div>
      </div>
    );
  }

  // Mobile: floating button + Sheet
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon-sm"
          variant="outline"
          className="h-9 w-9 rounded-full glass-card border-border/50"
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh]">
        <SheetHeader>
          <SheetTitle className="text-sm">Question Palette</SheetTitle>
        </SheetHeader>
        <div className="mt-3">
          <PaletteGrid
            {...props}
            onNavigate={(index) => {
              props.onNavigate(index);
              setIsOpen(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default QuestionPalette;
