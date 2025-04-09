
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
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Time Limit (minutes)</label>
          <span className="text-sm text-muted-foreground">{quizSettings.timeLimit} min</span>
        </div>
        <div className="flex items-center gap-4">
          <Timer className="text-muted-foreground h-4 w-4" />
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
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Number of Questions</label>
          <span className="text-sm text-muted-foreground">{quizSettings.questionsCount}</span>
        </div>
        <div className="flex items-center gap-4">
          <FileQuestion className="text-muted-foreground h-4 w-4" />
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
        <label className="text-sm font-medium block mb-2">Difficulty Level</label>
        <Select
          value={quizSettings.difficulty}
          onValueChange={(value) => 
            updateQuizSettings('difficulty', value as QuizSettingsType['difficulty'])
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default QuizSettings;
