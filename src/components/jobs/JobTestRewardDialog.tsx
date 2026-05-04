import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles } from "lucide-react";

interface JobTestRewardDialogProps {
  open: boolean;
  onClose: () => void;
  score: number;
  unlocked: number;
  unlockedDelta: number;
  onContinue: () => void;
}

export const JobTestRewardDialog = ({
  open, onClose, score, unlocked, unlockedDelta, onContinue,
}: JobTestRewardDialogProps) => (
  <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-2">
          <Trophy className="w-7 h-7 text-white" />
        </div>
        <DialogTitle className="text-center text-xl">Outstanding! {score}%</DialogTitle>
        <DialogDescription className="text-center">
          You qualified for more practice questions.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4 text-center">
        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>+{unlockedDelta} questions unlocked</span>
        </div>
        <div className="text-2xl font-bold text-primary">{unlocked} total available</div>
      </div>

      <div className="flex gap-2 mt-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
        <Button className="flex-1" onClick={onContinue}>Practice More</Button>
      </div>
    </DialogContent>
  </Dialog>
);
