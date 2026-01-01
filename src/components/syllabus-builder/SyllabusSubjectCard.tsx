import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, BookOpen, Atom, Calculator, Beaker, Globe, Scale, Brain, Stethoscope, Landmark, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SyllabusSubject } from './interfaces';

interface SyllabusSubjectCardProps {
  subject: SyllabusSubject;
  onToggleSubject: (subjectId: string) => void;
  onToggleTopic: (subjectId: string, topicId: string) => void;
  onToggleExpand: (subjectId: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  'atom': <Atom className="h-5 w-5" />,
  'calculator': <Calculator className="h-5 w-5" />,
  'beaker': <Beaker className="h-5 w-5" />,
  'globe': <Globe className="h-5 w-5" />,
  'scale': <Scale className="h-5 w-5" />,
  'brain': <Brain className="h-5 w-5" />,
  'stethoscope': <Stethoscope className="h-5 w-5" />,
  'landmark': <Landmark className="h-5 w-5" />,
  'cpu': <Cpu className="h-5 w-5" />,
  'book-open': <BookOpen className="h-5 w-5" />,
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

  const getIcon = () => {
    if (subject.icon && iconMap[subject.icon.toLowerCase()]) {
      return iconMap[subject.icon.toLowerCase()];
    }
    return <BookOpen className="h-5 w-5" />;
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200",
        (allTopicsSelected || someTopicsSelected) && "ring-2 ring-primary/50 bg-primary/5"
      )}
    >
      <Collapsible open={subject.isExpanded} onOpenChange={() => onToggleExpand(subject.id)}>
        {/* Card Header */}
        <div className="p-3 flex items-start gap-3">
          {/* Subject Checkbox */}
          <Checkbox
            checked={allTopicsSelected}
            // @ts-ignore - indeterminate is valid but not in types
            ref={(el) => el && (el.indeterminate = someTopicsSelected)}
            onCheckedChange={() => onToggleSubject(subject.id)}
            className="mt-1"
          />
          
          {/* Subject Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-primary">{getIcon()}</span>
              <h4 className="font-medium text-sm truncate">{subject.name}</h4>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs h-5">
                {subject.levelName}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {subject.topics.length} topics
              </span>
              {selectedTopicsCount > 0 && (
                <Badge variant="default" className="text-xs h-5">
                  {selectedTopicsCount} selected
                </Badge>
              )}
            </div>
          </div>
          
          {/* Expand Trigger */}
          <CollapsibleTrigger asChild>
            <button className="p-1 hover:bg-muted rounded transition-colors">
              <ChevronDown 
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  subject.isExpanded && "rotate-180"
                )} 
              />
            </button>
          </CollapsibleTrigger>
        </div>

        {/* Topics List */}
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-0 border-t">
            <div className="pt-3 space-y-1 max-h-48 overflow-y-auto">
              {subject.topics.length > 0 ? (
                subject.topics.map(topic => (
                  <label
                    key={topic.id}
                    className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={topic.isSelected}
                      onCheckedChange={() => onToggleTopic(subject.id, topic.id)}
                    />
                    <span className="text-sm truncate">{topic.name}</span>
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
    </Card>
  );
};
