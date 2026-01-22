import { useState, useRef } from 'react';
import { Search, BookOpen, FileText, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { GlobalSearchResult } from '@/services/globalSearchService';

interface SmartSearchInputProps {
  onSelect: (item: GlobalSearchResult) => void;
  placeholder?: string;
  className?: string;
}

export const SmartSearchInput = ({ 
  onSelect, 
  placeholder = "Search subjects or topics...",
  className 
}: SmartSearchInputProps) => {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { query, setQuery, groupedResults, isLoading } = useGlobalSearch();

  const hasResults = groupedResults.subjects.length > 0 || groupedResults.topics.length > 0;
  const showPopover = open && query.length > 0 && (hasResults || isLoading);

  const handleSelect = (item: GlobalSearchResult) => {
    onSelect(item);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <Popover open={showPopover} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            className="pl-9 pr-8 bg-background"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover border shadow-lg"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
            </div>
          ) : (
            <div className="py-1">
              {/* Subjects Group */}
              {groupedResults.subjects.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                    Subjects
                  </div>
                  {groupedResults.subjects.map((item) => (
                    <SearchResultItem
                      key={`subject-${item.id}`}
                      item={item}
                      onClick={() => handleSelect(item)}
                    />
                  ))}
                </div>
              )}

              {/* Topics Group */}
              {groupedResults.topics.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                    Topics
                  </div>
                  {groupedResults.topics.map((item) => (
                    <SearchResultItem
                      key={`topic-${item.id}`}
                      item={item}
                      onClick={() => handleSelect(item)}
                    />
                  ))}
                </div>
              )}

              {/* No Results */}
              {!hasResults && !isLoading && query.length > 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No results found for "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Internal result item component
const SearchResultItem = ({ 
  item, 
  onClick 
}: { 
  item: GlobalSearchResult; 
  onClick: () => void;
}) => {
  const isSubject = item.result_type === 'subject';

  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-2 text-left hover:bg-accent/50 transition-colors flex items-start gap-3 group"
    >
      <div className="mt-0.5 p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
        {isSubject ? (
          <BookOpen className="h-4 w-4" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{item.name}</div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-muted/50">
            🏛️ {item.system_name}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-muted/50">
            🎓 {item.level_name}
          </Badge>
          {!isSubject && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
              📘 {item.subject_name}
            </Badge>
          )}
          {isSubject && item.topic_count > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {item.topic_count} topics
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default SmartSearchInput;
