import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, SlidersHorizontal } from "lucide-react";
import { QuickTestDialog, QuickTestSettings } from "./QuickTestDialog";
import { useStartQuickTest } from "./useStartQuickTest";

type Props = {
  /** Topic shown to the user. */
  topicName: string;
  /** Subject(s) used to scope the question bank pull. */
  subjects: string[];
  /** Exam name for the session label. */
  examName: string;
  /** Visual classes for the chip. */
  className?: string;
  /** Where to return after the test. */
  returnPath?: string;
};

/**
 * Topic chip used on SEO landing pages. Click flow:
 *   1. Confirm popup → "Start Quick Test" or "Customize in Syllabus Builder"
 *   2. Quick Test → opens QuickTestDialog → routes to /test-session/:id
 *   3. Customize → /custom-syllabus?subject=&topic=
 */
export const QuickTestChip = ({
  topicName,
  subjects,
  examName,
  className,
  returnPath = "/",
}: Props) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { start, isGenerating, isGuest } = useStartQuickTest();

  const handleStart = async (settings: QuickTestSettings) => {
    await start(
      {
        testName: `${topicName} — ${examName}`,
        subjects,
        topics: [topicName],
        returnPath,
      },
      settings
    );
    setSettingsOpen(false);
  };

  const subjectSlug = subjects[0]
    ? subjects[0].toLowerCase().replace(/[^a-z0-9]+/g, "-")
    : "";
  const topicSlug = topicName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className={
          className ||
          "p-3 border rounded-lg hover:bg-primary/5 text-center w-full transition-colors"
        }
      >
        <p className="text-sm font-medium">{topicName}</p>
        <p className="text-xs text-primary mt-1">Practice →</p>
      </button>

      {/* Confirmation popup */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start a quick test for {topicName}?</DialogTitle>
            <DialogDescription>
              Jump straight into practice or fine-tune your selection in the Syllabus Builder.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
            <Button
              asChild
              variant="outline"
              className="sm:flex-1"
              onClick={() => setConfirmOpen(false)}
            >
              <Link to={`/custom-syllabus?subject=${subjectSlug}&topic=${topicSlug}`}>
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Customize
              </Link>
            </Button>
            <Button
              className="sm:flex-1"
              onClick={() => {
                setConfirmOpen(false);
                setSettingsOpen(true);
              }}
            >
              <Zap className="h-4 w-4 mr-2" />
              Start Quick Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuickTestDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title={`${topicName} — ${examName}`}
        subtitle="Questions pulled from your topic of choice"
        isGuest={isGuest}
        isGenerating={isGenerating}
        onStart={handleStart}
      />
    </>
  );
};
