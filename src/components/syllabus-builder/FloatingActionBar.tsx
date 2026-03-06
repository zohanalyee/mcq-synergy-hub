import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings, Sparkles, Bookmark, Zap, Database } from 'lucide-react';
import { QuizSettings } from './interfaces';

interface FloatingActionBarProps {
  selectedSubjectsCount: number;
  selectedTopicsCount: number;
  syllabusName: string;
  setSyllabusName: (name: string) => void;
  quizSettings: QuizSettings;
  updateQuizSettings: (key: keyof QuizSettings, value: any) => void;
  onGenerateQuiz: () => void;
  isGenerating: boolean;
  onSaveTemplate?: (name: string) => Promise<boolean>;
  isSavingTemplate?: boolean;
  topicQuestionCounts?: Record<string, number>;
  selectedTopicIds?: string[];
}

export const FloatingActionBar = ({
  selectedSubjectsCount,
  selectedTopicsCount,
  syllabusName,
  setSyllabusName,
  quizSettings,
  updateQuizSettings,
  onGenerateQuiz,
  isGenerating,
  onSaveTemplate,
  isSavingTemplate = false,
  topicQuestionCounts = {},
  selectedTopicIds = []
}: FloatingActionBarProps) => {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const availableInBank = useMemo(() => {
    return selectedTopicIds.reduce((sum, id) => sum + (topicQuestionCounts[id] || 0), 0);
  }, [selectedTopicIds, topicQuestionCounts]);

  const willGenerate = Math.max(0, quizSettings.questionsCount - availableInBank);

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
      <AnimatePresence>
        {selectedTopicsCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-4xl"
          >
            <div className="bg-background/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/30 dark:border-white/10 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-2xl">
              {/* Mobile: stacked, Desktop: horizontal */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                {/* Left: Selection stats */}
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="px-2 py-1 text-xs whitespace-nowrap">
                    <span className="text-primary font-bold mr-1">{selectedSubjectsCount}</span> Subjects
                  </Badge>
                  <Badge variant="secondary" className="px-2 py-1 text-xs whitespace-nowrap">
                    <span className="text-primary font-bold mr-1">{selectedTopicsCount}</span> Topics
                  </Badge>
                  {availableInBank > 0 && (
                    <span className="text-[10px] text-muted-foreground hidden md:flex items-center gap-1">
                      <Database className="h-3 w-3" /> {availableInBank} in bank
                    </span>
                  )}
                </div>

                {/* Middle: Test name + Settings */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Input
                    value={syllabusName}
                    onChange={(e) => setSyllabusName(e.target.value)}
                    placeholder="Test Name"
                    className="h-8 text-sm flex-1 min-w-0"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72" side="top" align="end">
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Test Settings</h4>
                        {/* Questions */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Questions</Label>
                            <span className="text-sm font-medium">{quizSettings.questionsCount}</span>
                          </div>
                          <Slider
                            value={[quizSettings.questionsCount]}
                            onValueChange={([v]) => updateQuizSettings('questionsCount', v)}
                            min={5} max={100} step={5}
                          />
                        </div>
                        {/* Time */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Time Limit</Label>
                            <span className="text-sm font-medium">{quizSettings.timeLimit} min</span>
                          </div>
                          <Slider
                            value={[quizSettings.timeLimit]}
                            onValueChange={([v]) => updateQuizSettings('timeLimit', v)}
                            min={5} max={120} step={5}
                          />
                        </div>
                        {/* Difficulty */}
                        <div className="space-y-2">
                          <Label className="text-sm">Difficulty</Label>
                          <Select value={quizSettings.difficulty} onValueChange={(v) => updateQuizSettings('difficulty', v)}>
                            <SelectTrigger className="h-8">
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
                        {willGenerate > 0 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Will AI-generate {willGenerate} questions
                          </p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Right: Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {onSaveTemplate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openSaveDialog}
                      disabled={isSavingTemplate}
                      className="h-8 hidden sm:flex"
                    >
                      <Bookmark className="h-3.5 w-3.5 mr-1.5" />
                      Save
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={onGenerateQuiz}
                    disabled={isGenerating}
                    className="h-8 sm:h-8"
                  >
                    {isGenerating ? (
                      'Generating...'
                    ) : (
                      <>
                        {willGenerate > 0 ? <Zap className="h-3.5 w-3.5 mr-1.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                        Generate ({quizSettings.questionsCount} Qs)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <p className="text-xs text-muted-foreground">{templateName.length}/50 characters</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>This will save:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>{selectedSubjectsCount} subjects, {selectedTopicsCount} topics</li>
                <li>{quizSettings.questionsCount} questions, {quizSettings.timeLimit} min</li>
                <li>{quizSettings.difficulty} difficulty</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate} disabled={!templateName.trim() || isSavingTemplate}>
              {isSavingTemplate ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
