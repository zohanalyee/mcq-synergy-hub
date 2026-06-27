import { useQuery } from "@tanstack/react-query";
import { Lock, FileQuestion, Loader2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cleanQuestionText } from "@/lib/questionUtils";
import {
  getMockTestPreviewQuestions,
  PreviewQuestion,
  SyllabusItem,
} from "@/services/jobTestService";

interface QuestionsPreviewProps {
  title: string;
  /** The test's syllabus — used to match real questions from the MCQ bank. */
  syllabus?: SyllabusItem[];
  /** How many questions to expose publicly. */
  limit?: number;
  /** Optional explicit link to a Job Test Definition pool. */
  definitionId?: string | null;
}

const normalizeOptions = (options: PreviewQuestion["options"]): string[] => {
  if (Array.isArray(options)) return options as string[];
  if (options && typeof options === "object") return Object.values(options);
  return [];
};

export const QuestionsPreview = ({ title, syllabus = [], limit = 5, definitionId }: QuestionsPreviewProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["mock-test-preview", title, definitionId ?? "", syllabus.map((s) => s.topic).join("|")],
    queryFn: () => getMockTestPreviewQuestions(title, syllabus, limit, definitionId),
  });

  const questions = (data || []).slice(0, limit);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading question preview…
      </div>
    );
  }

  // Fallback message only when absolutely no questions exist for this test.
  if (questions.length === 0) {
    return (
      <section aria-labelledby="preview-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 id="preview-heading" className="text-lg font-semibold text-foreground">
            Questions Preview
          </h2>
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Questions for this mock test are being prepared. Start the test to generate
            fresh, exam-style questions from the official syllabus.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="preview-heading" className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 id="preview-heading" className="text-lg font-semibold text-foreground">
          Questions Preview
        </h2>
        <Badge variant="secondary" className="gap-1">
          <FileQuestion className="h-3 w-3" /> Real MCQs
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        These are real, exam-style multiple-choice questions already prepared for this mock test.
        Correct answers and detailed explanations are unlocked with Premium.
      </p>

      <div className="space-y-3">
        {questions.map((q, i) => {
          const options = normalizeOptions(q.options);
          return (
            <article
              key={q.id}
              className="rounded-xl border border-border bg-card/60 p-3 sm:p-4 space-y-3"
            >
              <h3 className="text-sm sm:text-base font-medium text-foreground leading-snug">
                Q{i + 1}. {cleanQuestionText(q.question)}
              </h3>

              <ul className="space-y-1.5">
                {options.map((option, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 rounded-lg border border-border/60 bg-background/40 px-2.5 py-2"
                  >
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-foreground">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs sm:text-sm text-foreground leading-snug">{option}</span>
                  </li>
                ))}
              </ul>

              {/* Premium-locked answer */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <Lock className="h-3.5 w-3.5" /> Correct Answer (Premium)
                </div>
                <div className="mt-1.5 select-none rounded bg-foreground/10 px-2 py-1.5 blur-sm text-sm text-foreground/70">
                  {q.correct_answer || "Hidden answer content"}
                </div>
              </div>

              {/* Premium-locked explanation */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <Lock className="h-3.5 w-3.5" /> Explanation (Premium)
                </div>
                <div className="mt-1.5 select-none rounded bg-foreground/10 px-2 py-1.5 blur-sm text-sm text-foreground/70 line-clamp-3">
                  {q.explanation ||
                    "Detailed explanation of why this answer is correct is available with Premium access."}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default QuestionsPreview;
