import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { generateCustomTest, TestGenerationOptions } from "@/services/testGenerationService";
import { getUserAnsweredQuestionIds } from "@/services/questionBankService";
import { buildGuestSession, saveGuestSession } from "@/lib/guestSession";
import { QuickTestSettings } from "./QuickTestDialog";

type StartArgs = {
  /** Label for the test session and toast. */
  testName: string;
  /** Subject list used to pull questions from the bank. */
  subjects: string[];
  /** Optional topic filter (single topic for chip-launches). */
  topics?: string[];
  /** Where to return after the test (kept in router state). */
  returnPath?: string;
};

/**
 * Shared launcher used by every SEO landing page Quick Test entry point.
 * Handles: DB pull → guest cap → optional AI fill → session create → navigate.
 */
export const useStartQuickTest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const start = useCallback(
    async (args: StartArgs, settings: QuickTestSettings) => {
      const { testName, subjects, topics = [], returnPath = "/" } = args;

      // Guests are capped to 20 questions even if they spoof the dropdown.
      const effectiveCount = !user ? Math.min(settings.questionCount, 20) : settings.questionCount;
      const minutesPerQ = settings.difficulty === "hard" ? 1.5 : 1;
      const timeLimit = Math.max(10, Math.round(effectiveCount * minutesPerQ));

      setIsGenerating(true);
      try {
        let excludeQuestionIds: string[] = [];
        if (user) {
          try {
            excludeQuestionIds = await getUserAnsweredQuestionIds(user.id);
          } catch {
            excludeQuestionIds = [];
          }
        }

        const options: TestGenerationOptions = {
          subjects,
          topics,
          difficulty: settings.difficulty,
          questionCount: effectiveCount,
          timeLimit,
          includeExplanations: true,
          shuffleQuestions: true,
          shuffleOptions: true,
          excludeQuestionIds: excludeQuestionIds.length ? excludeQuestionIds : undefined,
        };

        const generated = await generateCustomTest(options);
        let questions: any[] = [...(generated?.questions || [])];
        const deficit = effectiveCount - questions.length;

        // Fill deficit via AI for logged-in users only.
        if (deficit > 0 && user) {
          toast.info(`Generating ${deficit} fresh questions...`, { duration: 2500 });
          try {
            const { data, error } = await supabase.functions.invoke("generate-test", {
              body: {
                topic: topics[0] || subjects[0] || testName,
                difficulty: settings.difficulty === "mixed" ? "Medium" : settings.difficulty,
                question_count: deficit,
                partial_mode: false,
                force_new: false,
              },
            });
            if (error) throw new Error(error.message);
            const ai = (data?.questions || []).map((q: any) => ({
              ...q,
              subject: q.subject || subjects[0] || testName,
              topic: q.topic || topics[0] || testName,
            }));
            questions.push(...ai);
          } catch (e) {
            console.warn("[QuickTest] AI fill failed:", e);
            toast.warning(`Starting with ${questions.length} questions (AI unavailable)`);
          }
        }

        if (questions.length === 0) {
          toast.error("No questions available yet for this selection.", {
            description: user
              ? "Try a broader topic or check back soon."
              : "Sign in to generate fresh questions instantly.",
          });
          return;
        }

        // Guest flow → local session.
        if (!user) {
          const session = buildGuestSession({
            session_name: `Quick Test: ${testName}`,
            questions,
            time_limit: timeLimit,
            subjects,
            topics,
            difficulty_levels: [settings.difficulty],
          });
          saveGuestSession(session);
          toast.success(`Test ready with ${questions.length} questions!`);
          navigate(`/test-session/${session.id}`, { state: { returnPath } });
          return;
        }

        // Authenticated → persist to custom_test_sessions.
        const { data: session, error: sessionError } = await supabase
          .from("custom_test_sessions")
          .insert({
            user_id: user.id,
            session_name: `Quick Test: ${testName}`,
            subjects: subjects as any,
            topics: topics as any,
            subtopics: [] as any,
            difficulty_levels: [settings.difficulty] as any,
            question_count: questions.length,
            time_limit: timeLimit,
            questions: questions as any,
            is_active: true,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          })
          .select("id")
          .single();

        if (sessionError) throw sessionError;
        toast.success(`Test ready with ${questions.length} questions!`);
        navigate(`/test-session/${session.id}`, { state: { returnPath } });
      } catch (err) {
        console.error("[QuickTest] Failed:", err);
        toast.error("Failed to start test", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [navigate, user]
  );

  return { start, isGenerating, isGuest: !user };
};
