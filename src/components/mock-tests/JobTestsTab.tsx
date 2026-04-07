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

      const subjects: string[] = test.syllabus.map(item => item.topic);

      const options: TestGenerationOptions = {
        subjects: subjects,
        topics: [],
        difficulty: settings.difficulty.toLowerCase(),
        questionCount: settings.questionCount,
        timeLimit: settings.duration,
        includeExplanations: true,
        shuffleQuestions: true,
        shuffleOptions: true
      };

      const generatedTest = await generateCustomTest(options);
      
      toast.success(`${test.title} ready!`, {
        description: `${generatedTest.questions.length} questions loaded`
      });
      
      navigate('/test-session', { state: { test: generatedTest } });
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
