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
  
  // DISABLED: AI features paused
  const handleStartJobTest = async (test: JobTest, customSettings?: any) => {
    // AI generation temporarily disabled
    toast.error("AI Test Generation Temporarily Unavailable", {
      description: "Test generation is paused while we upgrade our AI system. Please use existing questions from the Question Bank.",
    });
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
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 items-start"
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
