
import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { CustomSubject, Topic } from "./interfaces";
import { FileText } from "lucide-react";

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
  // Create a default icon if none is provided or if icon is invalid
  const displayIcon = () => {
    if (!subject.icon) {
      return <FileText className="h-6 w-6" style={{ color: subject.color || '#3b82f6' }} />;
    }
    
    // If it's already a valid React element, use it directly
    if (React.isValidElement(subject.icon)) {
      // Use type assertion to handle TypeScript constraints
      return React.cloneElement(subject.icon as React.ReactElement<any>, {
        className: "h-6 w-6",
        style: { color: subject.color || '#3b82f6' }
      });
    }
    
    // Fallback to default icon if unable to render
    return <FileText className="h-6 w-6" style={{ color: subject.color || '#3b82f6' }} />;
  };
  
  return (
    <Card className="h-full group hover:shadow-md transition-all duration-200 hover:border-primary/40 relative overflow-hidden glass-card">
      {/* Gradient Background */}
      <div 
        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity"
        style={{
          background: `linear-gradient(135deg, ${subject.color}40 0%, ${subject.color}10 100%)`
        }}
      />
      
      <CardHeader className="p-2.5 pb-1.5 relative z-10">
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Checkbox 
              id={`subject-${subject.title}`}
              checked={subject.selected}
              onCheckedChange={() => toggleSubjectSelection(subject.title)}
              className="shrink-0 h-3.5 w-3.5"
            />
            <div 
              className="p-1.5 rounded-md shrink-0" 
              style={{ backgroundColor: `${subject.color}20` }}
            >
              {React.cloneElement(displayIcon() as React.ReactElement, {
                className: "h-4 w-4",
                style: { color: subject.color }
              })}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold line-clamp-1 text-foreground break-words">{subject.title}</div>
              <div className="text-[10px] text-muted-foreground">{subject.topics.length} topics</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSubjectExpansion(subject.title)}
            className="h-6 w-6 p-0 shrink-0"
          >
            {subject.expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardHeader>
      
      <Collapsible open={subject.expanded}>
        <CollapsibleContent>
          <CardContent className="p-2.5 pt-0 relative z-10">
            <div className="grid grid-cols-1 gap-0.5 max-h-32 overflow-y-auto">
              {subject.topics.map((topic: Topic) => (
                <div 
                  key={topic.id} 
                  className="flex items-center space-x-1.5 p-1 rounded hover:bg-accent/30 transition-colors"
                >
                  <Checkbox 
                    id={topic.id} 
                    checked={topic.selected}
                    onCheckedChange={() => toggleTopicSelection(subject.title, topic.id)}
                    className="h-3 w-3"
                  />
                  <label 
                    htmlFor={topic.id} 
                    className="text-[10px] leading-none cursor-pointer flex-1 line-clamp-1 break-words"
                  >
                    {topic.name}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default SubjectCard;
