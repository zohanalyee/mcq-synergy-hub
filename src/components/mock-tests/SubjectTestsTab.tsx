import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TestCard } from "./TestCard";
import { CategoryFilter } from "./CategoryFilter";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { generateCustomTest, TestGenerationOptions } from "@/services/testGenerationService";
import { Loader2 } from "lucide-react";

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
  
  const handleStartTest = async (test: any, customSettings?: any) => {
    setGeneratingTestId(test.id);
    
    try {
      const settings = customSettings || {
        difficulty: test.difficulty,
        questionCount: test.questions,
        duration: test.duration
      };

      // Get topics - if user selected specific topics use those, otherwise get ALL topics for subject
      const topicsForTest = customSettings?.selectedTopics || selectedTopics[test.id];
      const finalTopics = topicsForTest && topicsForTest.length > 0 ? topicsForTest : [];

      const options: TestGenerationOptions = {
        subjects: [test.title], // Subject name e.g., "Mathematics"
        topics: finalTopics,    // Empty array = all topics, or specific topics if customized
        difficulty: settings.difficulty.toLowerCase(),
        questionCount: settings.questionCount,
        timeLimit: settings.duration,
        includeExplanations: true,
        shuffleQuestions: true,
        shuffleOptions: true
      };

      const generatedTest = await generateCustomTest(options);
      
      toast.success(`Test ready!`, {
        description: `${generatedTest.questions.length} questions loaded from Question Bank`
      });
      
      navigate('/test-session', { state: { test: generatedTest } });
    } catch (error) {
      console.error('Error generating test:', error);
      toast.error('Failed to generate test', {
        description: error instanceof Error ? error.message : 'Please try again with different settings'
      });
    } finally {
      setGeneratingTestId(null);
    }
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
    if (customizeTest === testId) {
      setCustomizeTest(null);
    } else {
      setCustomizeTest(testId);
      setExpandedTest(null); // Close any open topic panel
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
      <CategoryFilter 
        categories={getCategories()} 
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      {filteredTests.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start" 
          variants={container} 
          initial="hidden" 
          animate={isLoaded ? "visible" : "hidden"}
        >
          {filteredTests.map(test => (
            <motion.div key={test.id} variants={item}>
              <TestCard
                test={test}
                expandedTest={expandedTest}
                customizeTest={customizeTest}
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
