
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { SearchBox } from "@/components/quizzes/SearchBox";
import { SubjectQuizzesTab } from "@/components/quizzes/SubjectQuizzesTab";
import { TopicQuizzesTab } from "@/components/quizzes/TopicQuizzesTab";
import { getQuizzes, getQuizzesBySubject as getSubjectQuizzes } from "@/services/quizService";

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
    const bySubject = getSubjectQuizzes("");
    setSubjectQuizzes(bySubject);
    
    setIsLoaded(true);
  }, []);
  
  const breadcrumbItems = [{
    title: "Home",
    href: "/"
  }, {
    title: "Quizzes",
    href: "/quizzes",
    isCurrent: true
  }];

  const handleClearSearch = () => {
    setSearchQuery("");
  };
  
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 pt-28 pb-16">
        <PageBreadcrumb items={breadcrumbItems} />
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold">Quizzes</h1>
          <p className="text-muted-foreground">Practice with our collection of topic-specific and subject-wide quizzes</p>
        </motion.div>

        <div className="mb-6">
          <SearchBox 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            onClearSearch={handleClearSearch}
          />
        </div>

        <Tabs defaultValue="topics" className="mb-8" onValueChange={value => setActiveTab(value)}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="topics">Topic Quizzes</TabsTrigger>
            <TabsTrigger value="subjects">Subject Quizzes</TabsTrigger>
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
    </>
  );
};

export default Quizzes;
