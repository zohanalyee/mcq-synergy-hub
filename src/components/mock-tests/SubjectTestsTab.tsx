import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TestCard } from "./TestCard";
import { CategoryFilter } from "./CategoryFilter";
import { TestGenerationLoader } from "./TestGenerationLoader";
import { CustomizeTestDialog } from "./CustomizeTestDialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type SubjectTestsTabProps = {
  allMockTests: any[];
  isLoaded: boolean;
  searchQuery: string;
};

export const SubjectTestsTab = ({ allMockTests, isLoaded, searchQuery }: SubjectTestsTabProps) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [expandedTest, setExpandedTest] = useState<number | null>(null);
  const [customizeTest, setCustomizeTest] = useState<number | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<Record<number, string[]>>({});
  const [generatingTestId, setGeneratingTestId] = useState<number | null>(null);
  const [generatingTopicName, setGeneratingTopicName] = useState<string>("");
  const [dialogTest, setDialogTest] = useState<any | null>(null);
  const getCategories = () => {
    if (!allMockTests || allMockTests.length === 0) {
      return ["all"];
    }
    const categories = allMockTests.map(test => test.category);
    return ["all", ...Array.from(new Set(categories))];
  };
  
  const filteredTests = allMockTests.filter(test => {
    const categoryMatch = filter === "all" || test.category.toLowerCase() === filter.toLowerCase();
    
    const searchMatch = !searchQuery || 
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    return categoryMatch && searchMatch;
  });
  
  // DISABLED: AI features paused
  const handleStartTest = async (test: any, customSettings?: any) => {
    // AI generation temporarily disabled
    toast.error("AI Test Generation Temporarily Unavailable", {
      description: "Test generation is paused while we upgrade our AI system. Please use existing questions from the Question Bank.",
    });
  };
  
  const toggleExpandTest = (testId: number) => {
    if (expandedTest === testId) {
      setExpandedTest(null);
    } else {
      setExpandedTest(testId);
      setCustomizeTest(null); // Close any open customize panel

      const test = allMockTests.find(t => t.id === testId);
      if (test && !selectedTopics[testId]) {
        setSelectedTopics(prev => ({
          ...prev,
          [testId]: [...test.topics]
        }));
      }
    }
  };

  const toggleCustomizeTest = (testId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const test = allMockTests.find(t => t.id === testId);
    if (test) {
      setDialogTest(test);
    }
  };

  const handleDialogStart = (settings: { difficulty: "easy" | "medium" | "hard"; questionCount: number; duration: number }) => {
    if (dialogTest) {
      handleStartTest(dialogTest, settings);
    }
  };

  const handleTopicToggle = (testId: number, topic: string) => {
    setSelectedTopics(prev => {
      const currentTopics = prev[testId] || [];
      if (currentTopics.includes(topic)) {
        if (currentTopics.length === 1) {
          return prev;
        }
        return {
          ...prev,
          [testId]: currentTopics.filter(t => t !== topic)
        };
      } else {
        return {
          ...prev,
          [testId]: [...currentTopics, topic]
        };
      }
    });
  };

  const isTopicSelected = (testId: number, topic: string) => {
    return (selectedTopics[testId] || []).includes(topic);
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
        defaultDuration={dialogTest?.duration || 30}
        defaultDifficulty={dialogTest?.difficulty || "medium"}
        onStart={handleDialogStart}
        isGenerating={generatingTestId === dialogTest?.id}
      />

      <CategoryFilter 
        categories={getCategories()} 
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      {filteredTests.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-start"
          variants={container} 
          initial="hidden" 
          animate={isLoaded ? "visible" : "hidden"}
        >
          {filteredTests.map(test => (
            <motion.div key={test.id} variants={item}>
              <TestCard
                test={test}
                expandedTest={expandedTest}
                customizeTest={null}
                selectedTopics={selectedTopics}
                toggleExpandTest={toggleExpandTest}
                toggleCustomizeTest={toggleCustomizeTest}
                handleTopicToggle={handleTopicToggle}
                isTopicSelected={isTopicSelected}
                handleStartTest={handleStartTest}
                isGenerating={generatingTestId === test.id}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-16 bg-secondary/10 rounded-lg">
          <p className="text-muted-foreground mb-4">No tests match your search criteria.</p>
          <Button
            onClick={() => {
              setFilter("all");
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </>
  );
};
