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
import { generateCustomTest, TestGenerationOptions } from "@/services/testGenerationService";
import { getUserAnsweredQuestionIds } from "@/services/questionBankService";

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
    if (!allMockTests || allMockTests.length === 0) return ["all"];
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
    setGeneratingTopicName(test.title);

    try {
      const settings = customSettings || {
        difficulty: test.difficulty,
        questionCount: test.questions,
        duration: test.duration
      };

      const topicsForTest = customSettings?.selectedTopics || selectedTopics[test.id];
      const finalTopics = topicsForTest && topicsForTest.length > 0 ? topicsForTest : [];

      // Fetch user's previously answered question IDs
      const { data: { user } } = await supabase.auth.getUser();
      let excludeQuestionIds: string[] = [];
      if (user) {
        excludeQuestionIds = await getUserAnsweredQuestionIds(user.id);
      }

      const options: TestGenerationOptions = {
        subjects: [test.title],
        topics: finalTopics,
        difficulty: settings.difficulty.toLowerCase(),
        questionCount: settings.questionCount,
        timeLimit: settings.duration,
        includeExplanations: true,
        shuffleQuestions: true,
        shuffleOptions: true,
        excludeQuestionIds: excludeQuestionIds.length > 0 ? excludeQuestionIds : undefined,
      };

      const generatedTest = await generateCustomTest(options);
      
      const sessionPayload = {
        user_id: user?.id || null,
        session_name: `Test: ${test.title}`,
        subjects: options.subjects as any,
        topics: options.topics as any,
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

      if (deficit > 0) {
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
        toast.success(`Test ready!`, { description: `${bankCount} questions loaded` });
      }
      
      navigate(`/test-session/${session.id}`, { state: { returnPath: '/mock-tests' } });
    } catch (error) {
      console.error('Error generating test:', error);
      toast.error('Failed to generate test', {
        description: error instanceof Error ? error.message : 'Please try again with different settings'
      });
    } finally {
      setGeneratingTestId(null);
      setGeneratingTopicName("");
    }
  };
  
  const toggleExpandTest = (testId: number) => {
    if (expandedTest === testId) {
      setExpandedTest(null);
    } else {
      setExpandedTest(testId);
      setCustomizeTest(null);
      const test = allMockTests.find(t => t.id === testId);
      if (test && !selectedTopics[testId]) {
        setSelectedTopics(prev => ({ ...prev, [testId]: [...test.topics] }));
      }
    }
  };

  const toggleCustomizeTest = (testId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const test = allMockTests.find(t => t.id === testId);
    if (test) setDialogTest(test);
  };

  const handleDialogStart = (settings: { difficulty: "easy" | "medium" | "hard"; questionCount: number; duration: number }) => {
    if (dialogTest) handleStartTest(dialogTest, settings);
  };

  const handleTopicToggle = (testId: number, topic: string) => {
    setSelectedTopics(prev => {
      const currentTopics = prev[testId] || [];
      if (currentTopics.includes(topic)) {
        if (currentTopics.length === 1) return prev;
        return { ...prev, [testId]: currentTopics.filter(t => t !== topic) };
      }
      return { ...prev, [testId]: [...currentTopics, topic] };
    });
  };

  const isTopicSelected = (testId: number, topic: string) => {
    return (selectedTopics[testId] || []).includes(topic);
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
          <Button onClick={() => setFilter("all")}>Clear Filters</Button>
        </div>
      )}
    </>
  );
};
