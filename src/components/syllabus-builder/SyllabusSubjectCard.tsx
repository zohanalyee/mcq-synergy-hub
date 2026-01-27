import React from "react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  BookOpen, 
  Atom, 
  Calculator, 
  Beaker, 
  Globe, 
  Scale, 
  Brain, 
  Stethoscope, 
  Landmark, 
  Cpu,
  ArrowRight 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SyllabusSubject } from "./interfaces";
import { getCardTheme } from "@/components/ui/GlassCard";

interface SyllabusSubjectCardProps {
  subject: SyllabusSubject;
  onToggleSubject: (subjectId: string) => void;
  onToggleTopic: (subjectId: string, topicId: string) => void;
  onToggleExpand: (subjectId: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  'atom': <Atom className="h-5 w-5 text-white" />,
  'calculator': <Calculator className="h-5 w-5 text-white" />,
  'beaker': <Beaker className="h-5 w-5 text-white" />,
  'globe': <Globe className="h-5 w-5 text-white" />,
  'scale': <Scale className="h-5 w-5 text-white" />,
  'brain': <Brain className="h-5 w-5 text-white" />,
  'stethoscope': <Stethoscope className="h-5 w-5 text-white" />,
  'landmark': <Landmark className="h-5 w-5 text-white" />,
  'cpu': <Cpu className="h-5 w-5 text-white" />,
  'book-open': <BookOpen className="h-5 w-5 text-white" />,
};

export const SyllabusSubjectCard = ({
  subject,
  onToggleSubject,
  onToggleTopic,
  onToggleExpand
}: SyllabusSubjectCardProps) => {
  const selectedTopicsCount = subject.topics.filter(t => t.isSelected).length;
  const allTopicsSelected = subject.topics.length > 0 && selectedTopicsCount === subject.topics.length;
  const someTopicsSelected = selectedTopicsCount > 0 && selectedTopicsCount < subject.topics.length;

  // Get theme colors based on subject name
  const theme = getCardTheme(subject.name);

  const getIcon = () => {
    if (subject.icon && iconMap[subject.icon.toLowerCase()]) {
      return iconMap[subject.icon.toLowerCase()];
    }
    return <BookOpen className="h-5 w-5 text-white" />;
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="cursor-pointer group h-full"
    >
      <div
        className={cn(
          "h-full rounded-3xl border border-white/50 dark:border-white/20 shadow-sm",
          "hover:shadow-xl transition-all duration-300",
          (allTopicsSelected || someTopicsSelected) && "ring-2 ring-primary/50"
        )}
        style={{
          background: `linear-gradient(135deg, ${theme.pastel} 0%, rgba(255, 255, 255, 0.95) 100%)`,
        }}
      >
        <Collapsible open={subject.isExpanded} onOpenChange={() => onToggleExpand(subject.id)}>
          {/* Card Header */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Subject Checkbox */}
              <Checkbox
                checked={allTopicsSelected}
                // @ts-ignore - indeterminate is valid but not in types
                ref={(el) => el && (el.indeterminate = someTopicsSelected)}
                onCheckedChange={() => onToggleSubject(subject.id)}
                className="mt-1"
                onClick={(e) => e.stopPropagation()}
              />
              
              {/* Icon Squircle */}
              <div
                className="w-11 h-11 rounded-2xl shadow-md flex items-center justify-center shrink-0
                           group-hover:scale-105 transition-transform duration-200"
                style={{ backgroundColor: theme.main }}
              >
                {getIcon()}
              </div>

              {/* Subject Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate mb-0.5">
                  {subject.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {subject.topics.length} Topics Available
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mt-3">
              <Badge 
                variant="secondary" 
                className="text-[10px] h-5 bg-white/60 dark:bg-slate-800/60"
              >
                {subject.levelName}
              </Badge>
              {selectedTopicsCount > 0 && (
                <Badge 
                  variant="default" 
                  className="text-[10px] h-5"
                  style={{ backgroundColor: theme.main }}
                >
                  {selectedTopicsCount} selected
                </Badge>
              )}
            </div>

            {/* Action Row - Bottom */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
              <CollapsibleTrigger asChild>
                <button 
                  className="flex items-center gap-1 group/trigger"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: theme.main }}
                  >
                    {subject.isExpanded ? "HIDE TOPICS" : "VIEW TOPICS"}
                  </span>
                  <ChevronDown 
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      subject.isExpanded && "rotate-180"
                    )} 
                    style={{ color: theme.main }}
                  />
                </button>
              </CollapsibleTrigger>
              
              <motion.div
                className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm 
                           group-hover:shadow-md transition-shadow"
                style={{ backgroundColor: theme.main }}
                whileHover={{ rotate: -45 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </motion.div>
            </div>
          </div>

          {/* Topics List */}
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-700">
              <div className="pt-3 space-y-1 max-h-48 overflow-y-auto">
                {subject.topics.length > 0 ? (
                  subject.topics.map(topic => (
                    <label
                      key={topic.id}
                      className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/50 
                                 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={topic.isSelected}
                        onCheckedChange={() => onToggleTopic(subject.id, topic.id)}
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                        {topic.name}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground py-2 text-center">
                    No topics available
                  </p>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </motion.div>
  );
};
