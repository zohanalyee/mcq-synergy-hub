import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Target, Trash2 } from "lucide-react";
import { ContentItem } from "@/interfaces/content";
import QuestionAssignmentDialog from "./QuestionAssignmentDialog";

interface QuestionBankTableProps {
  questions: ContentItem[];
  onRefresh?: () => void;
  onDelete?: (id: string) => void;
}

const QuestionBankTable = ({ questions, onRefresh, onDelete }: QuestionBankTableProps) => {
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Question</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Topic</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No questions in Question Bank awaiting assignment
              </TableCell>
            </TableRow>
          ) : (
            questions.map((question) => (
              <TableRow key={question.id}>
                <TableCell className="max-w-md">
                  <div className="font-medium truncate">{question.title}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {question.description}
                  </div>
                </TableCell>
                <TableCell>
                  {question.subject && (
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <BookOpen className="w-3 h-3" />
                      {question.subject}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {question.topic && (
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <Target className="w-3 h-3" />
                      {question.topic}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {question.difficulty && (
                    <Badge className={getDifficultyColor(question.difficulty)}>
                      {question.difficulty}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    Awaiting Assignment
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <QuestionAssignmentDialog
                    questionId={question.id}
                    questionTitle={question.title}
                    currentSubject={question.subject}
                    currentTopic={question.topic}
                    onAssignmentComplete={onRefresh}
                  />
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default QuestionBankTable;
