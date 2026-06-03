import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { getCardTheme } from "@/components/ui/GlassCard";

export type JobTestCardProps = {
  test: {
    id: string;
    title: string;
    description: string;
    organization: string;
    duration: number;
    questions: number;
    syllabus: SyllabusItem[];
  };
  expandedJobTest: string | null;
  customizeJobTest: string | null;
  toggleExpandJobTest: (testId: string) => void;
  toggleCustomizeJobTest: (testId: string, event: React.MouseEvent) => void;
  handleStartJobTest: (test: any, settings?: any) => void;
  isGenerating?: boolean;
  /** SEO detail page URL for this test. When set, the title links to it. */
  detailHref?: string;
};

export const JobTestCard = ({
  test,
  expandedJobTest,
  customizeJobTest,
  toggleExpandJobTest,
  toggleCustomizeJobTest,
  handleStartJobTest,
  isGenerating = false,
  detailHref,
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
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="cursor-pointer group"
    >
      <div
        className="rounded-2xl border border-white/50 dark:border-white/20 shadow-sm 
                   hover:shadow-lg transition-all duration-300 overflow-hidden glass-card themed-card"
        style={{
          background: `linear-gradient(135deg, ${theme.pastel} 0%, rgba(var(--card-rgb), var(--cards-opacity, 0.95)) 100%)`,
        }}
      >
        <div className="p-3">
          {/* Header with Icon Squircle */}
          <div className="flex items-start gap-2 mb-2">
            {/* Icon Squircle */}
            <div
              className="w-9 h-9 rounded-xl shadow-md flex items-center justify-center shrink-0
                         group-hover:scale-105 transition-transform duration-200"
              style={{ backgroundColor: theme.main }}
            >
              <Briefcase className="w-4 h-4 text-white" />
            </div>

            {/* Title & Organization */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight mb-0.5">
                {detailHref ? (
                  <Link to={detailHref} onClick={(e) => e.stopPropagation()} className="hover:underline">
                    {test.title}
                  </Link>
                ) : (
                  test.title
                )}
              </h3>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                <Building className="h-2.5 w-2.5" />
                <span className="line-clamp-1">{test.organization}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
            {test.description}
          </p>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-2 mb-2">
            <div className="flex items-center gap-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              <Clock className="h-3 w-3" />
              <span className="font-medium">{test.duration}m</span>
            </div>
            <div className="flex items-center gap-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              <BookOpen className="h-3 w-3" />
              <span className="font-medium">{test.questions}Q</span>
            </div>
            <Badge 
              variant="secondary" 
              className="text-[8px] h-4 px-1.5 bg-white/60 dark:bg-slate-800/60"
            >
              {test.syllabus.length} Subj
            </Badge>
          </div>

          {/* Action Buttons Row */}
          <div className="flex gap-1 mb-2">
            <Button 
              onClick={(e) => { e.stopPropagation(); toggleExpandJobTest(test.id); }}
              variant="ghost" 
              size="sm"
              className="flex-1 justify-center text-[9px] h-6 px-1.5 bg-white/50 dark:bg-slate-800/50 
                         hover:bg-white/80 dark:hover:bg-slate-700/50"
            >
              {isExpanded ? <ChevronUp className="h-2.5 w-2.5 mr-0.5" /> : <ChevronDown className="h-2.5 w-2.5 mr-0.5" />}
              Syllabus
            </Button>
            
            <Button 
              onClick={(e) => { e.stopPropagation(); toggleCustomizeJobTest(test.id, e); }}
              variant="ghost" 
              size="sm"
              className="flex-1 justify-center text-[9px] h-6 px-1.5 bg-white/50 dark:bg-slate-800/50 
                         hover:bg-white/80 dark:hover:bg-slate-700/50"
            >
              <Settings className="h-2.5 w-2.5 mr-0.5" />
              Custom
            </Button>
          </div>

          {/* Bottom Action Row */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={(e) => { e.stopPropagation(); handleStartTest(); }}
              disabled={isGenerating}
              className="flex items-center gap-1"
            >
              <span
                className="text-[9px] font-bold uppercase tracking-wide"
                style={{ color: theme.main }}
              >
                {isGenerating ? "STARTING..." : "START EXAM"}
              </span>
              {isGenerating && <Loader2 className="h-2.5 w-2.5 animate-spin" style={{ color: theme.main }} />}
            </button>
            
            <motion.div
              onClick={(e) => { e.stopPropagation(); handleStartTest(); }}
              className="w-6 h-6 rounded-full flex items-center justify-center shadow-sm 
                         group-hover:shadow-md transition-shadow cursor-pointer"
              style={{ backgroundColor: theme.main }}
              whileHover={{ rotate: -45 }}
              transition={{ duration: 0.2 }}
            >
              {isGenerating ? (
                <Loader2 className="w-3 h-3 text-white animate-spin" />
              ) : (
                <ArrowRight className="w-3 h-3 text-white" />
              )}
            </motion.div>
          </div>
        </div>

        {/* Syllabus Expansion Panel */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="syllabus"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden border-t border-slate-100 dark:border-slate-700"
            >
              <div className="px-3 pb-3 pt-2">
                <h4 className="font-medium text-[10px] text-slate-700 dark:text-slate-300 mb-1.5">
                  Official Syllabus
                </h4>
                <div className="grid grid-cols-1 gap-0.5 max-h-32 overflow-y-auto">
                  {test.syllabus.map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between py-1 px-1.5 rounded-lg 
                                 bg-white/50 dark:bg-slate-800/50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[10px] text-slate-700 dark:text-slate-300 flex-1 line-clamp-1">
                        {item.topic}
                      </span>
                      <Badge 
                        variant="outline" 
                        className="text-[8px] h-3.5 ml-1 px-1"
                        style={{ borderColor: theme.main, color: theme.main }}
                      >
                        {item.percentage}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Customization Panel */}
        {isCustomizing && (
          <div className="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-700">
            <div className="pt-2 space-y-2">
              <h4 className="font-medium text-[10px] text-slate-700 dark:text-slate-300">
                Customize Settings
              </h4>
              
              <div className="grid grid-cols-3 gap-1.5">
                <div className="space-y-0.5">
                  <Label className="text-[9px] font-medium text-slate-600 dark:text-slate-400">Difficulty</Label>
                  <Select value={customSettings.difficulty} onValueChange={(value: "easy" | "medium" | "hard") => 
                    setCustomSettings(prev => ({ ...prev, difficulty: value }))
                  }>
                    <SelectTrigger className="h-6 text-[10px] bg-white/50 dark:bg-slate-800/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-0.5">
                  <Label className="text-[9px] font-medium text-slate-600 dark:text-slate-400">Questions</Label>
                  <Input
                    type="number"
                    min="5"
                    max="100"
                    value={customSettings.questionCount}
                    onChange={(e) => setCustomSettings(prev => ({ 
                      ...prev, 
                      questionCount: parseInt(e.target.value) || 0 
                    }))}
                    className="h-6 text-[10px] bg-white/50 dark:bg-slate-800/50"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div className="space-y-0.5">
                  <Label className="text-[9px] font-medium text-slate-600 dark:text-slate-400">Duration</Label>
                  <Input
                    type="number"
                    min="5"
                    max="180"
                    value={customSettings.duration}
                    onChange={(e) => setCustomSettings(prev => ({ 
                      ...prev, 
                      duration: parseInt(e.target.value) || 0 
                    }))}
                    className="h-6 text-[10px] bg-white/50 dark:bg-slate-800/50"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <Button 
                onClick={(e) => { e.stopPropagation(); handleSubmitJobCustomization(); }}
                size="sm"
                className="w-full text-[10px] h-6"
                style={{ backgroundColor: theme.main }}
              >
                <Play className="h-2.5 w-2.5 mr-1" />
                Start Custom Test
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
