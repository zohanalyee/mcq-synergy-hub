
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
    <Card className="h-auto min-h-[120px]">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Checkbox 
              id={`subject-${subject.title}`}
              checked={subject.selected}
              onCheckedChange={() => toggleSubjectSelection(subject.title)}
            />
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${subject.color}20` }}>
              {displayIcon()}
            </div>
            <div className="text-sm font-semibold line-clamp-2">{subject.title}</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSubjectExpansion(subject.title)}
            className="h-6 w-6 p-0"
          >
            {subject.expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
        </div>
      </CardHeader>
      
      <Collapsible open={subject.expanded}>
        <CollapsibleContent>
          <CardContent className="p-3 pt-0">
            <div className="grid grid-cols-1 gap-1">
              {subject.topics.map((topic: Topic) => (
                <div 
                  key={topic.id} 
                  className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-muted/50"
                >
                  <Checkbox 
                    id={topic.id} 
                    checked={topic.selected}
                    onCheckedChange={() => toggleTopicSelection(subject.title, topic.id)}
                  />
                  <label 
                    htmlFor={topic.id} 
                    className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 line-clamp-1"
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
