import { useState } from "react";
import { cleanQuestionText } from "@/lib/questionUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Star, 
  Download, 
  Play, 
  Eye, 
  MoreHorizontal,
  Clock,
  TrendingUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuestionBankItem, toggleQuestionFeatured } from "@/services/questionBankService";
import { exportQuestions, ExportOptions } from "@/services/exportService";
import { toast } from "sonner";

interface QuestionBankTableProps {
  questions: QuestionBankItem[];
  loading: boolean;
  onQuestionSelect: (question: QuestionBankItem) => void;
  onBulkExport: (selectedQuestions: QuestionBankItem[]) => void;
  onGenerateTest: (selectedQuestions: QuestionBankItem[]) => void;
}

export const QuestionBankTable = ({ 
  questions, 
  loading, 
  onQuestionSelect,
  onBulkExport,
  onGenerateTest
}: QuestionBankTableProps) => {
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const handleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map(q => q.id));
    }
  };

  const handleSelectQuestion = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const toggleRowExpansion = (questionId: string) => {
    setExpandedRows(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleToggleFeatured = async (questionId: string, currentFeatured: boolean) => {
    const success = await toggleQuestionFeatured(questionId, !currentFeatured);
    if (success) {
      toast.success(`Question ${!currentFeatured ? 'marked as featured' : 'unfeatured'}`);
      // Refresh the data
      window.location.reload();
    } else {
      toast.error("Failed to update question");
    }
  };

  const handleBulkAction = (action: 'export' | 'test') => {
    const selected = questions.filter(q => selectedQuestions.includes(q.id));
    if (selected.length === 0) {
      toast.error("Please select at least one question");
      return;
    }

    if (action === 'export') {
      onBulkExport(selected);
    } else {
      onGenerateTest(selected);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <BrandingLoader message="Loading questions..." size="sm" inline />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Question Bank ({questions.length} questions)</CardTitle>
          {selectedQuestions.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('export')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export ({selectedQuestions.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('test')}
              >
                <Play className="h-4 w-4 mr-2" />
                Generate Test ({selectedQuestions.length})
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No questions found. Try adjusting your filters.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedQuestions.length === questions.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question) => (
                  <>
                    <TableRow key={question.id} className="cursor-pointer">
                      <TableCell>
                        <Checkbox
                          checked={selectedQuestions.includes(question.id)}
                          onCheckedChange={() => handleSelectQuestion(question.id)}
                        />
                      </TableCell>
                      <TableCell 
                        className="font-medium max-w-md"
                        onClick={() => toggleRowExpansion(question.id)}
                      >
                        <div className="flex items-center gap-2">
                          {question.is_featured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                          <span className="truncate">{cleanQuestionText(question.question)}</span>
                          <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </TableCell>
                      <TableCell>{question.subject}</TableCell>
                      <TableCell>{question.topic}</TableCell>
                      <TableCell>
                        <Badge className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          {question.usage_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {question.is_featured && (
                            <Badge variant="secondary">Featured</Badge>
                          )}
                          {question.last_used_at && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Recent
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onQuestionSelect(question)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleFeatured(question.id, question.is_featured)}
                            >
                              <Star className="h-4 w-4 mr-2" />
                              {question.is_featured ? 'Remove from Featured' : 'Mark as Featured'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onBulkExport([question])}>
                              <Download className="h-4 w-4 mr-2" />
                              Export Question
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onGenerateTest([question])}>
                              <Play className="h-4 w-4 mr-2" />
                              Create Test
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Row */}
                    {expandedRows.includes(question.id) && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/50">
                          <div className="p-4 space-y-3">
                            <div>
                              <h4 className="font-medium mb-2">Options:</h4>
                              <div className="grid grid-cols-2 gap-2">
                                <div className={`p-2 rounded ${
                                  question.correctOption === 'A' ? 'bg-green-100 border border-green-300' : 'bg-gray-50'
                                }`}>
                                  <strong>A)</strong> {question.options.A}
                                </div>
                                <div className={`p-2 rounded ${
                                  question.correctOption === 'B' ? 'bg-green-100 border border-green-300' : 'bg-gray-50'
                                }`}>
                                  <strong>B)</strong> {question.options.B}
                                </div>
                                <div className={`p-2 rounded ${
                                  question.correctOption === 'C' ? 'bg-green-100 border border-green-300' : 'bg-gray-50'
                                }`}>
                                  <strong>C)</strong> {question.options.C}
                                </div>
                                <div className={`p-2 rounded ${
                                  question.correctOption === 'D' ? 'bg-green-100 border border-green-300' : 'bg-gray-50'
                                }`}>
                                  <strong>D)</strong> {question.options.D}
                                </div>
                              </div>
                            </div>
                            
                            {question.explanation && (
                              <div>
                                <h4 className="font-medium mb-2">Explanation:</h4>
                                <p className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
                                  {question.explanation}
                                </p>
                              </div>
                            )}
                            
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span>Subtopic: {question.subtopic || 'N/A'}</span>
                              <span>Type: {question.question_type}</span>
                              <span>Created: {new Date(question.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};