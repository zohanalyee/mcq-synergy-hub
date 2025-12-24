import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TestCard } from "./TestCard";
import { CategoryFilter } from "./CategoryFilter";
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
        difficulty: test.difficulty || 'Medium',
        questionCount: test.questions || 20,
        duration: test.duration || 30
      };

      // Get topics - if user selected specific topics use those
      const topicsForTest = customSettings?.selectedTopics || selectedTopics[test.id];
      const finalTopics = topicsForTest && topicsForTest.length > 0 ? topicsForTest : [];

      const topic = finalTopics.length > 0 ? finalTopics[0] : `General ${test.title}`;

      toast.info(`Generating ${settings.difficulty} questions for: ${test.title}`);

      console.log("🎯 Subject Test - Calling AI Engine:", {
        mode: 'subject_test',
        subject: test.title,
        topic,
        difficulty: settings.difficulty,
        questionCount: settings.questionCount
      });

      // Call AI Test Engine
      const { data, error } = await supabase.functions.invoke("generate-test", {
        body: {
          topic: topic,
          difficulty: settings.difficulty,
          subject: test.title,
          question_count: settings.questionCount,
        },
      });

      if (error) throw error;

      if (!data?.questions || data.questions.length === 0) {
        throw new Error("No questions generated");
      }

      // Create session in DB
      const { data: session, error: sessionError } = await supabase
        .from("custom_test_sessions")
        .insert({
          session_name: `Test: ${test.title}`,
          subjects: [test.title],
          topics: finalTopics.length > 0 ? finalTopics : [topic],
          difficulty_levels: [settings.difficulty],
          question_count: data.questions.length,
          time_limit: settings.duration,
          questions: data.questions,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      toast.success(`Test ready!`, {
        description: `${data.questions.length} AI-generated questions loaded`
      });

      navigate(`/test-session/${session.id}`);
    } catch (error) {
      console.error('Error generating test:', error);
      toast.error('Failed to generate test', {
        description: error instanceof Error ? error.message : 'Please try again'
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
