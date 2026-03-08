import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings, Sparkles, Bookmark, Zap, SlidersHorizontal } from 'lucide-react';
import { QuizSettings, SyllabusSubject } from './interfaces';
import { TopicsSelectorModal } from './TopicsSelectorModal';

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
  // Per-topic question counts
  subjects?: SyllabusSubject[];
  perTopicCounts?: Record<string, number>;
  onPerTopicCountsChange?: (counts: Record<string, number>, deselectedTopicIds: string[]) => void;
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
  selectedTopicIds = [],
  subjects = [],
  perTopicCounts = {},
  onPerTopicCountsChange
}: FloatingActionBarProps) => {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [topicsModalOpen, setTopicsModalOpen] = useState(false);

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

  const floatingBar = (
    <AnimatePresence>
      {selectedTopicsCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 lg:bottom-8 left-4 right-4 lg:left-1/2 lg:-translate-x-1/2 lg:w-auto lg:max-w-2xl lg:right-auto z-[100]"
        >
          <div className="bg-slate-900/90 backdrop-blur-xl border border-blue-500/30 px-3 py-2 rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <div className="flex items-center gap-2">
              {/* Stats badges */}
              <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] whitespace-nowrap bg-blue-950/60 border-blue-500/20 text-blue-200 shrink-0">
                <span className="text-blue-400 font-bold mr-0.5">{selectedSubjectsCount}</span>S
              </Badge>
              {/* Topics badge - clickable to open per-topic modal */}
              <Badge
                variant="secondary"
                className="px-1.5 py-0.5 text-[10px] whitespace-nowrap bg-blue-950/60 border-blue-500/20 text-blue-200 shrink-0 cursor-pointer hover:bg-blue-900/60 transition-colors"
                onClick={() => setTopicsModalOpen(true)}
              >
                <span className="text-blue-400 font-bold mr-0.5">{selectedTopicsCount}</span>T
                <SlidersHorizontal className="h-2.5 w-2.5 ml-0.5 text-blue-400" />
              </Badge>

              {/* Test name input */}
              <Input
                value={syllabusName}
                onChange={(e) => setSyllabusName(e.target.value)}
                placeholder="Test Name"
                className="h-7 text-xs flex-1 min-w-0 bg-white/10 border-blue-500/20 text-white placeholder:text-blue-300/50 focus:border-blue-400/50"
              />

              {/* Settings gear */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-blue-300 hover:text-blue-100 hover:bg-blue-800/40">
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" side="top" align="end">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Test Settings</h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Questions</Label>
                        <span className="text-xs font-medium">{quizSettings.questionsCount}</span>
                      </div>
                      <Slider
                        value={[quizSettings.questionsCount]}
                        onValueChange={([v]) => updateQuizSettings('questionsCount', v)}
                        min={5} max={100} step={5}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Time Limit</Label>
                        <span className="text-xs font-medium">{quizSettings.timeLimit} min</span>
                      </div>
                      <Slider
                        value={[quizSettings.timeLimit]}
                        onValueChange={([v]) => updateQuizSettings('timeLimit', v)}
                        min={5} max={120} step={5}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Difficulty</Label>
                      <Select value={quizSettings.difficulty} onValueChange={(v) => updateQuizSettings('difficulty', v)}>
                        <SelectTrigger className="h-7 text-xs">
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
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Will AI-generate {willGenerate} questions
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Save (desktop only) */}
              {onSaveTemplate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openSaveDialog}
                  disabled={isSavingTemplate}
                  className="h-7 hidden sm:flex text-[10px] border-blue-500/30 text-blue-200 hover:bg-blue-800/40 hover:text-blue-100 px-2"
                >
                  <Bookmark className="h-3 w-3 mr-1" />
                  Save
                </Button>
              )}

              {/* Generate button */}
              <Button
                size="sm"
                onClick={onGenerateQuiz}
                disabled={isGenerating}
                className="h-7 text-[11px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg border-0 px-2.5 shrink-0"
              >
                {isGenerating ? '...' : (
                  <>
                    {willGenerate > 0 ? <Zap className="h-3 w-3 mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                    Generate ({quizSettings.questionsCount})
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {createPortal(floatingBar, document.body)}

      {/* Per-Topic Question Count Modal */}
      <TopicsSelectorModal
        open={topicsModalOpen}
        onOpenChange={setTopicsModalOpen}
        subjects={subjects}
        perTopicCounts={perTopicCounts}
        topicQuestionCounts={topicQuestionCounts}
        onApply={(counts, deselected) => onPerTopicCountsChange?.(counts, deselected)}
      />

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
