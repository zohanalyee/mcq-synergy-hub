
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { List, Search, Check, X, Upload } from 'lucide-react';
import Header from '@/components/Header';
import useTheme from '@/components/ThemeSwitcher';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ContentItem, MCQItem } from "@/interfaces/content";
import { getContentByCategory, getSubjectsAndTopics } from "@/services/contentService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/contexts/UserRoleContext';

const MCQs = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [mcqContent, setMCQContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedMCQ, setSelectedMCQ] = useState<{mcq: MCQItem, answered: boolean, isCorrect: boolean | null}>({
    mcq: {
      question: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOption: "A",
      subject: "",
      topic: "",
      difficulty: "Easy",
      explanation: ""
    },
    answered: false,
    isCorrect: null
  });
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchMCQs = () => {
      try {
        const items = getContentByCategory('mcq');
        console.log("Fetched MCQs:", items);
        setMCQContent(items);
        
        const { subjects, topicsBySubject } = getSubjectsAndTopics();
        setSubjects(subjects);
        
        if (subjects.length > 0 && subjectFilter !== "all") {
          setTopics(topicsBySubject[subjectFilter] || []);
        }
      } catch (error) {
        console.error("Error fetching MCQs:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load MCQs. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMCQs();
  }, []);

  // Update topics when subject changes
  useEffect(() => {
    if (subjectFilter !== "all") {
      const { topicsBySubject } = getSubjectsAndTopics();
      setTopics(topicsBySubject[subjectFilter] || []);
      setTopicFilter("all"); // Reset topic when subject changes
    }
  }, [subjectFilter]);

  // Get all MCQs from all content items
  const allMCQs: MCQItem[] = mcqContent.reduce((acc: MCQItem[], item) => {
    if (item.questions && item.questions.length > 0) {
      return [...acc, ...item.questions];
    }
    return acc;
  }, []);

  // Filter MCQs
  const filteredMCQs = allMCQs.filter(mcq => {
    const matchesQuery = 
      mcq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mcq.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mcq.topic.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = subjectFilter === "all" || mcq.subject === subjectFilter;
    const matchesTopic = topicFilter === "all" || mcq.topic === topicFilter;
    const matchesDifficulty = difficultyFilter === "all" || mcq.difficulty === difficultyFilter;
    
    return matchesQuery && matchesSubject && matchesTopic && matchesDifficulty;
  });

  const handleSelectMCQ = (mcq: MCQItem) => {
    setSelectedMCQ({
      mcq,
      answered: false,
      isCorrect: null
    });
    setUserAnswer(null);
  };

  const handleAnswerSubmit = (selectedOption: string) => {
    setUserAnswer(selectedOption);
    setSelectedMCQ(prev => ({
      ...prev,
      answered: true,
      isCorrect: selectedOption === prev.mcq.correctOption
    }));
  };

  const handleNextMCQ = () => {
    const currentIndex = filteredMCQs.findIndex(mcq => mcq.question === selectedMCQ.mcq.question);
    if (currentIndex < filteredMCQs.length - 1) {
      handleSelectMCQ(filteredMCQs[currentIndex + 1]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header theme={theme} setTheme={setTheme} />
      
      <div className="container px-4 mx-auto pt-28 pb-16">
        <PageBreadcrumb 
          items={[
            { title: 'Home', href: '/' },
            { title: 'MCQs', href: '/mcqs', isCurrent: true },
          ]} 
        />
        
        <div className="mt-6 mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold"
          >
            <List className="inline-block h-8 w-8 mr-2 text-primary" />
            Multiple Choice Questions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground mt-2"
          >
            Practice with MCQs from various subjects to test your knowledge
          </motion.p>
          
          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search MCQs by question, subject, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
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
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {user && (
              <Button onClick={() => navigate("/submit-content")} className="flex gap-2">
                <Upload className="h-4 w-4" />
                Submit MCQs
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* MCQs List */}
          <div className="md:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">MCQs ({filteredMCQs.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="animate-pulse p-4 border-b">
                      <div className="h-4 bg-muted rounded-md w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded-md w-1/4 mb-1"></div>
                      <div className="h-3 bg-muted rounded-md w-1/3"></div>
                    </div>
                  ))
                ) : filteredMCQs.length > 0 ? (
                  <div className="max-h-[60vh] overflow-y-auto">
                    {filteredMCQs.map((mcq, index) => (
                      <div 
                        key={index}
                        className={`p-4 border-b cursor-pointer hover:bg-accent/30 transition-colors ${selectedMCQ.mcq.question === mcq.question ? 'bg-accent/20' : ''}`}
                        onClick={() => handleSelectMCQ(mcq)}
                      >
                        <p className="font-medium line-clamp-2">{mcq.question}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {mcq.subject}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {mcq.topic}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              mcq.difficulty === 'Easy' ? 'text-green-500' : 
                              mcq.difficulty === 'Medium' ? 'text-amber-500' : 
                              'text-red-500'
                            }`}
                          >
                            {mcq.difficulty}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <List className="h-16 w-16 mx-auto text-muted-foreground/40" />
                    <h3 className="mt-4 text-lg font-medium">No MCQs found</h3>
                    <p className="mt-2 text-muted-foreground">
                      {searchQuery || subjectFilter !== "all" || topicFilter !== "all" || difficultyFilter !== "all"
                        ? "Try adjusting your filters"
                        : user ? "Be the first to submit MCQs" : "Sign in to submit MCQs"
                      }
                    </p>
                    {user && (
                      <Button onClick={() => navigate('/submit-content')} className="mt-4">
                        Submit MCQs
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Selected MCQ */}
          <div className="md:col-span-2">
            <Card className="h-full flex flex-col">
              {selectedMCQ.mcq.question ? (
                <>
                  <CardHeader>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedMCQ.mcq.subject}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {selectedMCQ.mcq.topic}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          selectedMCQ.mcq.difficulty === 'Easy' ? 'text-green-500' : 
                          selectedMCQ.mcq.difficulty === 'Medium' ? 'text-amber-500' : 
                          'text-red-500'
                        }`}
                      >
                        {selectedMCQ.mcq.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{selectedMCQ.mcq.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <RadioGroup 
                      value={userAnswer || ""}
                      onValueChange={!selectedMCQ.answered ? handleAnswerSubmit : undefined}
                      className="space-y-4"
                    >
                      <div className={`flex items-start space-x-3 p-3 rounded-md border ${
                        selectedMCQ.answered && 'A' === selectedMCQ.mcq.correctOption 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                          : selectedMCQ.answered && userAnswer === 'A' 
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                            : ''
                      }`}>
                        <RadioGroupItem value="A" id="option-a" disabled={selectedMCQ.answered} />
                        <Label 
                          htmlFor="option-a" 
                          className={`cursor-pointer flex-1 ${
                            selectedMCQ.answered && 'A' === selectedMCQ.mcq.correctOption 
                              ? 'text-green-600 dark:text-green-400' 
                              : ''
                          }`}
                        >
                          <span className="font-semibold mr-2">A.</span>
                          {selectedMCQ.mcq.optionA}
                          {selectedMCQ.answered && 'A' === selectedMCQ.mcq.correctOption && (
                            <Check className="inline-block ml-2 h-4 w-4 text-green-600" />
                          )}
                        </Label>
                      </div>
                      <div className={`flex items-start space-x-3 p-3 rounded-md border ${
                        selectedMCQ.answered && 'B' === selectedMCQ.mcq.correctOption 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                          : selectedMCQ.answered && userAnswer === 'B' 
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                            : ''
                      }`}>
                        <RadioGroupItem value="B" id="option-b" disabled={selectedMCQ.answered} />
                        <Label 
                          htmlFor="option-b" 
                          className={`cursor-pointer flex-1 ${
                            selectedMCQ.answered && 'B' === selectedMCQ.mcq.correctOption 
                              ? 'text-green-600 dark:text-green-400' 
                              : ''
                          }`}
                        >
                          <span className="font-semibold mr-2">B.</span>
                          {selectedMCQ.mcq.optionB}
                          {selectedMCQ.answered && 'B' === selectedMCQ.mcq.correctOption && (
                            <Check className="inline-block ml-2 h-4 w-4 text-green-600" />
                          )}
                        </Label>
                      </div>
                      <div className={`flex items-start space-x-3 p-3 rounded-md border ${
                        selectedMCQ.answered && 'C' === selectedMCQ.mcq.correctOption 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                          : selectedMCQ.answered && userAnswer === 'C' 
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                            : ''
                      }`}>
                        <RadioGroupItem value="C" id="option-c" disabled={selectedMCQ.answered} />
                        <Label 
                          htmlFor="option-c" 
                          className={`cursor-pointer flex-1 ${
                            selectedMCQ.answered && 'C' === selectedMCQ.mcq.correctOption 
                              ? 'text-green-600 dark:text-green-400' 
                              : ''
                          }`}
                        >
                          <span className="font-semibold mr-2">C.</span>
                          {selectedMCQ.mcq.optionC}
                          {selectedMCQ.answered && 'C' === selectedMCQ.mcq.correctOption && (
                            <Check className="inline-block ml-2 h-4 w-4 text-green-600" />
                          )}
                        </Label>
                      </div>
                      <div className={`flex items-start space-x-3 p-3 rounded-md border ${
                        selectedMCQ.answered && 'D' === selectedMCQ.mcq.correctOption 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                          : selectedMCQ.answered && userAnswer === 'D' 
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                            : ''
                      }`}>
                        <RadioGroupItem value="D" id="option-d" disabled={selectedMCQ.answered} />
                        <Label 
                          htmlFor="option-d" 
                          className={`cursor-pointer flex-1 ${
                            selectedMCQ.answered && 'D' === selectedMCQ.mcq.correctOption 
                              ? 'text-green-600 dark:text-green-400' 
                              : ''
                          }`}
                        >
                          <span className="font-semibold mr-2">D.</span>
                          {selectedMCQ.mcq.optionD}
                          {selectedMCQ.answered && 'D' === selectedMCQ.mcq.correctOption && (
                            <Check className="inline-block ml-2 h-4 w-4 text-green-600" />
                          )}
                        </Label>
                      </div>
                    </RadioGroup>
                    
                    {selectedMCQ.answered && (
                      <div className="mt-6">
                        <Alert className={`${
                          selectedMCQ.isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-red-50 dark:bg-red-900/20 border-red-200'
                        }`}>
                          <div className={`flex items-center gap-2 font-medium mb-1 ${
                            selectedMCQ.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {selectedMCQ.isCorrect ? (
                              <>
                                <Check className="h-4 w-4" />
                                <span>Correct!</span>
                              </>
                            ) : (
                              <>
                                <X className="h-4 w-4" />
                                <span>Incorrect!</span>
                              </>
                            )}
                          </div>
                          <AlertDescription>
                            {selectedMCQ.mcq.explanation || `The correct answer is ${selectedMCQ.mcq.correctOption}.`}
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    {!selectedMCQ.answered ? (
                      <Button 
                        variant="default" 
                        onClick={() => handleAnswerSubmit(userAnswer || 'A')} 
                        disabled={!userAnswer}
                      >
                        Check Answer
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={handleNextMCQ}>
                        Next Question
                      </Button>
                    )}
                  </CardFooter>
                </>
              ) : (
                <div className="flex items-center justify-center h-full p-8">
                  <div className="text-center">
                    <List className="h-16 w-16 mx-auto text-muted-foreground/40" />
                    <h3 className="mt-4 text-lg font-medium">
                      Select an MCQ from the list to view details
                    </h3>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCQs;
