import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { JobTestCard } from "./JobTestCard";
import { TestGenerationLoader } from "./TestGenerationLoader";
import { CustomizeTestDialog } from "./CustomizeTestDialog";
import { toast } from "sonner";
import { JobTest } from "@/data/jobTestsData";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { generateCustomTest, TestGenerationOptions } from "@/services/testGenerationService";
import { getUserAnsweredQuestionIds } from "@/services/questionBankService";

type JobTestsTabProps = {
  jobTests: JobTest[];
};

export const JobTestsTab = ({ jobTests }: JobTestsTabProps) => {
  const navigate = useNavigate();
  const [expandedJobTest, setExpandedJobTest] = useState<string | null>(null);
  const [customizeJobTest, setCustomizeJobTest] = useState<string | null>(null);
  const [generatingTestId, setGeneratingTestId] = useState<string | null>(null);
  const [generatingTopicName, setGeneratingTopicName] = useState<string>("");
  const [dialogTest, setDialogTest] = useState<JobTest | null>(null);
  
  const filteredJobTests = jobTests;
  
  const handleStartJobTest = async (test: JobTest, customSettings?: any) => {
    setGeneratingTestId(test.id);
    setGeneratingTopicName(test.title);

    try {
      const settings = customSettings || {
        difficulty: "mixed",
        questionCount: test.questions,
        duration: test.duration
      };

      // Extract raw syllabus data from the test
      const syllabusData = test.syllabus
        .filter(item => item.topic && item.percentage && item.percentage > 0)
        .map(item => ({ topic: item.topic, percentage: item.percentage || 0 }));

      const syllabusTopics = syllabusData.map(s => s.topic);

      // Fetch user's previously answered question IDs for anti-repetition
      const { data: { user } } = await supabase.auth.getUser();
      let excludeQuestionIds: string[] = [];
      if (user) {
        excludeQuestionIds = await getUserAnsweredQuestionIds(user.id);
      }

      const options: TestGenerationOptions = {
        subjects: syllabusTopics,
        topics: syllabusTopics,
        difficulty: settings.difficulty.toLowerCase(),
        questionCount: settings.questionCount,
        timeLimit: settings.duration,
        includeExplanations: true,
        shuffleQuestions: true,
        shuffleOptions: true,
        syllabusData: syllabusData.length > 0 ? syllabusData : undefined,
        excludeQuestionIds: excludeQuestionIds.length > 0 ? excludeQuestionIds : undefined,
      };

      const generatedTest = await generateCustomTest(options);
      
      // Save session to DB and navigate by ID
      const sessionPayload = {
        user_id: user?.id || null,
        session_name: `Job Test: ${test.title}`,
        subjects: syllabusTopics as any,
        topics: syllabusTopics as any,
        subtopics: [] as any,
        difficulty_levels: [options.difficulty] as any,
        question_count: options.questionCount,
        time_limit: options.timeLimit,
        questions: generatedTest.questions as any,
        is_active: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      const { data: session, error: sessionError } = await supabase
        .from('custom_test_sessions')
        .insert(sessionPayload)
        .select('id')
        .single();

      if (sessionError) throw sessionError;

      const bankCount = generatedTest.questions.length;
      const deficit = generatedTest.deficit;
      const subjectDeficits = generatedTest.subjectDeficits;

      if (deficit > 0 && subjectDeficits && Object.keys(subjectDeficits).length > 0) {
        const deficitEntries = Object.entries(subjectDeficits);
        const deficitSummary = deficitEntries.map(([s, c]) => `${c} ${s}`).join(', ');
        toast.info(`Starting with ${bankCount} questions — AI generating ${deficitSummary} in background`, { duration: 5000 });

        // Trigger AI generation per missing subject
        for (const [subjectName, subjectDeficit] of deficitEntries) {
          supabase.functions.invoke('generate-test', {
            body: {
              topic: subjectName,
              difficulty: options.difficulty === 'mixed' ? 'Medium' : options.difficulty,
              question_count: subjectDeficit,
              session_id: session.id
            }
          }).catch(err => console.error(`Background AI generation error for ${subjectName}:`, err));
        }
      } else if (deficit > 0) {
        toast.info(`Starting with ${bankCount} questions — AI generating ${deficit} more in background`, { duration: 4000 });
        supabase.functions.invoke('generate-test', {
          body: {
            topic: test.title,
            difficulty: options.difficulty === 'mixed' ? 'Medium' : options.difficulty,
            question_count: options.questionCount,
            session_id: session.id
          }
        }).catch(err => console.error('Background AI generation error:', err));
      } else {
        toast.success(`${test.title} ready!`, { description: `${bankCount} questions loaded` });
      }
      
      navigate(`/test-session/${session.id}`, { state: { returnPath: '/mock-tests' } });
    } catch (error) {
      console.error('Error generating job test:', error);
      toast.error('Failed to generate test', {
        description: error instanceof Error ? error.message : 'Questions may not be available for this job test syllabus'
      });
    } finally {
      setGeneratingTestId(null);
      setGeneratingTopicName("");
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
    const test = jobTests.find(t => t.id === testId);
    if (test) setDialogTest(test);
  };

  const handleDialogStart = (settings: { difficulty: "easy" | "medium" | "hard"; questionCount: number; duration: number }) => {
    if (dialogTest) handleStartJobTest(dialogTest, settings);
  };
  
  const container = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <>
      <TestGenerationLoader 
        isVisible={generatingTestId !== null} 
        topicName={generatingTopicName} 
      />
      <CustomizeTestDialog
        isOpen={dialogTest !== null}
        onClose={() => setDialogTest(null)}
        testTitle={dialogTest?.title || ""}
        defaultQuestions={dialogTest?.questions || 20}
        defaultDuration={dialogTest?.duration || 90}
        defaultDifficulty="medium"
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
          {filteredJobTests.map(test => (
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
