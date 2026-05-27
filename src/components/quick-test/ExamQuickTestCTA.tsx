import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { QuickTestDialog, QuickTestSettings } from "./QuickTestDialog";
import { useStartQuickTest } from "./useStartQuickTest";

type Props = {
  examName: string;
  /** All subjects for this exam — used to pull a balanced mix from the bank. */
  subjects: string[];
  className?: string;
  variant?: "primary" | "hero";
  label?: string;
  returnPath?: string;
};

/**
 * Primary "Practice Full [Exam] Test" CTA shown at the top and bottom of every
 * SEO landing page. Opens the QuickTestDialog and routes into the Quiz Engine.
 */
export const ExamQuickTestCTA = ({
  examName,
  subjects,
  className,
  variant = "primary",
  label,
  returnPath = "/",
}: Props) => {
  const [open, setOpen] = useState(false);
  const { start, isGenerating, isGuest } = useStartQuickTest();

  const handleStart = async (settings: QuickTestSettings) => {
    await start(
      { testName: `${examName} — Full Mix`, subjects, returnPath },
      settings
    );
    setOpen(false);
  };

  const buttonLabel = label || `Practice Full ${examName} Test`;

  return (
    <>
      <Button
        size={variant === "hero" ? "lg" : "default"}
        onClick={() => setOpen(true)}
        className={
          className ||
          (variant === "hero"
            ? "bg-white text-purple-700 hover:bg-white/90 px-8 py-3 rounded-full font-semibold"
            : "")
        }
      >
        <Zap className="h-4 w-4 mr-2" />
        {buttonLabel}
      </Button>

      <QuickTestDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`${examName} — Full Practice Test`}
        subtitle={`Balanced mix across ${subjects.length} subjects`}
        isGuest={isGuest}
        isGenerating={isGenerating}
        onStart={handleStart}
      />
    </>
  );
};
