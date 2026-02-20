import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronDown, Settings, X, Sparkles, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuizSettings } from './interfaces';

interface SelectionSummaryProps {
  selectedSubjectsCount: number;
  selectedTopicsCount: number;
  syllabusName: string;
  setSyllabusName: (name: string) => void;
  quizSettings: QuizSettings;
  updateQuizSettings: (key: keyof QuizSettings, value: any) => void;
  onClearSelection: () => void;
  onGenerateQuiz: () => void;
  isGenerating: boolean;
  onSaveTemplate?: (name: string) => Promise<boolean>;
  isSavingTemplate?: boolean;
}

export const SelectionSummary = ({
  selectedSubjectsCount,
  selectedTopicsCount,
  syllabusName,
  setSyllabusName,
  quizSettings,
  updateQuizSettings,
  onClearSelection,
  onGenerateQuiz,
  isGenerating,
  onSaveTemplate,
  isSavingTemplate = false
}: SelectionSummaryProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !onSaveTemplate) return;
    
    const success = await onSaveTemplate(templateName.trim());
    if (success) {
      setSaveDialogOpen(false);
      setTemplateName('');
    }
  };

  const openSaveDialog = () => {
    setTemplateName(syllabusName || 'My Template');
    setSaveDialogOpen(true);
  };

  return (
    <>
      <Card className="p-4 space-y-4">
        {/* Test Name */}
        <div>
          <Label htmlFor="syllabusName" className="text-sm font-medium">
            Test Name
          </Label>
          <Input
            id="syllabusName"
            value={syllabusName}
            onChange={(e) => setSyllabusName(e.target.value)}
            placeholder="My Custom Test"
            className="mt-1.5"
          />
        </div>

        {/* Selection Stats */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="px-2 py-1">
            <span className="text-primary font-bold mr-1">{selectedSubjectsCount}</span> Subjects
          </Badge>
          <Badge variant="secondary" className="px-2 py-1">
            <span className="text-primary font-bold mr-1">{selectedTopicsCount}</span> Topics
          </Badge>
          {selectedTopicsCount > 0 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="h-7 px-2 text-xs ml-auto"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
              <p className="w-full text-xs text-muted-foreground">
                ~{selectedTopicsCount * quizSettings.questionsCount} questions estimated
                {selectedTopicsCount * quizSettings.questionsCount > 100 && (
                  <span className="text-destructive font-medium ml-1">
                    (exceeds 100 max — reduce selections or questions)
                  </span>
                )}
              </p>
            </>
          )}
        </div>

        {/* Test Settings */}
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Test Settings
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", settingsOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-3">
            {/* Questions Count - Max 100, Default 20 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Questions</Label>
                <span className="text-sm font-medium">{quizSettings.questionsCount}</span>
              </div>
              <Slider
                value={[quizSettings.questionsCount]}
                onValueChange={([value]) => updateQuizSettings('questionsCount', value)}
                min={5}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground">Max: 100 questions</p>
            </div>

            {/* Time Limit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Time Limit</Label>
                <span className="text-sm font-medium">{quizSettings.timeLimit} min</span>
              </div>
              <Slider
                value={[quizSettings.timeLimit]}
                onValueChange={([value]) => updateQuizSettings('timeLimit', value)}
                min={5}
                max={120}
                step={5}
              />
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label className="text-sm">Difficulty</Label>
              <Select
                value={quizSettings.difficulty}
                onValueChange={(value) => updateQuizSettings('difficulty', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={onGenerateQuiz}
            disabled={selectedTopicsCount === 0 || isGenerating || (selectedTopicsCount * quizSettings.questionsCount > 100)}
            className="w-full"
          >
            {isGenerating ? (
              <>Generating...</>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Test ({Math.min(selectedTopicsCount * quizSettings.questionsCount, 100)} Qs)
              </>
            )}
          </Button>

          {onSaveTemplate && (
            <Button
              variant="outline"
              onClick={openSaveDialog}
              disabled={selectedTopicsCount === 0 || isSavingTemplate}
              className="w-full"
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          )}
        </div>
      </Card>

      {/* Save Template Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Template</DialogTitle>
            <DialogDescription>
              Save your current selection as a template for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value.slice(0, 50))}
                placeholder="Enter template name..."
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                {templateName.length}/50 characters
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>This will save:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>{selectedSubjectsCount} subjects, {selectedTopicsCount} topics</li>
                <li>{quizSettings.questionsCount} questions, {quizSettings.timeLimit} min time limit</li>
                <li>{quizSettings.difficulty} difficulty</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTemplate} 
              disabled={!templateName.trim() || isSavingTemplate}
            >
              {isSavingTemplate ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
