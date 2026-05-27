import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Play, Zap } from "lucide-react";

export type QuickTestSettings = {
  difficulty: "easy" | "medium" | "hard" | "mixed";
  questionCount: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  isGuest?: boolean;
  isGenerating?: boolean;
  onStart: (settings: QuickTestSettings) => void;
};

/**
 * Lightweight Quick Test settings modal used by SEO landing pages.
 * Difficulty: Easy / Medium / Hard / Mixed
 * Count: 10 / 20 / 50 (guests capped at 20)
 */
export const QuickTestDialog = ({
  isOpen,
  onClose,
  title,
  subtitle,
  isGuest = false,
  isGenerating = false,
  onStart,
}: Props) => {
  const [difficulty, setDifficulty] = useState<QuickTestSettings["difficulty"]>("mixed");
  const [questionCount, setQuestionCount] = useState<number>(isGuest ? 10 : 20);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Test Settings
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{title}</span>
            {subtitle && <span className="block text-xs mt-1">{subtitle}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Difficulty</Label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as QuickTestSettings["difficulty"])}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="easy">🟢 Easy</option>
              <option value="medium">🟡 Medium</option>
              <option value="hard">🔴 Hard</option>
              <option value="mixed">🎯 Mixed / All</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Questions</Label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value={10}>10 Questions</option>
              <option value={20}>20 Questions</option>
              {!isGuest && <option value={50}>50 Questions</option>}
            </select>
            {isGuest && (
              <p className="text-xs text-muted-foreground">
                Sign in for 50-question tests and full progress tracking.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => onStart({ difficulty, questionCount })}
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Test Now
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
