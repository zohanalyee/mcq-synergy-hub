
import React from "react";
import { Timer, FileQuestion } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuizSettings as QuizSettingsType } from "./interfaces";

interface QuizSettingsProps {
  quizSettings: QuizSettingsType;
  updateQuizSettings: (setting: keyof QuizSettingsType, value: any) => void;
}

const QuizSettings = ({ quizSettings, updateQuizSettings }: QuizSettingsProps) => {
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-medium">Time (min)</label>
          <span className="text-[10px] text-muted-foreground">{quizSettings.timeLimit}</span>
        </div>
        <div className="flex items-center gap-2">
          <Timer className="text-muted-foreground h-3 w-3 shrink-0" />
          <Slider
            value={[quizSettings.timeLimit]}
            min={5}
            max={120}
            step={5}
            onValueChange={(value) => updateQuizSettings('timeLimit', value[0])}
            className="flex-1"
          />
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-medium">Questions</label>
          <span className="text-[10px] text-muted-foreground">{quizSettings.questionsCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <FileQuestion className="text-muted-foreground h-3 w-3 shrink-0" />
          <Slider
            value={[quizSettings.questionsCount]}
            min={5}
            max={50}
            step={5}
            onValueChange={(value) => updateQuizSettings('questionsCount', value[0])}
            className="flex-1"
          />
        </div>
      </div>
      
      <div>
        <label className="text-[10px] font-medium block mb-1">Difficulty</label>
        <Select
          value={quizSettings.difficulty}
          onValueChange={(value) => 
            updateQuizSettings('difficulty', value as QuizSettingsType['difficulty'])
          }
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent className="bg-white/95 dark:bg-card backdrop-blur-xl">
            <SelectItem value="easy" className="text-xs">Easy</SelectItem>
            <SelectItem value="medium" className="text-xs">Medium</SelectItem>
            <SelectItem value="hard" className="text-xs">Hard</SelectItem>
            <SelectItem value="mixed" className="text-xs">Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default QuizSettings;
