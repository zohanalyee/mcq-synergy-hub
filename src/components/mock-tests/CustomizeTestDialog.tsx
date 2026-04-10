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
  onStart,
  isGenerating = false,
}: CustomizeTestDialogProps) => {
  const [settings, setSettings] = useState({
    difficulty: defaultDifficulty.toLowerCase() as "easy" | "medium" | "hard",
    questionCount: defaultQuestions,
    duration: defaultDuration,
  });

  const handleSubmit = () => {
    onStart(settings);
  };

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
