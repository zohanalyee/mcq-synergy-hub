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

type JobTestsTabProps = {
  jobTests: JobTest[];
  isLoaded: boolean;
  searchQuery: string;
};

export const JobTestsTab = ({ jobTests, isLoaded, searchQuery }: JobTestsTabProps) => {
  const navigate = useNavigate();
  const [expandedJobTest, setExpandedJobTest] = useState<number | null>(null);
  const [customizeJobTest, setCustomizeJobTest] = useState<number | null>(null);
  const [generatingTestId, setGeneratingTestId] = useState<number | null>(null);
  const [generatingTopicName, setGeneratingTopicName] = useState<string>("");
  const [dialogTest, setDialogTest] = useState<JobTest | null>(null);
  
  const filteredJobTests = jobTests.filter(test => 
    !searchQuery || 
    test.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    test.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.organization.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleStartJobTest = async (test: JobTest, customSettings?: any) => {
    setGeneratingTestId(test.id);
    setGeneratingTopicName(test.title);
    setDialogTest(null); // Close dialog
    
    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to start a test");
        navigate("/auth");
        setGeneratingTestId(null);
        return;
      }

      const settings = customSettings || {
        difficulty: "Medium",
        questionCount: test.questions || 20,
        duration: test.duration || 90
      };

      // Extract subjects from syllabus
      const syllabusSubjects: string[] = test.syllabus?.map(item => item.topic) || 
        ['General Knowledge', 'English', 'Current Affairs'];

      // Determine if we should use partial mode (for large requests)
      const usePartialMode = settings.questionCount > 20;

      console.log("🎯 Job Test - Calling AI Engine:", {
        mode: 'job_test',
        topic: test.title,
        subjects: syllabusSubjects,
        timeLimit: settings.duration,
        questionCount: settings.questionCount,
        partial_mode: usePartialMode,
        userId: user.id
      });

      // Call AI Test Engine with job test context
      const { data, error } = await supabase.functions.invoke("generate-test", {
        body: {
          topic: test.title,
          difficulty: settings.difficulty,
          subject: syllabusSubjects[0], // Primary subject
          question_count: settings.questionCount,
          partial_mode: usePartialMode, // Enable partial mode for large requests
        },
      });

      if (error) throw error;

      if (!data?.questions || data.questions.length === 0) {
        throw new Error("No questions generated");
      }

      console.log(`📊 Job Test Response: ${data.questions.length} questions, remaining: ${data.remaining_count || 0}, source: ${data.source}`);

      // CRITICAL: Save REQUESTED total as question_count, not returned partial count
      const { data: session, error: sessionError } = await supabase
        .from("custom_test_sessions")
        .insert({
          session_name: `Job Test: ${test.title}`,
          subjects: syllabusSubjects,
          topics: [test.title],
          difficulty_levels: [settings.difficulty],
          question_count: settings.questionCount, // REQUESTED TOTAL (not data.questions.length)
          time_limit: settings.duration,
          questions: data.questions,
          user_id: user.id,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Show source-based toast
      const sourceIcon = data.source === 'cache' ? '⚡' : 
                         data.source === 'cache_partial' ? '⏳' :
                         data.source === 'hybrid' ? '🔀' : '🤖';
      const sourceText = data.source === 'cache' ? 'Loaded from Bank' : 
                         data.source === 'cache_partial' ? `${data.cached_count} loaded, ${data.remaining_count} loading...` :
                         data.source === 'hybrid' ? `${data.cached_count} cached + ${data.ai_count} new` : 
                         'AI Generated';
      
      toast.success(`${sourceIcon} ${test.title} ready!`, {
        description: `${data.questions.length} questions - ${sourceText}`
      });

      // Pass returnPath for Smart Return feature
      navigate(`/test-session/${session.id}`, { state: { returnPath: '/mock-tests' } });
    } catch (error) {
      console.error('Error generating job test:', error);
      toast.error('Failed to generate test', {
        description: error instanceof Error ? error.message : 'Please try again'
      });
    } finally {
      setGeneratingTestId(null);
      setGeneratingTopicName("");
    }
  };
  
  const toggleExpandJobTest = (testId: number) => {
    if (expandedJobTest === testId) {
      setExpandedJobTest(null);
    } else {
      setExpandedJobTest(testId);
      setCustomizeJobTest(null); // Close any open customize panel
    }
  };
  
  const toggleCustomizeJobTest = (testId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const test = jobTests.find(t => t.id === testId);
    if (test) {
      setDialogTest(test);
    }
  };

  const handleDialogStart = (settings: { difficulty: "easy" | "medium" | "hard"; questionCount: number; duration: number }) => {
    if (dialogTest) {
      handleStartJobTest(dialogTest, settings);
    }
  };
  
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <>
      {/* Full-screen Loader */}
      <TestGenerationLoader 
        isVisible={generatingTestId !== null} 
        topicName={generatingTopicName} 
      />

      {/* Customize Dialog */}
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start"
          variants={container} 
          initial="hidden" 
          animate={isLoaded ? "visible" : "hidden"}
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
          <Button
            onClick={() => {
              // This is passed from the parent component
            }}
          >
            Clear Search
          </Button>
        </div>
      )}
    </>
  );
};
