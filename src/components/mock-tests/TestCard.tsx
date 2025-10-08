
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Settings, Play, Clock, HelpCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import * as z from "zod";
import { generateCustomTest } from "@/services/testGenerationService";
import { toast } from "sonner";

export const testCustomizationSchema = z.object({
  difficulty: z.enum(["easy", "medium", "hard"]),
  questionCount: z.number().min(5).max(100),
  duration: z.number().min(5).max(180),
});

type TestCardProps = {
  test: {
    id: number;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    questions: number;
    duration: number;
    topics: string[];
  };
  expandedTest: number | null;
  customizeTest: number | null;
  selectedTopics: Record<number, string[]>;
  toggleExpandTest: (testId: number) => void;
  toggleCustomizeTest: (testId: number, event: React.MouseEvent) => void;
  handleTopicToggle: (testId: number, topic: string) => void;
  isTopicSelected: (testId: number, topic: string) => boolean;
  handleStartTest: (test: any, settings?: any) => void;
};

export const TestCard = ({
  test,
  expandedTest,
  customizeTest,
  selectedTopics,
  toggleExpandTest,
  toggleCustomizeTest,
  handleTopicToggle,
  isTopicSelected,
  handleStartTest
}: TestCardProps) => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [customSettings, setCustomSettings] = useState<{ 
    difficulty: "easy" | "medium" | "hard";
    questionCount: number;
    duration: number;
  }>({
    difficulty: (test.difficulty || "medium").toLowerCase() as "easy" | "medium" | "hard",
    questionCount: test.questions,
    duration: test.duration
  });

  const handleSubmitCustomization = async () => {
    setIsGenerating(true);
    const selectedTestTopics = selectedTopics[test.id] || test.topics;
    
    try {
      const generatedTest = await generateCustomTest({
        subjects: [test.category],
        topics: selectedTestTopics,
        difficulty: customSettings.difficulty,
        questionCount: customSettings.questionCount,
        timeLimit: customSettings.duration,
        includeExplanations: true,
        shuffleQuestions: true,
        shuffleOptions: true
      });

      if (!generatedTest) {
        toast.error("No questions available for the selected criteria");
        setIsGenerating(false);
        return;
      }

      navigate('/test-session', { state: { test: generatedTest } });
    } catch (error) {
      console.error("Error generating test:", error);
      toast.error("Failed to generate test");
      setIsGenerating(false);
    }
  };

  const handleQuickStart = async () => {
    setIsGenerating(true);
    
    try {
      const generatedTest = await generateCustomTest({
        subjects: [test.category],
        topics: test.topics,
        difficulty: test.difficulty.toLowerCase() as "easy" | "medium" | "hard",
        questionCount: test.questions,
        timeLimit: test.duration,
        includeExplanations: true,
        shuffleQuestions: true,
        shuffleOptions: true
      });

      if (!generatedTest) {
        toast.error("No questions available for this test");
        setIsGenerating(false);
        return;
      }

      navigate('/test-session', { state: { test: generatedTest } });
    } catch (error) {
      console.error("Error starting test:", error);
      toast.error("Failed to start test");
      setIsGenerating(false);
    }
  };

  const isExpanded = expandedTest === test.id;
  const isCustomizing = customizeTest === test.id;
  const anyExpanded = isExpanded || isCustomizing;
  const selectedTestTopics = selectedTopics[test.id] || [];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-muted-foreground bg-muted border-border';
    }
  };

  return (
    <Card className="min-h-[220px] hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary/60">
      <CardContent className="p-4 sm:p-6">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold line-clamp-2 mb-2 leading-tight">{test.title}</h3>
            <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 leading-relaxed">{test.description}</p>
          </div>
          <Badge variant="outline" className={cn("ml-3 shrink-0 text-xs font-medium", getDifficultyColor(test.difficulty))}>
            {test.difficulty}
          </Badge>
        </div>

        {/* Stats Section */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <HelpCircle className="h-4 w-4" />
            <span className="font-medium">{test.questions}</span>
            <span className="hidden sm:inline">Questions</span>
            <span className="sm:hidden">Q</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-medium">{test.duration}</span>
            <span className="hidden sm:inline">Minutes</span>
            <span className="sm:hidden">Min</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">{test.topics.length}</span>
            <span className="hidden sm:inline">Topics</span>
            <span className="sm:hidden">T</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
          <Button 
            onClick={() => toggleExpandTest(test.id)}
            variant="outline" 
            size="sm"
            className="flex-1 justify-center text-xs sm:text-sm"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
            Topics ({selectedTestTopics.length})
          </Button>
          
          <Button 
            onClick={(e) => toggleCustomizeTest(test.id, e)}
            variant="outline" 
            size="sm"
            className="flex-1 justify-center text-xs sm:text-sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Customize
          </Button>
          
          {!isCustomizing && (
            <Button 
              onClick={handleQuickStart}
              size="sm"
              disabled={isGenerating}
              className="flex-1 justify-center text-xs sm:text-sm font-medium"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Start Test
            </Button>
          )}
        </div>

        {/* Topics Expansion Panel */}
        {isExpanded && (
          <div className="border-t pt-4 mt-4 space-y-3">
            <h4 className="font-medium text-sm sm:text-base mb-3">Select Topics ({selectedTestTopics.length}/{test.topics.length})</h4>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
              {test.topics.map((topic) => (
                <div key={topic} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id={`${test.id}-${topic}`}
                    checked={isTopicSelected(test.id, topic)}
                    onCheckedChange={() => handleTopicToggle(test.id, topic)}
                    className="shrink-0"
                  />
                  <Label 
                    htmlFor={`${test.id}-${topic}`} 
                    className="text-sm leading-relaxed cursor-pointer flex-1"
                  >
                    {topic}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customization Panel */}
        {isCustomizing && (
          <div className="border-t pt-4 mt-4 space-y-4">
            <h4 className="font-medium text-sm sm:text-base mb-4">Customize Test Settings</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`difficulty-${test.id}`} className="text-sm font-medium">Difficulty</Label>
                <Select value={customSettings.difficulty} onValueChange={(value: "easy" | "medium" | "hard") => 
                  setCustomSettings(prev => ({ ...prev, difficulty: value }))
                }>
                  <SelectTrigger id={`difficulty-${test.id}`} className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`questions-${test.id}`} className="text-sm font-medium">Questions</Label>
                <Input
                  id={`questions-${test.id}`}
                  type="number"
                  min="5"
                  max="100"
                  value={customSettings.questionCount}
                  onChange={(e) => setCustomSettings(prev => ({ 
                    ...prev, 
                    questionCount: parseInt(e.target.value) || 0 
                  }))}
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`duration-${test.id}`} className="text-sm font-medium">Duration (min)</Label>
                <Input
                  id={`duration-${test.id}`}
                  type="number"
                  min="5"
                  max="180"
                  value={customSettings.duration}
                  onChange={(e) => setCustomSettings(prev => ({ 
                    ...prev, 
                    duration: parseInt(e.target.value) || 0 
                  }))}
                  className="h-9"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleSubmitCustomization}
                size="sm"
                className="flex-1 text-sm"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Custom Test
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
