import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ChevronDown, 
  ChevronUp, 
  Settings, 
  Play, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  Loader2,
  ArrowRight,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as z from "zod";
import { getCardTheme } from "@/components/ui/GlassCard";

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
  isGenerating?: boolean;
};

export const TestCard = ({
  test,
  expandedTest,
  customizeTest,
  selectedTopics,
  toggleExpandTest,
  toggleCustomizeTest,
  isGenerating = false,
  handleTopicToggle,
  isTopicSelected,
  handleStartTest
}: TestCardProps) => {
  const [customSettings, setCustomSettings] = useState<{ 
    difficulty: "easy" | "medium" | "hard";
    questionCount: number;
    duration: number;
  }>({
    difficulty: (test.difficulty || "medium").toLowerCase() as "easy" | "medium" | "hard",
    questionCount: test.questions,
    duration: test.duration
  });

  // Get theme based on category or title
  const theme = getCardTheme(test.category || test.title);

  const handleSubmitCustomization = async () => {
    const selectedTestTopics = selectedTopics[test.id] || test.topics;
    await handleStartTest(test, { ...customSettings, selectedTopics: selectedTestTopics });
  };

  const handleQuickStart = async () => {
    await handleStartTest(test);
  };

  const isExpanded = expandedTest === test.id;
  const isCustomizing = customizeTest === test.id;
  const selectedTestTopics = selectedTopics[test.id] || [];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return { bg: 'rgba(34, 197, 94, 0.1)', text: '#16a34a' };
      case 'medium': return { bg: 'rgba(234, 179, 8, 0.1)', text: '#ca8a04' };
      case 'hard': return { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626' };
      default: return { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280' };
    }
  };

  const difficultyStyle = getDifficultyColor(test.difficulty);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="cursor-pointer group h-full"
    >
      <div
        className="h-full rounded-3xl border border-white/50 dark:border-white/20 shadow-sm 
                   hover:shadow-xl transition-all duration-300 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${theme.pastel} 0%, rgba(255, 255, 255, 0.95) 100%)`,
        }}
      >
        <div className="p-4">
          {/* Header with Icon Squircle */}
          <div className="flex items-start gap-3 mb-3">
            {/* Icon Squircle */}
            <div
              className="w-11 h-11 rounded-2xl shadow-md flex items-center justify-center shrink-0
                         group-hover:scale-105 transition-transform duration-200"
              style={{ backgroundColor: theme.main }}
            >
              <FileText className="w-5 h-5 text-white" />
            </div>

            {/* Title & Description */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 mb-0.5">
                {test.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {test.description}
              </p>
            </div>

            {/* Difficulty Badge */}
            <Badge 
              variant="outline" 
              className="shrink-0 text-[10px] font-medium border-0"
              style={{ 
                backgroundColor: difficultyStyle.bg, 
                color: difficultyStyle.text 
              }}
            >
              {test.difficulty}
            </Badge>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="font-medium">{test.questions}</span>
              <span className="hidden sm:inline">Questions</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">{test.duration}</span>
              <span className="hidden sm:inline">Min</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="font-medium">{test.topics.length}</span>
              <span className="hidden sm:inline">Topics</span>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <Button 
              onClick={(e) => { e.stopPropagation(); toggleExpandTest(test.id); }}
              variant="ghost" 
              size="sm"
              className="flex-1 justify-center text-[10px] h-7 px-2 bg-white/50 dark:bg-slate-800/50 
                         hover:bg-white/80 dark:hover:bg-slate-700/50"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              Topics
            </Button>
            
            <Button 
              onClick={(e) => { e.stopPropagation(); toggleCustomizeTest(test.id, e); }}
              variant="ghost" 
              size="sm"
              className="flex-1 justify-center text-[10px] h-7 px-2 bg-white/50 dark:bg-slate-800/50 
                         hover:bg-white/80 dark:hover:bg-slate-700/50"
            >
              <Settings className="h-3 w-3 mr-1" />
              Customize
            </Button>
          </div>

          {/* Bottom Action Row */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={(e) => { e.stopPropagation(); handleQuickStart(); }}
              disabled={isGenerating}
              className="flex items-center gap-1"
            >
              <span
                className="text-[10px] font-bold uppercase tracking-wide"
                style={{ color: theme.main }}
              >
                {isGenerating ? "STARTING..." : "START EXAM"}
              </span>
              {isGenerating && <Loader2 className="h-3 w-3 animate-spin" style={{ color: theme.main }} />}
            </button>
            
            <motion.div
              onClick={(e) => { e.stopPropagation(); handleQuickStart(); }}
              className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm 
                         group-hover:shadow-md transition-shadow cursor-pointer"
              style={{ backgroundColor: theme.main }}
              whileHover={{ rotate: -45 }}
              transition={{ duration: 0.2 }}
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              )}
            </motion.div>
          </div>
        </div>

        {/* Topics Expansion Panel */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-700">
            <div className="pt-3">
              <h4 className="font-medium text-xs text-slate-700 dark:text-slate-300 mb-2">
                Select Topics ({selectedTestTopics.length}/{test.topics.length})
              </h4>
              <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                {test.topics.map((topic) => (
                  <label 
                    key={topic} 
                    className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/50 
                               dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      id={`${test.id}-${topic}`}
                      checked={isTopicSelected(test.id, topic)}
                      onCheckedChange={() => handleTopicToggle(test.id, topic)}
                      className="shrink-0 h-3.5 w-3.5"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 flex-1 line-clamp-1">
                      {topic}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Customization Panel */}
        {isCustomizing && (
          <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-700">
            <div className="pt-3 space-y-3">
              <h4 className="font-medium text-xs text-slate-700 dark:text-slate-300">
                Customize Settings
              </h4>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Difficulty</Label>
                  <Select value={customSettings.difficulty} onValueChange={(value: "easy" | "medium" | "hard") => 
                    setCustomSettings(prev => ({ ...prev, difficulty: value }))
                  }>
                    <SelectTrigger className="h-8 text-xs bg-white/50 dark:bg-slate-800/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Questions</Label>
                  <Input
                    type="number"
                    min="5"
                    max="100"
                    value={customSettings.questionCount}
                    onChange={(e) => setCustomSettings(prev => ({ 
                      ...prev, 
                      questionCount: parseInt(e.target.value) || 0 
                    }))}
                    className="h-8 text-xs bg-white/50 dark:bg-slate-800/50"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Duration</Label>
                  <Input
                    type="number"
                    min="5"
                    max="180"
                    value={customSettings.duration}
                    onChange={(e) => setCustomSettings(prev => ({ 
                      ...prev, 
                      duration: parseInt(e.target.value) || 0 
                    }))}
                    className="h-8 text-xs bg-white/50 dark:bg-slate-800/50"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <Button 
                onClick={(e) => { e.stopPropagation(); handleSubmitCustomization(); }}
                size="sm"
                className="w-full text-xs h-8"
                style={{ backgroundColor: theme.main }}
              >
                <Play className="h-3 w-3 mr-1" />
                Start Custom Test
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
