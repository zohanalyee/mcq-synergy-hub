import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";

interface JobTestKeepGoingDialogProps {
  open: boolean;
  onClose: () => void;
  score: number;
  weakTopics: string[];
  onPracticeWeak: () => void;
  onRetry: () => void;
}

export const JobTestKeepGoingDialog = ({
  open, onClose, score, weakTopics, onPracticeWeak, onRetry,
}: JobTestKeepGoingDialogProps) => (
  <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-2">
          <Target className="w-7 h-7 text-white" />
        </div>
        <DialogTitle className="text-center text-xl">Keep Going! {score}%</DialogTitle>
        <DialogDescription className="text-center">
          Score 80% or higher to unlock more practice questions.
        </DialogDescription>
      </DialogHeader>

      {weakTopics.length > 0 && (
        <div className="rounded-xl bg-muted/50 border border-border p-4">
          <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Focus Areas
          </div>
          <ul className="space-y-1">
            {weakTopics.slice(0, 5).map((t) => (
              <li key={t} className="text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <Button variant="outline" className="flex-1" onClick={onPracticeWeak}>
          Practice Weak Areas
        </Button>
        <Button className="flex-1" onClick={onRetry}>Try Again</Button>
      </div>
    </DialogContent>
  </Dialog>
);
