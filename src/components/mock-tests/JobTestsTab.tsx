import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { JobTestCard } from "./JobTestCard";
import { CustomizeTestDialog } from "./CustomizeTestDialog";
import { toast } from "sonner";
import { JobTest } from "@/data/jobTestsData";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { generateCustomTest, TestGenerationOptions } from "@/services/testGenerationService";
import { getUserAnsweredQuestionIds } from "@/services/questionBankService";
import { AICoachService } from "@/services/aiCoachService";
import { GenerationProgressDialog, GenerationProgress } from "./GenerationProgressDialog";
import {
  findDefinitionByTitle,
  getApprovedQuestionsForDefinition,
} from "@/services/jobTestService";
import {
  fetchJobTestProgress,
  jobTestIdFromTitle,
} from "@/services/jobTestProgressService";
import { useAuth } from "@/contexts/AuthContext";
import { buildGuestSession, saveGuestSession } from "@/lib/guestSession";

type JobTestsTabProps = {
  jobTests: JobTest[];
};

export const JobTestsTab = ({ jobTests }: JobTestsTabProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedJobTest, setExpandedJobTest] = useState<string | null>(null);
  const [customizeJobTest, setCustomizeJobTest] = useState<string | null>(null);
  const [generatingTestId, setGeneratingTestId] = useState<string | null>(null);
  const [dialogTest, setDialogTest] = useState<JobTest | null>(null);

  // Sequential generation progress
  const [showProgress, setShowProgress] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress[]>([]);

  const filteredJobTests = jobTests;

  const handleStartJobTest = async (test: JobTest, customSettings?: any) => {
    setGeneratingTestId(test.id);

    try {
      // Phase 3: fetch progress so we cap question count at unlocked level
      // and feed weak topics into the AI generator
      const progressKey = jobTestIdFromTitle(test.title);
      const progress = await fetchJobTestProgress(progressKey);
      const unlockedCap = progress?.unlocked ?? 100;
      const persistedWeak = Array.isArray(progress?.weak_topics) ? progress!.weak_topics : [];

      const requestedCount = customSettings?.questionCount || Math.min(test.questions || 20, 20);
      const cappedCount = Math.min(requestedCount, unlockedCap);
      if (cappedCount < requestedCount) {
        toast.info(`You currently have ${unlockedCap} questions unlocked. Score 80%+ to unlock more.`, { duration: 5000 });
      }
      const settings = {
        difficulty: customSettings?.difficulty || "mixed",
        questionCount: cappedCount,
        duration: customSettings?.duration || test.duration,
      };

      // ============================================================
      // ISOLATED PATH: try job_test_definitions first (DB-only).
      // If a published definition exists with approved questions,
      // build the session straight from job_test_questions and skip
      // the legacy generate-test path entirely.
      // ============================================================
      const definition = await findDefinitionByTitle(test.title);
      if (definition) {
        const approved = await getApprovedQuestionsForDefinition(definition.id);
        const targetCount = settings.questionCount;

        if (approved.length === 0) {
          toast.info(
            `${test.title}: questions are being prepared. Please check back soon.`,
            { duration: 6000 },
          );
          setGeneratingTestId(null);
          return;
        }

        // Per-section quotas (Largest Remainder) using the definition's syllabus
        const sections = definition.syllabus?.sections || [];
        const totalPct = sections.reduce((s, x) => s + (x.percentage || 0), 0) || 100;
        const entries = sections.map((sec) => {
          const exact = ((sec.percentage || 0) / totalPct) * targetCount;
          const floor = Math.floor(exact);
          return { subject: sec.subject, exact, floor, remainder: exact - floor };
        });
        let sumFloors = entries.reduce((s, e) => s + e.floor, 0);
        let distributable = targetCount - sumFloors;
        const sortedRem = [...entries].sort((a, b) => b.remainder - a.remainder);
        const quotas = new Map<string, number>();
        for (const e of entries) quotas.set(e.subject, e.floor);
        for (const e of sortedRem) {
          if (distributable <= 0) break;
          quotas.set(e.subject, (quotas.get(e.subject) || 0) + 1);
          distributable--;
        }

        // Sample approved questions per subject
        const picked: any[] = [];
        const shuffle = <T,>(arr: T[]) => arr.map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
        for (const [subj, count] of quotas.entries()) {
          const pool = shuffle(approved.filter((q) => q.subject === subj));
          picked.push(...pool.slice(0, count));
        }
        // Fill remaining from any approved if quotas under-delivered
        if (picked.length < targetCount) {
          const usedIds = new Set(picked.map((q) => q.id));
          const fill = shuffle(approved.filter((q) => !usedIds.has(q.id)));
          picked.push(...fill.slice(0, targetCount - picked.length));
        }

        const finalQuestions = picked.map((q) => ({
          id: q.id,
          subject: q.subject,
          topic: q.topic || q.subject,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
        }));

        const { data: { user } } = await supabase.auth.getUser();
        const subjects = sections.map((s) => s.subject);
        const sessionPayload = {
          user_id: user?.id || null,
          session_name: `Job Test: ${test.title}`,
          subjects: subjects as any,
          topics: subjects as any,
          subtopics: [] as any,
          difficulty_levels: [settings.difficulty] as any,
          question_count: finalQuestions.length,
          time_limit: settings.duration,
          questions: finalQuestions as any,
          is_active: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };

        // GUEST PATH — RLS forbids inserting into custom_test_sessions for
        // anonymous users. Store the session in canonical guest session and
        // route TestSession with a guest-* id.
        if (!user) {
          const session = buildGuestSession({
            session_name: `Job Test: ${test.title}`,
            questions: finalQuestions,
            time_limit: settings.duration,
            subjects: subjects as string[],
            topics: subjects as string[],
            difficulty_levels: [settings.difficulty],
          });
          saveGuestSession(session);
          toast.success(`Test ready with ${finalQuestions.length} questions!`, { duration: 3500 });
          navigate(`/test-session/${session.id}`, { state: { returnPath: "/mock-tests" } });
          setGeneratingTestId(null);
          return;
        }

        const { data: session, error: sessionError } = await supabase
          .from("custom_test_sessions")
          .insert(sessionPayload)
          .select("id")
          .single();
        if (sessionError) throw sessionError;

        toast.success(`Test ready with ${finalQuestions.length} questions!`, { duration: 4000 });
        navigate(`/test-session/${session.id}`, { state: { returnPath: "/mock-tests" } });
        setGeneratingTestId(null);
        return;
      }

      // ============================================================
      // LEGACY PATH (no isolated definition found): old generate-test
      // ============================================================

      // Guests must NEVER hit the AI edge function. Fail safely with a
      // clear sign-in CTA so we don't burn credits or block them silently.
      {
        const { data: { user: legacyUser } } = await supabase.auth.getUser();
        if (!legacyUser) {
          toast.info(
            `${test.title}: questions are being prepared. Please check back soon, or sign in free to generate with AI.`,
            { duration: 6000 },
          );
          setGeneratingTestId(null);
          return;
        }
      }

      // Extract syllabus data — honor the user's saved custom syllabus when present,
      // otherwise fall back to the official syllabus. Official data is never mutated.
      const effectiveSyllabus = await getEffectiveSyllabus(test.id, test.syllabus);
      const syllabusData = effectiveSyllabus
        .filter((item) => item.topic && item.percentage && item.percentage > 0)
        .map((item) => ({ topic: item.topic, percentage: item.percentage || 0 }));

      const totalPercentage = syllabusData.reduce((a, b) => a + b.percentage, 0);
      const targetCount = settings.questionCount;

      // Calculate per-subject quotas using Largest Remainder Method
      const entries = syllabusData.map((item) => {
        const exact = (item.percentage / totalPercentage) * targetCount;
        const floor = Math.floor(exact);
        return { subject: item.topic, percentage: item.percentage, exact, floor, remainder: exact - floor };
      });
      let sumFloors = entries.reduce((s, e) => s + e.floor, 0);
      let distributable = targetCount - sumFloors;
      const sorted = [...entries].sort((a, b) => b.remainder - a.remainder);
      const quotas = new Map<string, number>();
      for (const entry of entries) quotas.set(entry.subject, entry.floor);
      for (const entry of sorted) {
        if (distributable <= 0) break;
        quotas.set(entry.subject, (quotas.get(entry.subject) || 0) + 1);
        distributable--;
      }
      for (const entry of entries) {
        if ((quotas.get(entry.subject) || 0) === 0) quotas.set(entry.subject, 1);
      }

      // Initialize progress tracking
      const progressItems: GenerationProgress[] = Array.from(quotas.entries()).map(([subject, needed]) => ({
        subject,
        requested: needed,
        generated: 0,
        status: "pending" as const,
      }));
      setGenerationProgress(progressItems);
      setShowProgress(true);

      // Fetch user's previously answered question IDs
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let excludeQuestionIds: string[] = [];
      if (user) {
        excludeQuestionIds = await getUserAnsweredQuestionIds(user.id);
      }

      // Sequential generation: call generate-test for each subject
      const allQuestions: any[] = [];
      let hasErrors = false;
      const focusTopicsAll: string[] = [];

      for (let i = 0; i < progressItems.length; i++) {
        const item = progressItems[i];

        // Update status: generating
        setGenerationProgress((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, status: "generating" as const } : p))
        );

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);

          // AI Coach: global per-user exclusion of previously attempted questions
          const coachExcludeIds = user
            ? await AICoachService.getExcludedQuestionIds(user.id, item.subject)
            : [];
          const mergedExclude = Array.from(new Set([...excludeQuestionIds, ...coachExcludeIds]));

          // AI Coach Phase 2: adaptive difficulty + weak topic focus
          const [adaptive, weak] = user
            ? await Promise.all([
                AICoachService.getAdaptiveDifficulty(user.id, item.subject),
                AICoachService.getWeaknessFocusedTopics(user.id, item.subject, 5),
              ])
            : ["medium" as const, [] as Awaited<ReturnType<typeof AICoachService.getWeaknessFocusedTopics>>];

          const weakTopicNames = weak.map((w) => w.topic);
          // Phase 4: fold in this job-test's persisted weak topics
          const mergedWeak = Array.from(new Set([...weakTopicNames, ...persistedWeak]));
          focusTopicsAll.push(...mergedWeak);

          const baseDifficulty = settings.difficulty === "mixed" ? "Medium" : settings.difficulty;
          const finalDifficulty = settings.difficulty === "mixed" && user ? adaptive : baseDifficulty;

          const { data, error } = await supabase.functions.invoke("generate-test", {
            body: {
              topic: item.subject,
              difficulty: finalDifficulty,
              question_count: item.requested,
              force_new: false,
              partial_mode: false,
              excludeQuestionIds: mergedExclude,
              weakTopics: mergedWeak,
            },
          });

          clearTimeout(timeoutId);

          if (error) throw new Error(`Edge function error: ${error.message}`);

          const questions = data?.questions || [];

          // Surface specific error from edge function when AI returned nothing
          if (questions.length === 0) {
            console.error(`[JobTest] Empty response from edge function for ${item.subject}:`, data);
            const notice =
              data?.error_notice ||
              (data?.ai_unavailable ? "AI temporarily unavailable" : "AI returned no valid questions");
            toast.error(`${item.subject}: ${notice}`, { duration: 6000 });
          }

          // Force subject/topic labels
          const labeledQuestions = questions.map((q: any) => ({
            ...q,
            subject: item.subject,
            topic: item.subject,
          }));

          allQuestions.push(...labeledQuestions);

          // Update status: complete
          setGenerationProgress((prev) =>
            prev.map((p, idx) =>
              idx === i ? { ...p, status: "complete" as const, generated: labeledQuestions.length } : p
            )
          );

          console.log(`[JobTest] ✅ ${item.subject}: ${labeledQuestions.length}/${item.requested}`);
        } catch (err: any) {
          console.error(`[JobTest] Error for ${item.subject}:`, err);
          hasErrors = true;

          // Update status: error
          setGenerationProgress((prev) =>
            prev.map((p, idx) =>
              idx === i ? { ...p, status: "error" as const, error: err.message || "Generation failed" } : p
            )
          );
          continue;
        }
      }

      // Aggregated AI Coach focus toast
      const uniqueFocus = Array.from(new Set(focusTopicsAll)).slice(0, 3);
      if (uniqueFocus.length > 0) {
        toast.info(`AI Coach is focusing this test on: ${uniqueFocus.join(", ")}`, { duration: 5000 });
      }

      // Check if we have ANY questions
      if (allQuestions.length === 0) {
        throw new Error("Failed to generate any questions. Please check your internet connection and try again.");
      }

      if (hasErrors && allQuestions.length < targetCount) {
        toast.warning(`Generated ${allQuestions.length}/${targetCount} questions. Some subjects had issues.`, {
          duration: 5000,
        });
      }

      // Create session with ACTUAL question count
      const syllabusTopics = syllabusData.map((s) => s.topic);
      const sessionPayload = {
        user_id: user?.id || null,
        session_name: `Job Test: ${test.title}`,
        subjects: syllabusTopics as any,
        topics: syllabusTopics as any,
        subtopics: [] as any,
        difficulty_levels: [settings.difficulty] as any,
        question_count: allQuestions.length, // ACTUAL count — no mismatch possible
        time_limit: settings.duration,
        questions: allQuestions as any,
        is_active: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      const { data: session, error: sessionError } = await supabase
        .from("custom_test_sessions")
        .insert(sessionPayload)
        .select("id")
        .single();

      if (sessionError) throw sessionError;

      toast.success(`Test ready with ${allQuestions.length} questions!`, {
        duration: 4000,
        action: {
          label: "View Insights",
          onClick: () => navigate("/analytics"),
        },
      });

      setShowProgress(false);
      navigate(`/test-session/${session.id}`, { state: { returnPath: "/mock-tests" } });
    } catch (error) {
      console.error("Error generating job test:", error);
      toast.error("Failed to generate test", {
        description: error instanceof Error ? error.message : "Questions may not be available for this job test syllabus",
      });
      setShowProgress(false);
    } finally {
      setGeneratingTestId(null);
    }
  };

  const toggleExpandJobTest = (testId: string) => {
    if (expandedJobTest === testId) {
      setExpandedJobTest(null);
    } else {
      setExpandedJobTest(testId);
      setCustomizeJobTest(null);
    }
  };

  const toggleCustomizeJobTest = (testId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const test = jobTests.find((t) => t.id === testId);
    if (test) setDialogTest(test);
  };

  const handleDialogStart = (settings: { difficulty: "easy" | "medium" | "hard"; questionCount: number; duration: number }) => {
    if (dialogTest) handleStartJobTest(dialogTest, settings);
  };

  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <>
      <GenerationProgressDialog
        isOpen={showProgress}
        progress={generationProgress}
        onClose={() => setShowProgress(false)}
      />
      <CustomizeTestDialog
        isOpen={dialogTest !== null}
        onClose={() => setDialogTest(null)}
        testTitle={dialogTest?.title || ""}
        defaultQuestions={dialogTest?.questions || 20}
        defaultDuration={dialogTest?.duration || 90}
        defaultDifficulty="medium"
        isGuest={!user}
        onStart={handleDialogStart}
        isGenerating={generatingTestId === dialogTest?.id}
      />
      {filteredJobTests.length > 0 ? (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 items-start"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {filteredJobTests.map((test) => (
            <motion.div key={test.id} variants={item}>
              <JobTestCard
                test={test}
                expandedJobTest={expandedJobTest}
                customizeJobTest={null}
                toggleExpandJobTest={toggleExpandJobTest}
                toggleCustomizeJobTest={toggleCustomizeJobTest}
                handleStartJobTest={handleStartJobTest}
                isGenerating={generatingTestId === test.id}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-16 bg-secondary/10 rounded-lg">
          <p className="text-muted-foreground mb-4">No job tests match your search criteria.</p>
          <Button onClick={() => {}}>Clear Search</Button>
        </div>
      )}
    </>
  );
};
