
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Quiz } from "@/services/quizService";
import { getQuizzes, getQuizzesBySubject, getQuizzesByTopic } from "@/services/adminService";
import { getSubjects } from "@/services/adminService";
import { getTopics } from "@/services/adminService";
import { Search } from "lucide-react";
import PageBreadcrumb from "@/components/PageBreadcrumb";

const Quizzes = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<{ title: string }[]>([]);
  const [topics, setTopics] = useState<{ title: string }[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    // Load all quizzes
    const loadedQuizzes = getQuizzes();
    setQuizzes(loadedQuizzes);
    setFilteredQuizzes(loadedQuizzes);
    
    // Load subjects
    const loadedSubjects = getSubjects();
    setSubjects(loadedSubjects);
  }, []);

  useEffect(() => {
    // When subject changes, load topics for that subject
    if (selectedSubject) {
      const topicsData = getTopics();
      const subjectTopics = topicsData[selectedSubject] || [];
      setTopics(subjectTopics);
      setSelectedTopic("");
    } else {
      setTopics([]);
    }
  }, [selectedSubject]);

  useEffect(() => {
    // Apply filters whenever they change
    let filtered = quizzes;
    
    // Filter by subject
    if (selectedSubject) {
      filtered = getQuizzesBySubject(selectedSubject);
      
      // Further filter by topic if selected
      if (selectedTopic) {
        filtered = getQuizzesByTopic(selectedSubject, selectedTopic);
      }
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(quiz => 
        quiz.title.toLowerCase().includes(query) || 
        quiz.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredQuizzes(filtered);
  }, [selectedSubject, selectedTopic, searchQuery, quizzes]);

  const handleStartQuiz = (quiz: Quiz) => {
    // In a real app, this would navigate to the quiz page
    alert(`Starting quiz: ${quiz.title}`);
  };

  return (
    <div className="container mx-auto py-8">
      <PageBreadcrumb 
        items={[
          { title: "Home", href: "/" },
          { title: "Quizzes" }
        ]} 
      />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Quizzes</h1>
        <p className="text-muted-foreground">
          Explore our collection of quizzes to test your knowledge on various subjects
        </p>
      </div>
      
      <div className="bg-muted/40 p-4 rounded-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Search Quizzes</Label>
            <div className="flex items-center mt-2">
              <Search className="h-4 w-4 mr-2 text-muted-foreground" />
              <Input 
                id="search"
                placeholder="Search by title or description" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="subject">Filter by Subject</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.title} value={subject.title}>
                    {subject.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="topic">Filter by Topic</Label>
            <Select 
              value={selectedTopic} 
              onValueChange={setSelectedTopic}
              disabled={!selectedSubject}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="All Topics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Topics</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic.title} value={topic.title}>
                    {topic.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {filteredQuizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} className="overflow-hidden">
              <CardHeader className="bg-primary/10">
                <CardTitle className="text-xl">{quiz.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {quiz.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Subject:</span>
                    <span className="text-sm font-medium">{quiz.subject}</span>
                  </div>
                  {quiz.topic && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Topic:</span>
                      <span className="text-sm font-medium">{quiz.topic}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Questions:</span>
                    <span className="text-sm font-medium">{quiz.questions?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Time per question:</span>
                    <span className="text-sm font-medium">{quiz.timeLimit} seconds</span>
                  </div>
                </div>
                <Button 
                  className="w-full mt-2" 
                  onClick={() => handleStartQuiz(quiz)}
                  disabled={!quiz.questions || quiz.questions.length === 0}
                >
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No quizzes found</h3>
          <p className="text-muted-foreground">
            {selectedSubject || searchQuery ? 
              "Try changing your filters or search query" : 
              "There are no quizzes available at the moment"}
          </p>
        </div>
      )}
    </div>
  );
};

export default Quizzes;
