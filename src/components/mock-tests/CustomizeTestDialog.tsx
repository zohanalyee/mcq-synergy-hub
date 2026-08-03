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
import { Slider } from "@/components/ui/slider";
import { Play, Clock, HelpCircle, Zap } from "lucide-react";

type CustomizeTestDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  testTitle: string;
  defaultQuestions: number;
  defaultDuration: number;
  defaultDifficulty?: string;
  /** When true, render a minimal guest-friendly form (10/20 questions only). */
  isGuest?: boolean;
  onStart: (settings: {
    difficulty: "easy" | "medium" | "hard";
    questionCount: number;
    duration: number;
  }) => void;
  isGenerating?: boolean;
};

export const CustomizeTestDialog = ({
  isOpen,
  onClose,
  testTitle,
  defaultQuestions,
  defaultDuration,
  defaultDifficulty = "medium",
  isGuest = false,
  onStart,
  isGenerating = false,
}: CustomizeTestDialogProps) => {
  const GUEST_DEMO_COUNT = 15;
  const [settings, setSettings] = useState({
    difficulty: defaultDifficulty.toLowerCase() as "easy" | "medium" | "hard",
    questionCount: isGuest ? GUEST_DEMO_COUNT : defaultQuestions,
    duration: defaultDuration,
  });

  const handleSubmit = () => {
    onStart(settings);
  };

  // Minimal guest dialog — fixed free demo length, no difficulty, no AI/credit text.
  if (isGuest) {
    const demoCount = Math.min(GUEST_DEMO_COUNT, defaultQuestions || GUEST_DEMO_COUNT);
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Try free / مفت آزمائیں
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{testTitle}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                Free demo attempt ({demoCount} of {defaultQuestions || demoCount} questions)
              </p>
              <p className="text-xs text-muted-foreground">
                مفت ڈیمو ٹیسٹ · Sign in to unlock the full paper, all explanations and saved progress.
              </p>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              📚 Practice with available questions · موجودہ سوالات سے مشق کریں
            </p>
          </div>


          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isGenerating} className="flex-1">
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Loading...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start / شروع کریں
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Customize Test
          </DialogTitle>
          <DialogDescription>
            Configure your test settings for: <span className="font-medium text-foreground">{testTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Difficulty — Native select to avoid Radix Dialog pointer-event conflicts */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Difficulty Level</Label>
            <select
              value={settings.difficulty}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  difficulty: e.target.value as "easy" | "medium" | "hard",
                }))
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="easy">🟢 Easy</option>
              <option value="medium">🟡 Medium</option>
              <option value="hard">🔴 Hard</option>
            </select>
          </div>

          {/* Question Count */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                Questions
              </Label>
              <span className="text-sm font-bold text-primary">{settings.questionCount}</span>
            </div>
            <Slider
              value={[settings.questionCount]}
              onValueChange={([value]) =>
                setSettings((prev) => ({ ...prev, questionCount: value }))
              }
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10</span>
              <span>100</span>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Duration (minutes)
              </Label>
              <span className="text-sm font-bold text-primary">{settings.duration} min</span>
            </div>
            <Slider
              value={[settings.duration]}
              onValueChange={([value]) =>
                setSettings((prev) => ({ ...prev, duration: value }))
              }
              min={5}
              max={180}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 min</span>
              <span>3 hours</span>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              You'll get <span className="font-medium text-foreground">{settings.questionCount}</span> questions 
              at <span className="font-medium text-foreground capitalize">{settings.difficulty}</span> difficulty 
              with <span className="font-medium text-foreground">{settings.duration}</span> minutes to complete.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isGenerating} className="flex-1">
            {isGenerating ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Test
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
