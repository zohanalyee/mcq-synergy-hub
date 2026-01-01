import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChevronDown, Settings, X, Sparkles } from 'lucide-react';
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
  isGenerating
}: SelectionSummaryProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <Card className="p-4 space-y-4">
      {/* Quiz Name */}
      <div>
        <Label htmlFor="syllabusName" className="text-sm font-medium">
          Quiz Name
        </Label>
        <Input
          id="syllabusName"
          value={syllabusName}
          onChange={(e) => setSyllabusName(e.target.value)}
          placeholder="My Custom Quiz"
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-7 px-2 text-xs ml-auto"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Quiz Settings */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
          <span className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Quiz Settings
          </span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", settingsOpen && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          {/* Questions Count */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Questions</Label>
              <span className="text-sm font-medium">{quizSettings.questionsCount}</span>
            </div>
            <Slider
              value={[quizSettings.questionsCount]}
              onValueChange={([value]) => updateQuizSettings('questionsCount', value)}
              min={5}
              max={50}
              step={5}
            />
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

      {/* Generate Button */}
      <Button
        onClick={onGenerateQuiz}
        disabled={selectedTopicsCount === 0 || isGenerating}
        className="w-full"
      >
        {isGenerating ? (
          <>Generating...</>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Quiz
          </>
        )}
      </Button>
    </Card>
  );
};
