
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CSVUploader from "@/components/CSVUploader";
import { getSubjects } from "@/services/adminService";
import { getTopics } from "@/services/adminService";
import { MCQItem } from "@/interfaces/content";
import { Quiz, addQuiz, getQuizzes, removeQuiz } from "@/services/quizService";

const QuizManager = () => {
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [subjects, setSubjects] = useState<{ title: string }[]>([]);
  const [topics, setTopics] = useState<{ title: string }[]>([]);
  const [csvFile, setCsvFile] = useState<File | undefined>(undefined);
  const [questions, setQuestions] = useState<MCQItem[]>([]);

  // Load subjects and quizzes on component mount
  useEffect(() => {
    const loadedSubjects = getSubjects();
    setSubjects(loadedSubjects);
    
    // Load quizzes from localStorage
    const loadedQuizzes = getQuizzes();
    setQuizzes(loadedQuizzes);
  }, []);

  // Update topics when subject changes
  useEffect(() => {
    if (subject) {
      const topicsData = getTopics();
      const subjectTopics = topicsData[subject] || [];
      setTopics(subjectTopics);
      
      // Reset topic when subject changes
      setTopic("");
    }
  }, [subject]);

  const handleCSVChange = (file: File | undefined) => {
    setCsvFile(file);
    if (file) {
      // In a real app, you would parse the CSV here
      toast({
        title: "File uploaded",
        description: `${file.name} is ready to be processed.`,
      });
    }
  };

  const handleSaveQuiz = () => {
    if (!title || !subject) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide a title and select a subject.",
      });
      return;
    }

    const newQuiz = {
      title,
      description,
      subject,
      topic,
      questions: questions,
      timeLimit: timeLimit,
    };

    const savedQuiz = addQuiz(newQuiz);
    if (savedQuiz) {
      setQuizzes([...quizzes, savedQuiz]);

      // Reset form
      setTitle("");
      setDescription("");
      setSubject("");
      setTopic("");
      setTimeLimit(30);
      setQuestions([]);
      setCsvFile(undefined);

      toast({
        title: "Quiz saved",
        description: "The quiz has been saved successfully.",
      });
    }
  };

  const handleDeleteQuiz = (id: string) => {
    if (removeQuiz(id)) {
      setQuizzes(quizzes.filter(quiz => quiz.id !== id));
      
      toast({
        title: "Quiz deleted",
        description: "The quiz has been removed.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quiz Manager</h2>
        <Button onClick={handleSaveQuiz} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create Quiz
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title</Label>
              <Input 
                id="title"
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Enter quiz title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeLimit">Time Limit (seconds per question)</Label>
              <Input 
                id="timeLimit"
                type="number" 
                value={timeLimit} 
                onChange={(e) => setTimeLimit(parseInt(e.target.value) || 30)} 
                min={10}
                max={300}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description"
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Describe this quiz" 
              className="min-h-24"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((sub) => (
                    <SelectItem key={sub.title} value={sub.title}>
                      {sub.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Select value={topic} onValueChange={setTopic} disabled={!subject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((t) => (
                    <SelectItem key={t.title} value={t.title}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Upload Questions CSV</Label>
            <CSVUploader onFileChange={handleCSVChange} category="quiz" />
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Existing Quizzes</h3>
        {quizzes.length > 0 ? (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-medium">{quiz.title}</h4>
                    <p className="text-sm text-muted-foreground">{quiz.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-secondary px-2 py-1 rounded-md">{quiz.subject}</span>
                      {quiz.topic && (
                        <span className="text-xs bg-secondary px-2 py-1 rounded-md">{quiz.topic}</span>
                      )}
                      <span className="text-xs bg-secondary px-2 py-1 rounded-md">{quiz.timeLimit} sec/question</span>
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No quizzes created yet</p>
        )}
      </div>
    </div>
  );
};

export default QuizManager;
