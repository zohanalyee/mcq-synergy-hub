import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Target, Trash2, Clock, Sparkles } from "lucide-react";
import { ContentItem } from "@/interfaces/content";
import QuestionAssignmentDialog from "./QuestionAssignmentDialog";
import { formatDistanceToNow } from "date-fns";

interface QuestionBankTableProps {
  questions: ContentItem[];
  onRefresh?: () => void;
  onDelete?: (id: string) => void;
}

const QuestionBankTable = ({ questions, onRefresh, onDelete }: QuestionBankTableProps) => {
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "Hard": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      const distance = formatDistanceToNow(date, { addSuffix: true });
      // Check if it's very recent (within last 5 minutes)
      const diffMs = Date.now() - date.getTime();
      const isJustNow = diffMs < 5 * 60 * 1000; // 5 minutes
      return { text: isJustNow ? "Just now" : distance, isRecent: diffMs < 60 * 60 * 1000 }; // 1 hour
    } catch {
      return null;
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[300px]">Question</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Subject / Topic</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No questions found
              </TableCell>
            </TableRow>
          ) : (
            questions.map((question) => {
              const timeInfo = getRelativeTime(question.createdAt);
              return (
                <TableRow key={question.id}>
                  <TableCell className="max-w-md">
                    <div className="space-y-1">
                      <div className="font-medium line-clamp-2">{question.title}</div>
                      {question.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {question.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {question.category?.toUpperCase() || "MCQ"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {question.subject && (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit text-xs">
                          <BookOpen className="w-3 h-3" />
                          {question.subject}
                        </Badge>
                      )}
                      {question.topic && (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit text-xs">
                          <Target className="w-3 h-3" />
                          {question.topic}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {question.difficulty && (
                      <Badge className={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {timeInfo && (
                      <div className="flex items-center gap-1.5">
                        {timeInfo.isRecent ? (
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        <span className={`text-sm ${timeInfo.isRecent ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}`}>
                          {timeInfo.text}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
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
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default QuestionBankTable;
