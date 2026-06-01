import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, SlidersHorizontal, BookOpen, GraduationCap, Layers, Clock } from "lucide-react";
import { QuickTestDialog, QuickTestSettings } from "./QuickTestDialog";
import { useStartQuickTest } from "./useStartQuickTest";
import type { ResolvedTopic } from "./useSeoLmsCoverage";

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
  /**
   * Existing LMS topic this chip maps to (if any). When present, the chip
   * deep-links into existing content (practice/reading/subject) instead of
   * only generating a fresh test. Never creates new topics/MCQs.
   */
  resolved?: ResolvedTopic | null;
};

/**
 * Topic chip used on SEO landing pages. Reuse-first deep-link flow:
 *   - If the topic maps to an existing LMS topic WITH approved MCQs, surface
 *     Practice / Reading / Subject deep links alongside Quick Test.
 *   - If the LMS topic exists but has 0 MCQs, show a "Content coming soon"
 *     state (topic links stay active; admins later attach MCQs).
 *   - If there is no LMS match, fall back to the original Quick Test flow.
 */
export const QuickTestChip = ({
  topicName,
  subjects,
  examName,
  className,
  returnPath = "/",
  resolved = null,
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

  const hasMcqs = !!resolved && resolved.mcqCount > 0;
  const topicOnly = !!resolved && resolved.mcqCount === 0;

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
        {hasMcqs ? (
          <p className="text-xs text-primary mt-1">{resolved!.mcqCount} MCQs →</p>
        ) : topicOnly ? (
          <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
        ) : (
          <p className="text-xs text-primary mt-1">Practice →</p>
        )}
      </button>

      {/* Confirmation popup */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{topicName}</DialogTitle>
            <DialogDescription>
              {hasMcqs
                ? `Study ${resolved!.mcqCount} existing question${resolved!.mcqCount !== 1 ? "s" : ""}, read the topic, or jump into a quick test.`
                : topicOnly
                ? "This topic is part of the syllabus — questions are being added. You can still build a custom test."
                : "Jump straight into practice or fine-tune your selection in the Syllabus Builder."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            {hasMcqs && (
              <>
                <Button asChild onClick={() => setConfirmOpen(false)}>
                  <Link to={resolved!.practicePath}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Practice {resolved!.mcqCount} MCQs
                  </Link>
                </Button>
                <Button asChild variant="outline" onClick={() => setConfirmOpen(false)}>
                  <Link to={resolved!.readingPath}>
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Reading mode
                  </Link>
                </Button>
                <Button asChild variant="outline" onClick={() => setConfirmOpen(false)}>
                  <Link to={resolved!.subjectPath}>
                    <Layers className="h-4 w-4 mr-2" />
                    View {resolved!.subjectName || "subject"}
                  </Link>
                </Button>
              </>
            )}

            {topicOnly && (
              <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <span>Content coming soon for this topic.</span>
              </div>
            )}

            <Button
              variant={hasMcqs ? "ghost" : "default"}
              onClick={() => {
                setConfirmOpen(false);
                setSettingsOpen(true);
              }}
            >
              <Zap className="h-4 w-4 mr-2" />
              Start Quick Test
            </Button>

            <Button
              asChild
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
            >
              <Link to={`/custom-syllabus?subject=${subjectSlug}&topic=${topicSlug}`}>
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Customize in Syllabus Builder
              </Link>
            </Button>
          </div>
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
