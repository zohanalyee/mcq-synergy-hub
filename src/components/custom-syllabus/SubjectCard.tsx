import React from "react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, FileText, ArrowRight } from "lucide-react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { CustomSubject, Topic } from "./interfaces";
import { getCardTheme } from "@/components/ui/GlassCard";

interface SubjectCardProps {
  subject: CustomSubject;
  toggleSubjectSelection: (subjectTitle: string) => void;
  toggleTopicSelection: (subjectTitle: string, topicId: string) => void;
  toggleSubjectExpansion: (subjectTitle: string) => void;
}

const SubjectCard = ({
  subject,
  toggleSubjectSelection,
  toggleTopicSelection,
  toggleSubjectExpansion,
}: SubjectCardProps) => {
  // Get theme colors based on subject title
  const theme = getCardTheme(subject.title, subject.color);

  const displayIcon = () => {
    if (!subject.icon) {
      return <FileText className="h-5 w-5 text-white" />;
    }
    
    if (React.isValidElement(subject.icon)) {
      return React.cloneElement(subject.icon as React.ReactElement<any>, {
        className: "h-5 w-5 text-white",
      });
    }
    
    return <FileText className="h-5 w-5 text-white" />;
  };

  const selectedCount = subject.topics.filter(t => t.selected).length;

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
        {/* Card Header */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <Checkbox 
              id={`subject-${subject.title}`}
              checked={subject.selected}
              onCheckedChange={() => toggleSubjectSelection(subject.title)}
              className="shrink-0 h-4 w-4 mt-1"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Icon Squircle */}
            <div
              className="w-11 h-11 rounded-2xl shadow-md flex items-center justify-center shrink-0
                         group-hover:scale-105 transition-transform duration-200"
              style={{ backgroundColor: theme.main }}
            >
              {displayIcon()}
            </div>

            {/* Subject Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-1 mb-0.5">
                {subject.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {subject.topics.length} Topics Available
              </p>
            </div>
          </div>

          {/* Selected badge */}
          {selectedCount > 0 && (
            <div className="mt-3">
              <span 
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                style={{ backgroundColor: theme.main }}
              >
                {selectedCount} selected
              </span>
            </div>
          )}

          {/* Action Row - Bottom */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSubjectExpansion(subject.title);
              }}
              className="flex items-center gap-1"
            >
              <span
                className="text-[10px] font-bold uppercase tracking-wide"
                style={{ color: theme.main }}
              >
                {subject.expanded ? "HIDE TOPICS" : "SELECT TOPICS"}
              </span>
              {subject.expanded ? (
                <ChevronDown className="h-3.5 w-3.5" style={{ color: theme.main }} />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" style={{ color: theme.main }} />
              )}
            </button>
            
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
        
        {/* Topics Collapsible */}
        <Collapsible open={subject.expanded}>
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-700">
              <div className="pt-3 grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                {subject.topics.map((topic: Topic) => (
                  <label
                    key={topic.id}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/50 
                               dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox 
                      id={topic.id} 
                      checked={topic.selected}
                      onCheckedChange={() => toggleTopicSelection(subject.title, topic.id)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300 leading-none flex-1 line-clamp-1">
                      {topic.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </motion.div>
  );
};

export default SubjectCard;
