import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { AlertCircle, Database, Trash2, RefreshCw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function DataMigrationUtility() {
  const [oldQuestions, setOldQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const fetchOldQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('category', 'mcq')
        .eq('status', 'approved');

      if (error) throw error;
      setOldQuestions(data || []);
    } catch (error) {
      console.error('Error fetching old questions:', error);
      toast.error('Failed to fetch old questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOldQuestions();
  }, []);

  const migrateToQuestionBank = async () => {
    setMigrating(true);
    try {
      const { error } = await supabase
        .from('content_items')
        .update({
          status: 'question_bank',
          show_in_subjects: false,
          show_in_syllabus: false,
          show_in_mock_tests: false,
          updated_at: new Date().toISOString()
        })
        .eq('category', 'mcq')
        .eq('status', 'approved');

      if (error) throw error;

      toast.success(`Successfully migrated ${oldQuestions.length} questions to Question Bank`);
      await fetchOldQuestions();
    } catch (error) {
      console.error('Error migrating questions:', error);
      toast.error('Failed to migrate questions');
    } finally {
      setMigrating(false);
    }
  };

  const deleteOldTestData = async () => {
    setMigrating(true);
    try {
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('category', 'mcq')
        .eq('status', 'approved');

      if (error) throw error;

      toast.success(`Successfully deleted ${oldQuestions.length} old questions`);
      await fetchOldQuestions();
    } catch (error) {
      console.error('Error deleting questions:', error);
      toast.error('Failed to delete questions');
    } finally {
      setMigrating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Migration Utility
        </CardTitle>
        <CardDescription>
          Clean up old test data and migrate approved MCQs to Question Bank
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {oldQuestions.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Found <strong>{oldQuestions.length}</strong> approved MCQ questions that should be in Question Bank.
              These questions have <code>status: 'approved'</code> and need to be migrated to use the new workflow.
            </AlertDescription>
          </Alert>
        )}

        {oldQuestions.length === 0 && !loading && (
          <Alert>
            <AlertDescription>
              ✅ No old test data found. All questions are using the new Question Bank workflow.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={fetchOldQuestions}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {oldQuestions.length > 0 && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={migrating}
                    variant="default"
                  >
                    Migrate to Question Bank
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Migrate {oldQuestions.length} questions?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will update all approved MCQ questions to:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Status: 'question_bank'</li>
                        <li>Show in Subjects: false</li>
                        <li>Show in Syllabus: false</li>
                        <li>Show in Mock Tests: false</li>
                      </ul>
                      <p className="mt-2">
                        Questions will be hidden from practice sections until you assign them via the Question Bank.
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={migrateToQuestionBank}>
                      Migrate Now
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={migrating}
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Test Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {oldQuestions.length} questions?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all approved MCQ questions from the database.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteOldTestData} className="bg-destructive text-destructive-foreground">
                      Delete Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>

        {oldQuestions.length > 0 && (
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Recommendation:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use "Migrate to Question Bank" to preserve the questions and use the new workflow</li>
              <li>Use "Delete Test Data" only if these are test/dummy questions you don't need</li>
              <li>After migration, questions will appear in the Question Bank tab for admin assignment</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
