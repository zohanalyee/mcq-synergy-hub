
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { SearchBox } from "@/components/mock-tests/SearchBox";
import { CategoryFilter } from "@/components/mock-tests/CategoryFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Target, Brain } from "lucide-react";
import { getQuestionBank, QuestionBankItem } from "@/services/questionBankService";
import { supabase } from "@/integrations/supabase/client";
import { ContentItem } from "@/interfaces/content";

const MCQs = () => {
  const [mcqs, setMCQs] = useState<QuestionBankItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [topics, setTopics] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Get questions from Question Bank
        const mcqsData = await getQuestionBank();
        
        // Get subjects and topics from database
        const [{ data: subjectsData }, { data: topicsData }] = await Promise.all([
          supabase.from('subjects').select('name'),
          supabase.from('topics').select('name, subjects(name)')
        ]);
        
        const subjectNames = subjectsData?.map(s => s.name) || [];
        const topicsMap: Record<string, string[]> = {};
        
        topicsData?.forEach(topic => {
          const subjectName = (topic.subjects as any)?.name;
          if (subjectName) {
            if (!topicsMap[subjectName]) topicsMap[subjectName] = [];
            topicsMap[subjectName].push(topic.name);
          }
        });
        
        setMCQs(mcqsData);
        setSubjects(subjectNames);
        setTopics(topicsMap);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const categories = ["all", ...subjects];

  const filteredMCQs = mcqs.filter(mcq => {
    const matchesSearch = !searchQuery || 
      mcq.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mcq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mcq.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mcq.topic.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = activeFilter === "all" || mcq.subject === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const getTopicsForSubject = (subject: string) => {
    return topics[subject] || [];
  };

  const renderMCQCard = (mcq: QuestionBankItem, index: number) => (
    <motion.div
      key={mcq.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-lg">{mcq.title}</CardTitle>
            {mcq.difficulty && (
              <Badge variant={
                mcq.difficulty === "Easy" ? "default" : 
                mcq.difficulty === "Medium" ? "secondary" : "destructive"
              }>
                {mcq.difficulty}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {mcq.subject && (
              <Badge variant="outline" className="text-xs">
                <BookOpen className="w-3 h-3 mr-1" />
                {mcq.subject}
              </Badge>
            )}
            {mcq.topic && (
              <Badge variant="outline" className="text-xs">
                <Target className="w-3 h-3 mr-1" />
                {mcq.topic}
              </Badge>
            )}
            {mcq.subtopic && (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {mcq.subtopic}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {mcq.question}
          </p>
          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-muted-foreground">
              <Brain className="w-4 h-4 mr-1" />
              Usage: {mcq.usage_count}
            </div>
            <Button size="sm">
              Practice Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Header />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-3xl font-bold flex items-center mb-4">
            <Brain className="mr-3 h-8 w-8 text-primary" />
            MCQ Practice
          </h1>
          <p className="text-muted-foreground">
            Practice with multiple choice questions across various subjects
          </p>
        </motion.div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBox
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                placeholder="Search MCQs..."
              />
            </div>
          </div>

          <CategoryFilter
            categories={categories}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                      <div className="h-8 bg-muted rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMCQs.map((mcq, index) => renderMCQCard(mcq, index))}
            </div>
          )}

          {!isLoading && filteredMCQs.length === 0 && (
            <div className="text-center py-16">
              <Brain className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium mb-2">No MCQs found</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "No MCQs match your search criteria. Try adjusting your search."
                  : "No MCQs available at the moment."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MCQs;
