import { useNavigate } from 'react-router-dom';
import { Bookmark, Trash2, FileText, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useSyllabusTemplates } from '@/components/syllabus-builder/hooks/useSyllabusTemplates';
import { SavedSyllabusTemplate } from '@/components/syllabus-builder/interfaces';

export const SavedTestsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { templates, loading, deleteTemplate } = useSyllabusTemplates(user?.id);

  const handleLoadTemplate = (template: SavedSyllabusTemplate) => {
    navigate('/custom-syllabus', { 
      state: { templateToLoad: template } 
    });
  };

  const handleDeleteTemplate = async (templateId: string) => {
    await deleteTemplate(templateId);
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bookmark className="h-5 w-5 text-primary" />
          My Saved Tests
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">No saved tests yet</p>
              <p className="text-xs text-muted-foreground">
                Create one from the Syllabus Builder
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/custom-syllabus')}
              className="mt-2"
            >
              Go to Syllabus Builder
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
              >
                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{template.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{template.selected_topic_ids.length} topics</span>
                    <span>•</span>
                    <span>{template.quiz_settings.questionsCount} questions</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {template.quiz_settings.timeLimit}m
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleLoadTemplate(template)}
                    className="h-8 px-3"
                  >
                    Load
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
