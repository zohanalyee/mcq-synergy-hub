import { BookOpen, FileText, Building2, GraduationCap, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CommandItem } from '@/components/ui/command';
import type { GlobalSearchResult } from '@/services/globalSearchService';

interface SearchResultItemProps {
  result: GlobalSearchResult;
  onSelect: (result: GlobalSearchResult) => void;
}

export const SearchResultItem = ({ result, onSelect }: SearchResultItemProps) => {
  const isSubject = result.result_type === 'subject';
  const Icon = isSubject ? BookOpen : FileText;
  const SystemIcon = result.system_type === 'job' ? Briefcase : Building2;

  return (
    <CommandItem
      value={`${result.result_type}-${result.id}-${result.name}`}
      onSelect={() => onSelect(result)}
      className="flex flex-col items-start gap-1.5 py-3 px-3 cursor-pointer"
    >
      <div className="flex items-center gap-2 w-full">
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <span className="font-medium text-foreground truncate">
          {result.name}
        </span>
        {isSubject && result.topic_count > 0 && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {result.topic_count} topics
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-1.5 ml-6 flex-wrap">
        <Badge variant="outline" className="text-xs flex items-center gap-1 bg-muted/50">
          <SystemIcon className="h-3 w-3" />
          {result.system_name}
        </Badge>
        <Badge variant="outline" className="text-xs flex items-center gap-1 bg-muted/50">
          <GraduationCap className="h-3 w-3" />
          {result.level_name}
        </Badge>
        {!isSubject && (
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {result.subject_name}
          </Badge>
        )}
      </div>
    </CommandItem>
  );
};
