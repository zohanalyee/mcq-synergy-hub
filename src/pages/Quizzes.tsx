import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Header from "@/components/Header";
import { SearchBox } from "@/components/quizzes/SearchBox";
import { SubjectQuizzesTab } from "@/components/quizzes/SubjectQuizzesTab";
import { TopicQuizzesTab } from "@/components/quizzes/TopicQuizzesTab";
import { getQuizzes, getQuizzesBySubject } from "@/services/quizService";

const Quizzes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [allQuizzes, setAllQuizzes] = useState<any[]>([]);
  const [subjectQuizzes, setSubjectQuizzes] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("topics");
  
  useEffect(() => {
    // Load quizzes
    const quizzes = getQuizzes();
    setAllQuizzes(quizzes);
    
    // Load subject quizzes - passing an empty string to get all subjects
    const bySubject = getQuizzesBySubject("");
    setSubjectQuizzes(bySubject);
    
    setIsLoaded(true);
  }, []);
  
  const handleClearSearch = () => {
    setSearchQuery("");
  };
  
  return (
    <Header>
      <div className="container mx-auto px-4 pt-4 pb-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-center"
        >
          <h1 className="text-2xl font-bold text-foreground">Quizzes</h1>
          <p className="text-sm text-muted-foreground">Practice with topic-specific and subject-wide quizzes</p>
        </motion.div>

        <div className="mb-4">
          <SearchBox 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            onClearSearch={handleClearSearch}
          />
        </div>

        <Tabs defaultValue="topics" className="mb-4" onValueChange={value => setActiveTab(value)}>
          <TabsList className="grid w-full max-w-xs grid-cols-2 mb-4 h-9">
            <TabsTrigger value="topics" className="text-xs">Topic Quizzes</TabsTrigger>
            <TabsTrigger value="subjects" className="text-xs">Subject Quizzes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="topics">
            <TopicQuizzesTab 
              quizzes={allQuizzes}
              isLoaded={isLoaded}
              searchQuery={searchQuery}
            />
          </TabsContent>
          
          <TabsContent value="subjects">
            <SubjectQuizzesTab 
              quizzes={subjectQuizzes}
              isLoaded={isLoaded}
              searchQuery={searchQuery}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Header>
  );
};

export default Quizzes;
