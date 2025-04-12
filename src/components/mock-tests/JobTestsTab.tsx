
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { JobTestCard } from "./JobTestCard";
import { toast } from "sonner";
import { JobTest } from "@/data/jobTestsData";

type JobTestsTabProps = {
  jobTests: JobTest[];
  isLoaded: boolean;
  searchQuery: string;
};

export const JobTestsTab = ({ jobTests, isLoaded, searchQuery }: JobTestsTabProps) => {
  const [expandedJobTest, setExpandedJobTest] = useState<number | null>(null);
  const [customizeJobTest, setCustomizeJobTest] = useState<number | null>(null);
  
  const filteredJobTests = jobTests.filter(test => 
    !searchQuery || 
    test.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    test.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.organization.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleStartJobTest = (test: JobTest, customSettings?: any) => {
    const settings = customSettings || {
      difficulty: "Medium", // Default value since JobTest doesn't have a difficulty property
      questionCount: test.questions,
      duration: test.duration
    };
    toast.success(`Starting ${test.title}`, {
      description: `${settings.questionCount} questions • ${settings.duration} minutes • Official Test`
    });
    console.log(`Starting job test: ${test.title}`, {
      ...settings,
      syllabus: test.syllabus
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
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
