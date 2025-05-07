
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import CSVUploader from "@/components/CSVUploader";
import { MCQItem } from "@/interfaces/content";

interface QuizFormProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  subject: string;
  setSubject: (value: string) => void;
  topic: string;
  setTopic: (value: string) => void;
  timeLimit: number;
  setTimeLimit: (value: number) => void;
  subjects: { title: string }[];
  topics: { title: string }[];
  csvFile?: File;
  setCsvFile: (file?: File) => void;
  questions: MCQItem[];
  onSaveQuiz: () => void;
}

const QuizForm = ({
  title,
  setTitle,
  description,
  setDescription,
  subject,
  setSubject,
  topic,
  setTopic,
  timeLimit,
  setTimeLimit,
  subjects,
  topics,
  csvFile,
  setCsvFile,
  questions,
  onSaveQuiz
}: QuizFormProps) => {
  const handleCSVChange = (file: File | undefined) => {
    setCsvFile(file);
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quiz Manager</h2>
        <Button onClick={onSaveQuiz} className="flex items-center gap-2">
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
    </>
  );
};

export default QuizForm;
