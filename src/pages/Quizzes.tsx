
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { FileUp, Search, Clock, CheckSquare, Award, Upload } from 'lucide-react';
import Header from '@/components/Header';
import useTheme from '@/components/ThemeSwitcher';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ContentItem, MCQItem } from "@/interfaces/content";
import { getContentByCategory, getSubjectsAndTopics } from "@/services/contentService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

const Quizzes = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [quizContent, setQuizContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchQuizzes = () => {
      try {
        const items = getContentByCategory('quiz');
        console.log("Fetched quizzes:", items);
        setQuizContent(items);
        
        const { subjects, topicsBySubject } = getSubjectsAndTopics();
        setSubjects(subjects);
        
        if (subjects.length > 0 && subjectFilter !== "all") {
          setTopics(topicsBySubject[subjectFilter] || []);
        }
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load quizzes. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQuizzes();
  }, []);

  // Update topics when subject changes
  useEffect(() => {
    if (subjectFilter !== "all") {
      const { topicsBySubject } = getSubjectsAndTopics();
      setTopics(topicsBySubject[subjectFilter] || []);
      setTopicFilter("all"); // Reset topic when subject changes
    }
  }, [subjectFilter]);

  // Filter quizzes
  const filteredQuizzes = quizContent.filter(quiz => {
    const matchesQuery = 
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quiz.subject && quiz.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (quiz.topic && quiz.topic.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSubject = subjectFilter === "all" || quiz.subject === subjectFilter;
    const matchesTopic = topicFilter === "all" || quiz.topic === topicFilter;
    
    return matchesQuery && matchesSubject && matchesTopic;
  });

  // Start quiz
  const handleStartQuiz = (quizId: string) => {
    // This would navigate to a quiz session page in a real application
    toast({
      title: "Quiz Started",
      description: "Quiz functionality is under development.",
    });
    // Example navigation: navigate(`/quiz-session/${quizId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header theme={theme} setTheme={setTheme} />
      
      <div className="container px-4 mx-auto pt-28 pb-16">
        <PageBreadcrumb 
          items={[
            { title: 'Home', href: '/' },
            { title: 'Quizzes', href: '/quizzes', isCurrent: true },
          ]} 
        />
        
        <div className="mt-6 mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold"
          >
            <FileUp className="inline-block h-8 w-8 mr-2 text-primary" />
            Quizzes
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground mt-2"
          >
            Test your knowledge with timed quizzes on various subjects
          </motion.p>
          
          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quizzes by title, subject, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full md:w-auto">
              {subjects.length > 0 && (
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {topics.length > 0 && subjectFilter !== "all" && (
                <Select value={topicFilter} onValueChange={setTopicFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {topics.map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {user && (
              <Button onClick={() => navigate("/submit-content")} className="flex gap-2">
                <Upload className="h-4 w-4" />
                Submit Quiz
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded-md w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded-md w-1/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded-md w-full mb-4"></div>
                  <div className="h-4 bg-muted rounded-md w-1/2"></div>
                </CardContent>
                <CardFooter>
                  <div className="h-10 bg-muted rounded-md w-full"></div>
                </CardFooter>
              </Card>
            ))
          ) : filteredQuizzes.length > 0 ? (
            filteredQuizzes.map((quiz) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {quiz.subject && (
                        <Badge variant="outline">
                          {quiz.subject}
                        </Badge>
                      )}
                      {quiz.topic && (
                        <Badge variant="outline">
                          {quiz.topic}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{quiz.title}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{quiz.timeLimit || 30} sec per question</span>
                      <span className="px-1">•</span>
                      <CheckSquare className="h-4 w-4 mr-1" />
                      <span>{quiz.questions?.length || 0} questions</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-muted-foreground mb-4">
                      {quiz.description || `Test your knowledge on ${quiz.subject} topics.`}
                    </p>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Difficulty</span>
                        <span className="font-medium">Medium</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleStartQuiz(quiz.id)}
                    >
                      Start Quiz
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20">
              <FileUp className="h-16 w-16 mx-auto text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-medium">No quizzes found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchQuery || subjectFilter !== "all" || topicFilter !== "all"
                  ? "Try adjusting your filters"
                  : user ? "Be the first to submit a quiz" : "Sign in to submit quizzes"
                }
              </p>
              {user && (
                <Button onClick={() => navigate('/submit-content')} className="mt-4">
                  Submit Quiz
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quizzes;
