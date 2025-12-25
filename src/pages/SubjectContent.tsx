import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Book, Loader2 } from "lucide-react";
import { useEffect, useState, ReactNode } from "react";
import Header from "@/components/Header";
import SubjectHeader from "@/components/subject-content/SubjectHeader";
import TopicsList from "@/components/subject-content/TopicsList";
import BackButton from "@/components/subject-content/BackButton";
import ModeToggle, { StudyMode } from "@/components/subject-content/ModeToggle";
import PracticeMCQCard from "@/components/subject-content/PracticeMCQCard";
import { mockTopics } from "@/data/topicsData";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

const SubjectContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [studyMode, setStudyMode] = useState<StudyMode>("read");
  const [mcqs, setMcqs] = useState<MCQItem[]>([]);
  const [isLoadingMCQs, setIsLoadingMCQs] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  
  const { title, purpose, color, topicCount } = location.state || {};
  
  // Normalize the title for lookup in our mock data
  const normalizedTitle = title ? title.toLowerCase() : "";
  
  // Get topics for this subject or use empty array if not found
  const topics = mockTopics[normalizedTitle] || [];
  
  // Create a default icon or generic icon for the subject
  const defaultIcon = <Book className="h-6 w-6" style={{ color: color || '#3b82f6' }} />;
  
  useEffect(() => {
    // If no title was passed in state, redirect to subjects page
    if (!title) {
      navigate("/subjects");
      return;
    }
    
    setIsLoaded(true);
    loadMCQs();
  }, [title, navigate]);

  const loadMCQs = async () => {
    if (!title) return;
    
    setIsLoadingMCQs(true);
    try {
      // Fetch MCQs for this subject from Supabase
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('category', 'mcq')
        .eq('status', 'approved')
        .ilike('subject', title)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to MCQItem format
      const transformedMCQs: MCQItem[] = (data || []).map(item => {
        const options = typeof item.options === 'object' && item.options !== null
          ? item.options as Record<string, string>
          : { A: '', B: '', C: '', D: '' };
        
        return {
          id: item.id,
          title: item.title,
          question: item.description || item.title,
          options: [
            { key: 'A', text: options.A || '' },
            { key: 'B', text: options.B || '' },
            { key: 'C', text: options.C || '' },
            { key: 'D', text: options.D || '' },
          ].filter(opt => opt.text),
          correctOption: item.correct_option || 'A',
          explanation: item.explanation || undefined,
          difficulty: (item.difficulty as "Easy" | "Medium" | "Hard") || undefined,
          topic: item.topic || undefined,
        };
      });

      setMcqs(transformedMCQs);
    } catch (error) {
      console.error("Error loading MCQs:", error);
    } finally {
      setIsLoadingMCQs(false);
    }
  };

  // Get unique topics from MCQs
  const mcqTopics = Array.from(new Set(mcqs.map(m => m.topic).filter(Boolean))) as string[];
  
  // Filter MCQs by selected topic
  const filteredMCQs = selectedTopic === "all" 
    ? mcqs 
    : mcqs.filter(m => m.topic === selectedTopic);
  
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-16">
        <BackButton />
        
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
          
          <Tabs defaultValue="topics" className="mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto mb-6">
              <TabsTrigger value="topics">Topics & Chapters</TabsTrigger>
              <TabsTrigger value="mcqs" className="relative">
                MCQ Questions
                {mcqs.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                    {mcqs.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="topics">
              {isLoaded && (
                <TopicsList topics={topics} purpose={purpose || "reading"} />
              )}
            </TabsContent>
            
            <TabsContent value="mcqs">
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
                  {mcqTopics.map(topic => (
                    <button
                      key={topic}
                      onClick={() => setSelectedTopic(topic)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedTopic === topic
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {topic} ({mcqs.filter(m => m.topic === topic).length})
                    </button>
                  ))}
                </div>
              )}
              
              {isLoadingMCQs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Loading questions...</span>
                </div>
              ) : filteredMCQs.length > 0 ? (
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
                <div className="text-center py-12">
                  <Book className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No MCQs Available</h3>
                  <p className="text-muted-foreground">
                    MCQs for this subject will appear here once added.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </>
  );
};

export default SubjectContent;
