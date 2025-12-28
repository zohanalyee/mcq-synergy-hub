import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  RefreshCw, 
  ArrowRight,
  Loader2,
  FileQuestion,
  Eye,
  Scale
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FlaggedQuestion {
  id: string;
  title: string;
  options: unknown[] | null;
  correct_option: string | null;
  explanation: string | null;
  topic: string | null;
  subject: string | null;
  difficulty: string | null;
  created_at: string;
  reference_material: string | null;
  duplicate_of_id?: string;
  duplicate_of_title?: string;
}

interface OriginalQuestion {
  id: string;
  title: string;
  options: unknown[] | null;
  correct_option: string | null;
  explanation: string | null;
  status: string;
}

const DuplicateReviewQueue = () => {
  const [flaggedQuestions, setFlaggedQuestions] = useState<FlaggedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<FlaggedQuestion | null>(null);
  const [originalQuestion, setOriginalQuestion] = useState<OriginalQuestion | null>(null);
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadFlaggedQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_items')
        .select('id, title, options, correct_option, explanation, topic, subject, difficulty, created_at, reference_material')
        .eq('category', 'mcq')
        .eq('status', 'flagged_duplicate')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Parse reference_material to extract duplicate info
      const parsed = (data || []).map(q => {
        let dupInfo = { duplicate_of_id: undefined, duplicate_of_title: undefined };
        if (q.reference_material) {
          try {
            const ref = JSON.parse(q.reference_material);
            dupInfo = {
              duplicate_of_id: ref.duplicate_of_id,
              duplicate_of_title: ref.duplicate_of_title
            };
          } catch {}
        }
        return {
          ...q,
          options: Array.isArray(q.options) ? q.options : null,
          ...dupInfo
        };
      });
      
      setFlaggedQuestions(parsed);
    } catch (err) {
      console.error('Error loading flagged questions:', err);
      toast.error('Failed to load flagged questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlaggedQuestions();
  }, []);

  const loadOriginalQuestion = async (question: FlaggedQuestion) => {
    setSelectedQuestion(question);
    setOriginalQuestion(null);
    setLoadingOriginal(true);

    try {
      // First try to find by stored duplicate_of_id
      if (question.duplicate_of_id) {
        const { data } = await supabase
          .from('content_items')
          .select('id, title, options, correct_option, explanation, status')
          .eq('id', question.duplicate_of_id)
          .maybeSingle();
        
        if (data) {
          setOriginalQuestion({
            ...data,
            options: Array.isArray(data.options) ? data.options : null
          });
          setLoadingOriginal(false);
          return;
        }
      }

      // Fallback: search by similar title
      const { data: similarData } = await supabase
        .from('content_items')
        .select('id, title, options, correct_option, explanation, status')
        .eq('category', 'mcq')
        .neq('status', 'flagged_duplicate')
        .neq('id', question.id)
        .ilike('title', `${question.title.slice(0, 50)}%`)
        .limit(1)
        .maybeSingle();

      if (similarData) {
        setOriginalQuestion({
          ...similarData,
          options: Array.isArray(similarData.options) ? similarData.options : null
        });
      }
    } catch (err) {
      console.error('Error loading original:', err);
    } finally {
      setLoadingOriginal(false);
    }
  };

  const handleKeepNew = async (question: FlaggedQuestion) => {
    setActionLoading(question.id);
    try {
      const { error } = await supabase
        .from('content_items')
        .update({ 
          status: 'approved',
          show_in_subjects: true,
          show_in_mock_tests: true
        })
        .eq('id', question.id);

      if (error) throw error;
      
      toast.success('Question approved!');
      setFlaggedQuestions(prev => prev.filter(q => q.id !== question.id));
      if (selectedQuestion?.id === question.id) {
        setSelectedQuestion(null);
        setOriginalQuestion(null);
      }
    } catch (err) {
      console.error('Error approving question:', err);
      toast.error('Failed to approve question');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDiscardNew = async (question: FlaggedQuestion) => {
    setActionLoading(question.id);
    try {
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('id', question.id);

      if (error) throw error;
      
      toast.success('Question discarded');
      setFlaggedQuestions(prev => prev.filter(q => q.id !== question.id));
      if (selectedQuestion?.id === question.id) {
        setSelectedQuestion(null);
        setOriginalQuestion(null);
      }
    } catch (err) {
      console.error('Error deleting question:', err);
      toast.error('Failed to delete question');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReplaceOriginal = async (question: FlaggedQuestion) => {
    if (!originalQuestion) {
      toast.error('No original question to replace');
      return;
    }

    setActionLoading(question.id);
    try {
      // Delete the original
      const { error: deleteError } = await supabase
        .from('content_items')
        .delete()
        .eq('id', originalQuestion.id);

      if (deleteError) throw deleteError;

      // Approve the new one
      const { error: updateError } = await supabase
        .from('content_items')
        .update({ 
          status: 'approved',
          show_in_subjects: true,
          show_in_mock_tests: true
        })
        .eq('id', question.id);

      if (updateError) throw updateError;
      
      toast.success('Original replaced with new question');
      setFlaggedQuestions(prev => prev.filter(q => q.id !== question.id));
      setSelectedQuestion(null);
      setOriginalQuestion(null);
    } catch (err) {
      console.error('Error replacing question:', err);
      toast.error('Failed to replace question');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkApprove = async () => {
    if (flaggedQuestions.length === 0) return;
    
    setActionLoading('bulk');
    try {
      const { error } = await supabase
        .from('content_items')
        .update({ 
          status: 'approved',
          show_in_subjects: true,
          show_in_mock_tests: true
        })
        .eq('status', 'flagged_duplicate');

      if (error) throw error;
      
      toast.success(`Approved all ${flaggedQuestions.length} flagged questions`);
      setFlaggedQuestions([]);
      setSelectedQuestion(null);
      setOriginalQuestion(null);
    } catch (err) {
      console.error('Error bulk approving:', err);
      toast.error('Failed to bulk approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDiscard = async () => {
    if (flaggedQuestions.length === 0) return;
    
    setActionLoading('bulk');
    try {
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('status', 'flagged_duplicate');

      if (error) throw error;
      
      toast.success(`Discarded all ${flaggedQuestions.length} flagged questions`);
      setFlaggedQuestions([]);
      setSelectedQuestion(null);
      setOriginalQuestion(null);
    } catch (err) {
      console.error('Error bulk discarding:', err);
      toast.error('Failed to bulk discard');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left: Flagged Questions List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Review Queue
                <Badge variant="secondary">{flaggedQuestions.length}</Badge>
              </CardTitle>
              <CardDescription>
                Flagged duplicates awaiting review
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={loadFlaggedQuestions}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {flaggedQuestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="font-medium">All clear!</p>
              <p className="text-sm">No flagged duplicates to review</p>
            </div>
          ) : (
            <>
              {/* Bulk Actions */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={actionLoading === 'bulk'}
                  className="flex-1"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approve All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDiscard}
                  disabled={actionLoading === 'bulk'}
                  className="flex-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Discard All
                </Button>
              </div>
              
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {flaggedQuestions.map((q) => (
                      <motion.div
                        key={q.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedQuestion?.id === q.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                        onClick={() => loadOriginalQuestion(q)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2">
                              {q.title}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {q.subject && (
                                <Badge variant="outline" className="text-xs">
                                  {q.subject}
                                </Badge>
                              )}
                              {q.difficulty && (
                                <Badge variant="secondary" className="text-xs">
                                  {q.difficulty}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleKeepNew(q);
                              }}
                              disabled={actionLoading === q.id}
                            >
                              {actionLoading === q.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDiscardNew(q);
                              }}
                              disabled={actionLoading === q.id}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>

      {/* Right: Comparison Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-primary" />
            Comparison View
          </CardTitle>
          <CardDescription>
            Compare flagged question with potential original
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedQuestion ? (
            <div className="text-center py-12 text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Select a question to compare</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* New Question */}
              <div className="p-3 rounded-lg border-2 border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-yellow-500">New (Flagged)</Badge>
                </div>
                <p className="text-sm font-medium mb-2">{selectedQuestion.title}</p>
                {selectedQuestion.options && (
                  <div className="space-y-1 text-xs">
                    {selectedQuestion.options.map((opt, i) => (
                      <div 
                        key={i}
                        className={`p-1.5 rounded ${
                          opt === selectedQuestion.correct_option 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                            : 'bg-muted'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}) {String(opt)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Original Question */}
              {loadingOriginal ? (
                <div className="p-3 rounded-lg border bg-muted/50 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : originalQuestion ? (
                <div className="p-3 rounded-lg border-2 border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-500">Original</Badge>
                    <Badge variant="outline" className="text-xs">{originalQuestion.status}</Badge>
                  </div>
                  <p className="text-sm font-medium mb-2">{originalQuestion.title}</p>
                  {originalQuestion.options && (
                    <div className="space-y-1 text-xs">
                      {originalQuestion.options.map((opt, i) => (
                        <div 
                          key={i}
                          className={`p-1.5 rounded ${
                            opt === originalQuestion.correct_option 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                              : 'bg-muted'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}) {String(opt)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-lg border bg-muted/50 text-center">
                  <FileQuestion className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No matching original found</p>
                  <p className="text-xs text-muted-foreground">May have been detected as similar but not exact</p>
                </div>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleKeepNew(selectedQuestion)}
                  disabled={!!actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {actionLoading === selectedQuestion.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Keep New
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDiscardNew(selectedQuestion)}
                  disabled={!!actionLoading}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Discard
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleReplaceOriginal(selectedQuestion)}
                  disabled={!!actionLoading || !originalQuestion}
                  title={!originalQuestion ? "No original to replace" : "Replace original with new"}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Replace
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DuplicateReviewQueue;
