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
  BookOpen, 
  Loader2,
  ArrowRight,
  Building,
  Briefcase
} from "lucide-react";
import { SyllabusItem } from "@/data/jobTestsData";
import { testCustomizationSchema } from "./TestCard";
import * as z from "zod";
import { getCardTheme } from "@/components/ui/GlassCard";

export type JobTestCardProps = {
  test: {
    id: number;
    title: string;
    description: string;
    organization: string;
    duration: number;
    questions: number;
    syllabus: SyllabusItem[];
  };
  expandedJobTest: number | null;
  customizeJobTest: number | null;
  toggleExpandJobTest: (testId: number) => void;
  toggleCustomizeJobTest: (testId: number, event: React.MouseEvent) => void;
  handleStartJobTest: (test: any, settings?: any) => void;
  isGenerating?: boolean;
};

export const JobTestCard = ({
  test,
  expandedJobTest,
  customizeJobTest,
  toggleExpandJobTest,
  toggleCustomizeJobTest,
  handleStartJobTest,
  isGenerating = false
}: JobTestCardProps) => {
  const [customSettings, setCustomSettings] = useState<{ 
    difficulty: "easy" | "medium" | "hard";
    questionCount: number;
    duration: number;
  }>({
    difficulty: "medium",
    questionCount: test.questions,
    duration: test.duration
  });

  // Get theme based on organization
  const theme = getCardTheme(test.organization || test.title);

  const handleSubmitJobCustomization = () => {
    handleStartJobTest(test, customSettings);
  };

  const handleStartTest = () => {
    handleStartJobTest(test);
  };

  const isExpanded = expandedJobTest === test.id;
  const isCustomizing = customizeJobTest === test.id;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="cursor-pointer group h-full"
    >
      <div
        className="h-full rounded-3xl border border-white/50 dark:border-white/20 shadow-sm 
                   hover:shadow-xl transition-all duration-300 overflow-hidden glass-card themed-card"
        style={{
          background: `linear-gradient(135deg, ${theme.pastel} 0%, rgba(var(--card-rgb), var(--cards-opacity, 0.95)) 100%)`,
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
              <Briefcase className="w-5 h-5 text-white" />
            </div>

            {/* Title & Organization */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 mb-0.5">
                {test.title}
              </h3>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Building className="h-3 w-3" />
                <span className="line-clamp-1">{test.organization}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
            {test.description}
          </p>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">{test.duration}</span>
              <span>Min</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="font-medium">{test.questions}</span>
              <span>Questions</span>
            </div>
            <Badge 
              variant="secondary" 
              className="text-[9px] h-5 bg-white/60 dark:bg-slate-800/60"
            >
              {test.syllabus.length} Subjects
            </Badge>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <Button 
              onClick={(e) => { e.stopPropagation(); toggleExpandJobTest(test.id); }}
              variant="ghost" 
              size="sm"
              className="flex-1 justify-center text-[10px] h-7 px-2 bg-white/50 dark:bg-slate-800/50 
                         hover:bg-white/80 dark:hover:bg-slate-700/50"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              Syllabus
            </Button>
            
            <Button 
              onClick={(e) => { e.stopPropagation(); toggleCustomizeJobTest(test.id, e); }}
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
              onClick={(e) => { e.stopPropagation(); handleStartTest(); }}
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
              onClick={(e) => { e.stopPropagation(); handleStartTest(); }}
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

        {/* Syllabus Expansion Panel */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-700">
            <div className="pt-3">
              <h4 className="font-medium text-xs text-slate-700 dark:text-slate-300 mb-2">
                Official Syllabus
              </h4>
              <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                {test.syllabus.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg 
                               bg-white/50 dark:bg-slate-800/50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs text-slate-700 dark:text-slate-300 flex-1 line-clamp-1">
                      {item.topic}
                    </span>
                    <Badge 
                      variant="outline" 
                      className="text-[9px] h-4 ml-2"
                      style={{ borderColor: theme.main, color: theme.main }}
                    >
                      {item.percentage}%
                    </Badge>
                  </div>
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
                onClick={(e) => { e.stopPropagation(); handleSubmitJobCustomization(); }}
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
