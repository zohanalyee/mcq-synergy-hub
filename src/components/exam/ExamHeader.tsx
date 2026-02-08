import { Clock, Music, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ExamHeaderProps {
  sessionName: string;
  currentQuestion: number;
  totalQuestions: number;
  answeredCount: number;
  timeRemaining: number;
  progress: number;
  isLoadingMore: boolean;
  remainingCount: number;
  sourceBadge: { icon: string; text: string; variant: "default" | "secondary" | "outline" } | null;
  isMusicOpen: boolean;
  onToggleMusic: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const ExamHeader = ({
  sessionName,
  currentQuestion,
  totalQuestions,
  answeredCount,
  timeRemaining,
  progress,
  isLoadingMore,
  remainingCount,
  sourceBadge,
  isMusicOpen,
  onToggleMusic,
}: ExamHeaderProps) => {
  const isLowTime = timeRemaining <= 60;

  return (
    <div className="sticky top-0 z-20 glass-card backdrop-blur-xl border-b border-border/50 px-3 py-2 sm:px-4 sm:py-2.5 mb-2">
      {/* Top row: name, timer, music */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <h1 className="text-sm sm:text-base font-bold text-foreground truncate flex-1">
          {sessionName}
        </h1>

        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              "flex items-center gap-1 text-[10px] sm:text-xs shrink-0 py-0.5 px-1.5 font-mono",
              isLowTime && "text-red-500 border-red-500/50 animate-pulse"
            )}
          >
            <Clock className="h-3 w-3" />
            {formatTime(timeRemaining)}
          </Badge>

          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              "h-7 w-7 shrink-0",
              isMusicOpen && "text-primary bg-primary/10"
            )}
            onClick={onToggleMusic}
          >
            <Music className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Info row */}
      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
        <span className="text-[10px] sm:text-xs text-muted-foreground">
          Q {currentQuestion + 1}/{totalQuestions}
        </span>
        <span className="text-[10px] sm:text-xs text-muted-foreground">
          • {answeredCount} answered
        </span>
        {sourceBadge && (
          <Badge variant={sourceBadge.variant} className="text-[10px] py-0 px-1">
            {sourceBadge.icon} {sourceBadge.text}
          </Badge>
        )}
        {isLoadingMore && (
          <Badge variant="outline" className="text-[10px] py-0 px-1 flex items-center gap-0.5 animate-pulse">
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            +{remainingCount}
          </Badge>
        )}
      </div>

      {/* Progress bar */}
      <Progress value={progress} className="h-1.5" />
    </div>
  );
};

export default ExamHeader;
