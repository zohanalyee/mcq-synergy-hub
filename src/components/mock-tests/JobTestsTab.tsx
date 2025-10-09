import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { JobTestCard } from "./JobTestCard";
import { toast } from "sonner";
import { JobTest } from "@/data/jobTestsData";
import { useNavigate } from "react-router-dom";
import { generateCustomTest, TestGenerationOptions } from "@/services/testGenerationService";

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
  
  const filteredJobTests = jobTests.filter(test => 
    !searchQuery || 
    test.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    test.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.organization.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleStartJobTest = async (test: JobTest, customSettings?: any) => {
    setGeneratingTestId(test.id);
    
    try {
      const settings = customSettings || {
        difficulty: "mixed",
        questionCount: test.questions,
        duration: test.duration
      };

      // Extract topics from syllabus - treating each syllabus item as a topic
      const topics: string[] = test.syllabus.map(item => item.topic);

      const options: TestGenerationOptions = {
        subjects: [test.title], // Use test title as subject  
        topics: topics,
        difficulty: settings.difficulty.toLowerCase(),
        questionCount: settings.questionCount,
        timeLimit: settings.duration,
        includeExplanations: true,
        shuffleQuestions: true,
        shuffleOptions: true
      };

      const generatedTest = await generateCustomTest(options);
      
      toast.success(`${test.title} ready!`, {
        description: `${generatedTest.questions.length} questions loaded from Question Bank`
      });
      
      navigate('/test-session', { state: { test: generatedTest } });
    } catch (error) {
      console.error('Error generating job test:', error);
      toast.error('Failed to generate test', {
        description: error instanceof Error ? error.message : 'Questions may not be available for this job test syllabus'
      });
    } finally {
      setGeneratingTestId(null);
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
    if (customizeJobTest === testId) {
      setCustomizeJobTest(null);
    } else {
      setCustomizeJobTest(testId);
      setExpandedJobTest(null); // Close any open syllabus panel
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
                customizeJobTest={customizeJobTest}
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
