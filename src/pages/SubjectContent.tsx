import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Book, Sparkles, AlertCircle } from "lucide-react";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useEffect, useState, ReactNode } from "react";
import Header from "@/components/Header";
import SubjectHeader from "@/components/subject-content/SubjectHeader";
import TopicsList from "@/components/subject-content/TopicsList";

import ModeToggle, { StudyMode } from "@/components/subject-content/ModeToggle";
import PracticeMCQCard from "@/components/subject-content/PracticeMCQCard";
import MCQControls from "@/components/subject-content/MCQControls";
import { TestGenerationLoader } from "@/components/mock-tests/TestGenerationLoader";
import { Badge } from "@/components/ui/badge";
import { mockTopics } from "@/data/topicsData";
import { supabase } from "@/integrations/supabase/client";
import { getTopicsBySubject } from "@/services/supabaseTopicService";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface MCQItem {
  id: string;
  title: string;
  question: string;
  options: { key: string; text: string }[];
  correctOption: string;
  explanation?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  topic?: string;
}

interface TopicFromDB {
  id: string;
  name: string;
  description?: string;
}

const SubjectContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoaded, setIsLoaded] = useState(false);
  const [studyMode, setStudyMode] = useState<StudyMode>("read");
  const [mcqs, setMcqs] = useState<MCQItem[]>([]);
  const [isLoadingMCQs, setIsLoadingMCQs] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [dbTopics, setDbTopics] = useState<TopicFromDB[]>([]);
  const [questionCount, setQuestionCount] = useState<string>("20");
  const [difficulty, setDifficulty] = useState<string>("Medium");
  const [questionSource, setQuestionSource] = useState<'cache' | 'ai' | 'hybrid' | null>(null);
  const [cachedCount, setCachedCount] = useState(0);
  const [aiCount, setAiCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [highlightedTopicId, setHighlightedTopicId] = useState<string | null>(null);
  
  // Get topic ID from URL query parameter (for deep linking from search)
  const topicIdFromUrl = searchParams.get('topic');
  
  // Extract all LMS context from location state
  const { 
    title, 
    purpose, 
    color, 
    topicCount,
    subjectId,    // Database UUID for LMS subjects
    levelId,
    levelName,
    systemId,
    systemName
  } = location.state || {};
  
  // Normalize the title for lookup in our mock data
  const normalizedTitle = title ? title.toLowerCase() : "";
  
  // Get topics for this subject (prefer DB topics, fallback to mock)
  // Map to the Topic interface expected by TopicsList
  const topics = dbTopics.length > 0 
    ? dbTopics.map(t => ({ title: t.name, content: t.description || '' }))
    : mockTopics[normalizedTitle] || [];
  
  // Create a default icon or generic icon for the subject
  const defaultIcon = <Book className="h-6 w-6" style={{ color: color || '#3b82f6' }} />;
  
  useEffect(() => {
    // If no title was passed in state, redirect to subjects page
    if (!title) {
      navigate("/subjects");
      return;
    }
    
    setIsLoaded(true);
    loadTopicsFromDB();
    loadMCQs();
  }, [title, navigate, subjectId]);

  // Auto-select topic from URL query parameter after topics are loaded
  useEffect(() => {
    if (topicIdFromUrl && dbTopics.length > 0) {
      const matchingTopic = dbTopics.find(t => t.id === topicIdFromUrl);
      if (matchingTopic) {
        setSelectedTopic(matchingTopic.name);
        setHighlightedTopicId(topicIdFromUrl);
        
        toast({
          title: "📚 Topic Selected",
          description: `Showing MCQs for "${matchingTopic.name}"`,
        });
        
        // Clear highlight after a few seconds
        setTimeout(() => setHighlightedTopicId(null), 3000);
      }
    }
  }, [topicIdFromUrl, dbTopics]);

  // Load topics from database for this subject
  const loadTopicsFromDB = async () => {
    if (!title) return;
    
    try {
      // If we have a subjectId (LMS subject), use it directly
      if (subjectId) {
        console.log('Loading topics for LMS subject:', subjectId);
        const topics = await getTopicsBySubject(subjectId);
        
        if (topics && topics.length > 0) {
          setDbTopics(topics.map(t => ({
            id: t.id || t.name,
            name: t.name,
            description: t.description
          })));
          return;
        }
      }
      
      // Fallback: Try to find the subject by name in the subjects table
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('id')
        .ilike('name', title)
        .maybeSingle();
      
      if (subjectData?.id) {
        // Get topics linked to this subject
        const { data: topicsData } = await supabase
          .from('topics')
          .select('id, name, description')
          .eq('subject_id', subjectData.id)
          .order('name');
        
        if (topicsData && topicsData.length > 0) {
          setDbTopics(topicsData);
          return;
        }
      }
      
      // Final fallback: Get distinct topics from content_items for this subject
      const { data: mcqTopics } = await supabase
        .from('content_items')
        .select('topic')
        .eq('category', 'mcq')
        .or(`subject.ilike.%${title}%,topic.ilike.%${title}%`)
        .not('topic', 'is', null);
      
      if (mcqTopics) {
        const uniqueTopics = Array.from(new Set(mcqTopics.map(t => t.topic).filter(Boolean)));
        setDbTopics(uniqueTopics.map(name => ({ id: name, name, description: undefined })));
      }
    } catch (error) {
      console.error("Error loading topics:", error);
    }
  };

  // Load MCQs using the generate-test edge function (hybrid: bank + AI)
  const loadMCQs = async (forceNew = false) => {
    if (!title) return;
    
    setIsLoadingMCQs(true);
    setIsGenerating(true);
    setLoadError(null);
    
    try {
      const topicToFetch = selectedTopic !== "all" ? selectedTopic : title;
      
      console.log('Calling generate-test edge function:', { 
        topic: topicToFetch, 
        difficulty, 
        question_count: parseInt(questionCount),
        forceNew 
      });
      
      const requestedCount = parseInt(questionCount);
      const { data, error } = await supabase.functions.invoke('generate-test', {
        body: {
          topic: topicToFetch,
          difficulty: difficulty,
          question_count: requestedCount,
          forceNew: forceNew,
          partial_mode: requestedCount > 20, // Enable streaming for large requests
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to load questions');
      }

      if (!data || !data.questions) {
        throw new Error('No questions returned from the server');
      }

      console.log('Edge function response:', { 
        source: data.source, 
        questionCount: data.questions.length,
        cachedCount: data.cached_count,
        aiCount: data.ai_count 
      });

      // Transform edge function response to MCQItem format
      const transformedMCQs: MCQItem[] = data.questions.map((q: any, index: number) => {
        // Handle both array options (from AI) and object options (from DB)
        let options: { key: string; text: string }[] = [];
        
        if (Array.isArray(q.options)) {
          // AI format: options is an array of strings
          options = q.options.map((opt: string, i: number) => ({
            key: ['A', 'B', 'C', 'D'][i] || String.fromCharCode(65 + i),
            text: opt
          }));
        } else if (typeof q.options === 'object' && q.options !== null) {
          // DB format: options is an object { A: string, B: string, C: string, D: string }
          options = ['A', 'B', 'C', 'D']
            .filter(key => q.options[key])
            .map(key => ({ key, text: q.options[key] }));
        }

        // Determine correct option key
        let correctOption = 'A';
        if (q.answer) {
          // If answer is the full text, find the matching option
          const matchIndex = options.findIndex(opt => opt.text === q.answer);
          if (matchIndex !== -1) {
            correctOption = options[matchIndex].key;
          } else if (['A', 'B', 'C', 'D'].includes(q.answer)) {
            // If answer is already a key (A, B, C, D)
            correctOption = q.answer;
          }
        } else if (q.correct_option) {
          correctOption = q.correct_option;
        }

        return {
          id: q.id || `mcq-${index}-${Date.now()}`,
          title: q.question || q.title || '',
          question: q.question || q.title || '',
          options,
          correctOption,
          explanation: q.explanation || undefined,
          difficulty: (q.difficulty as "Easy" | "Medium" | "Hard") || (difficulty as "Easy" | "Medium" | "Hard"),
          topic: q.topic || topicToFetch,
        };
      });

      setMcqs(transformedMCQs);
      setQuestionSource(data.source || 'cache');
      setCachedCount(data.cached_count || 0);
      setAiCount(data.ai_count || 0);
      
      if (data.source === 'ai' || data.ai_count > 0) {
        toast({
          title: data.source === 'ai' ? "🤖 AI Generated Questions" : "🔀 Mixed Source",
          description: data.source === 'ai' 
            ? `Generated ${data.ai_count} new questions and saved to bank`
            : `${data.cached_count} from bank + ${data.ai_count} AI generated`,
        });
      }
      
    } catch (error: any) {
      console.error("Error loading MCQs:", error);
      setLoadError(error.message || 'Failed to load questions');
      setMcqs([]);
      
      // Show error toast
      toast({
        variant: "destructive",
        title: "Failed to load questions",
        description: error.message || "Please try again or generate new questions",
      });
    } finally {
      setIsLoadingMCQs(false);
      setIsGenerating(false);
    }
  };

  // Handle generate new questions (force AI generation)
  const handleGenerateNew = () => {
    loadMCQs(true); // forceNew = true
  };

  // Handle refresh (use cache first)
  const handleRefresh = () => {
    loadMCQs(false); // forceNew = false
  };

  // Reload when settings change
  const handleQuestionCountChange = (value: string) => {
    setQuestionCount(value);
  };

  const handleDifficultyChange = (value: string) => {
    setDifficulty(value);
  };

  // Get unique topics from MCQs for filtering
  const mcqTopics = Array.from(new Set(mcqs.map(m => m.topic).filter(Boolean))) as string[];
  
  // Filter MCQs by selected topic
  const filteredMCQs = selectedTopic === "all" 
    ? mcqs 
    : mcqs.filter(m => m.topic === selectedTopic);
  
  return (
    <Header>
      {/* Generation Loader Overlay */}
      <TestGenerationLoader 
        isVisible={isGenerating} 
        topicName={selectedTopic !== "all" ? selectedTopic : title} 
      />
      
      <div className="container mx-auto px-4 py-4">
        {/* Breadcrumb Navigation: System > Level > Subject */}
        <PageBreadcrumb 
          items={[
            ...(systemName ? [{
              title: systemName,
              href: `/subjects?system=${encodeURIComponent(systemId || '')}`,
              isCurrent: false
            }] : []),
            ...(levelName ? [{
              title: levelName,
              href: `/subjects?system=${encodeURIComponent(systemId || '')}&level=${encodeURIComponent(levelId || '')}`,
              isCurrent: false
            }] : []),
            {
              title: title || 'Subject',
              href: '#',
              isCurrent: true
            }
          ]}
          showBackButton={true}
          showHomeButton={false}
        />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <SubjectHeader 
            title={title || ""}
            purpose={purpose || "reading"}
            color={color || "#3b82f6"}
            icon={defaultIcon}
            topicCount={topicCount || topics.length}
          />
          
          {/* Mode Toggle Section */}
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <ModeToggle mode={studyMode} onModeChange={setStudyMode} />
            
            <div className="text-sm text-muted-foreground">
              {studyMode === "read" ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  Correct answers are highlighted for memorization
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary"></span>
                  Click options to reveal Right/Wrong feedback
                </span>
              )}
            </div>
          </div>
          
          {/* MCQ Controls Panel */}
          <MCQControls
            questionCount={questionCount}
            difficulty={difficulty}
            onQuestionCountChange={handleQuestionCountChange}
            onDifficultyChange={handleDifficultyChange}
            onRefresh={handleRefresh}
            onGenerate={handleGenerateNew}
            isLoading={isLoadingMCQs}
            questionSource={questionSource}
            totalQuestions={mcqs.length}
            cachedCount={cachedCount}
            aiCount={aiCount}
          />
          
          {/* Topic Filter for MCQs */}
          {mcqTopics.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTopic("all")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedTopic === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                All Topics ({mcqs.length})
              </button>
              {mcqTopics.map(topic => {
                const matchingDbTopic = dbTopics.find(t => t.name === topic);
                const isHighlighted = matchingDbTopic && matchingDbTopic.id === highlightedTopicId;
                
                return (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedTopic === topic
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    } ${isHighlighted ? "ring-2 ring-primary ring-offset-2 animate-pulse" : ""}`}
                  >
                    {topic} ({mcqs.filter(m => m.topic === topic).length})
                  </button>
                );
              })}
            </div>
          )}
          
          {/* Loading State */}
          {isLoadingMCQs && !isGenerating ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Loading questions...</span>
            </div>
          ) : loadError ? (
            /* Error State */
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 mx-auto text-destructive/60 mb-4" />
              <h3 className="text-lg font-medium mb-2">Failed to Load Questions</h3>
              <p className="text-muted-foreground mb-6">{loadError}</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleRefresh}>
                  Try Again
                </Button>
                <Button onClick={handleGenerateNew} className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Generate with AI
                </Button>
              </div>
            </div>
          ) : filteredMCQs.length > 0 ? (
            /* MCQ List */
            <div className="space-y-4">
              {filteredMCQs.map((mcq, index) => (
                <PracticeMCQCard
                  key={mcq.id}
                  id={mcq.id}
                  title={mcq.title}
                  question={mcq.question}
                  options={mcq.options}
                  correctOption={mcq.correctOption}
                  explanation={mcq.explanation}
                  difficulty={mcq.difficulty}
                  mode={studyMode}
                  index={index}
                />
              ))}
            </div>
          ) : (
            /* Empty State with Generate Button */
            <div className="text-center py-12">
              <Book className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium mb-2">No MCQs Available Yet</h3>
              <p className="text-muted-foreground mb-6">
                Generate practice questions using AI for "{selectedTopic !== "all" ? selectedTopic : title}"
              </p>
              <Button onClick={handleGenerateNew} size="lg" className="gap-2">
                <Sparkles className="w-5 h-5" />
                Generate {questionCount} Questions
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </Header>
  );
};

export default SubjectContent;
