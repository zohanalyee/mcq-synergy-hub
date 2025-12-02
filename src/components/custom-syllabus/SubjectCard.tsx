
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
    <Card className="h-full group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 relative overflow-hidden">
      {/* Gradient Background */}
      <div 
        className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
        style={{
          background: `linear-gradient(135deg, ${subject.color}40 0%, ${subject.color}10 100%)`
        }}
      />
      
      <CardHeader className="p-4 pb-3 relative z-10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Checkbox 
              id={`subject-${subject.title}`}
              checked={subject.selected}
              onCheckedChange={() => toggleSubjectSelection(subject.title)}
              className="shrink-0"
            />
            <div 
              className="p-3 rounded-xl shadow-md group-hover:shadow-lg transition-shadow shrink-0" 
              style={{ backgroundColor: `${subject.color}25` }}
            >
              {React.cloneElement(displayIcon() as React.ReactElement, {
                className: "h-8 w-8",
                style: { color: subject.color }
              })}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold line-clamp-2 text-foreground">{subject.title}</div>
              <div className="text-xs text-muted-foreground">{subject.topics.length} topics</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSubjectExpansion(subject.title)}
            className="h-8 w-8 p-0 shrink-0"
          >
            {subject.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <Collapsible open={subject.expanded}>
        <CollapsibleContent>
          <CardContent className="p-4 pt-0 relative z-10">
            <div className="grid grid-cols-1 gap-2">
              {subject.topics.map((topic: Topic) => (
                <div 
                  key={topic.id} 
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-primary/30"
                >
                  <Checkbox 
                    id={topic.id} 
                    checked={topic.selected}
                    onCheckedChange={() => toggleTopicSelection(subject.title, topic.id)}
                  />
                  <label 
                    htmlFor={topic.id} 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 line-clamp-2"
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
