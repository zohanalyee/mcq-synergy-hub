
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trash2 as Trash2 } from "lucide-react";
import { Quiz } from "@/services/quizService";

interface QuizListProps {
  quizzes: Quiz[];
  onDeleteQuiz: (id: string) => void;
}

const QuizList = ({ quizzes, onDeleteQuiz }: QuizListProps) => {
  return (
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
                  onClick={() => onDeleteQuiz(quiz.id)}
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
  );
};

export default QuizList;
