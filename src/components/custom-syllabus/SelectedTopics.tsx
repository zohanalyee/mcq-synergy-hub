
import React from "react";
import { Check, ListChecks, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSubject } from "./interfaces";
import { Badge } from "@/components/ui/badge";

interface SelectedTopicsProps {
  customSubjects: CustomSubject[];
  selectedSubjectsCount: number;
  setSelectedCategory: (category: string) => void;
}

const SelectedTopics = ({ 
  customSubjects, 
  selectedSubjectsCount,
  setSelectedCategory
}: SelectedTopicsProps) => {
  // Group selected topics by category
  const selectedByCategory = React.useMemo(() => {
    const result: Record<string, CustomSubject[]> = {};
    
    customSubjects
      .filter(subject => subject.topics.some(topic => topic.selected))
      .forEach(subject => {
        if (!result[subject.category]) {
          result[subject.category] = [];
        }
        result[subject.category].push(subject);
      });
      
    return result;
  }, [customSubjects]);
  
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-1.5">Selected Content</h3>
      <div className="bg-muted/50 rounded-lg p-4 h-[250px] overflow-y-auto">
        {selectedSubjectsCount > 0 ? (
          <div>
            {Object.keys(selectedByCategory).map(category => (
              <div key={category} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-primary/10">
                    {category}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                    onClick={() => setSelectedCategory(category)}
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    Filter by this category
                  </Button>
                </div>
                
                {selectedByCategory[category].map(subject => (
                  <div key={subject.title} className="mb-3 pl-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-1 rounded-md" style={{ backgroundColor: `${subject.color}20` }}>
                        {React.isValidElement(subject.icon) && 
                          React.cloneElement(subject.icon as React.ReactElement, { className: "h-4 w-4" })}
                      </div>
                      <span className="font-medium text-sm">{subject.title}</span>
                      <span className="text-xs text-muted-foreground">
                        ({subject.topics.filter(t => t.selected).length} topics)
                      </span>
                    </div>
                    <div className="pl-7 space-y-1">
                      {subject.topics.filter(topic => topic.selected).map(topic => (
                        <div key={topic.id} className="flex items-center text-xs text-muted-foreground">
                          <Check className="mr-1 h-3 w-3" />
                          {topic.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <ListChecks className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground mb-2">No topics selected yet</p>
            <Button variant="outline" size="sm" onClick={() => setSelectedCategory("All")}>
              <Plus className="h-4 w-4 mr-1" /> Select Topics
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectedTopics;
