import { useState, useRef } from 'react';
import { Search, BookOpen, FileText, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { GlobalSearchResult } from '@/services/globalSearchService';

interface GlassSearchInputProps {
  onSelect: (item: GlobalSearchResult) => void;
  placeholder?: string;
  className?: string;
}

export const GlassSearchInput = ({ 
  onSelect, 
  placeholder = "Search subjects or topics...",
  className 
}: GlassSearchInputProps) => {
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
          {/* Glass Capsule Search Bar */}
          <div className="relative group">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-0 group-focus-within:opacity-100 blur-md transition-opacity duration-300" />
            <div className={cn(
              "relative flex items-center rounded-full",
              "bg-white/80 dark:bg-slate-900/80",
              "backdrop-blur-md",
              "border border-white/50 dark:border-white/20",
              "shadow-sm hover:shadow-md transition-all duration-300",
              "focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/30"
            )}>
              <Search className="absolute left-4 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                ref={inputRef}
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setOpen(true)}
                className={cn(
                  "w-full h-11 pl-11 pr-10 rounded-full",
                  "bg-transparent",
                  "text-sm placeholder:text-muted-foreground",
                  "focus:outline-none",
                  "transition-all duration-200"
                )}
              />
              {query && (
                <button
                  onClick={handleClear}
                  className="absolute right-4 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </PopoverTrigger>
      
      {/* Glass Dropdown Panel */}
      <PopoverContent 
        className={cn(
          "w-[var(--radix-popover-trigger-width)] p-0",
          "rounded-3xl",
          "bg-white/90 dark:bg-slate-900/90",
          "backdrop-blur-xl",
          "border border-white/50 dark:border-white/20",
          "shadow-2xl"
        )}
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-80 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Subjects Group */}
              {groupedResults.subjects.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Subjects
                  </div>
                  <div className="space-y-1">
                    {groupedResults.subjects.map((item) => (
                      <GlassSearchResultItem
                        key={`subject-${item.id}`}
                        item={item}
                        onClick={() => handleSelect(item)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Topics Group */}
              {groupedResults.topics.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Topics
                  </div>
                  <div className="space-y-1">
                    {groupedResults.topics.map((item) => (
                      <GlassSearchResultItem
                        key={`topic-${item.id}`}
                        item={item}
                        onClick={() => handleSelect(item)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {!hasResults && !isLoading && query.length > 0 && (
                <div className="py-8 text-center">
                  <Search className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No results for "{query}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Internal result item component with glass styling
const GlassSearchResultItem = ({ 
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
      className={cn(
        "w-full px-3 py-2.5 text-left rounded-2xl",
        "hover:bg-primary/10 dark:hover:bg-primary/20",
        "transition-all duration-200",
        "flex items-start gap-3 group"
      )}
    >
      <div className={cn(
        "mt-0.5 p-2 rounded-xl shadow-sm",
        "bg-gradient-to-br from-primary/20 to-primary/10",
        "group-hover:from-primary/30 group-hover:to-primary/20",
        "transition-all duration-200"
      )}>
        {isSubject ? (
          <BookOpen className="h-4 w-4 text-primary" />
        ) : (
          <FileText className="h-4 w-4 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
          {item.name}
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <Badge 
            variant="outline" 
            className="text-[9px] px-1.5 py-0 h-4 bg-muted/30 border-muted-foreground/20"
          >
            {item.system_name}
          </Badge>
          <Badge 
            variant="outline" 
            className="text-[9px] px-1.5 py-0 h-4 bg-muted/30 border-muted-foreground/20"
          >
            {item.level_name}
          </Badge>
          {!isSubject && (
            <Badge 
              variant="secondary" 
              className="text-[9px] px-1.5 py-0 h-4 bg-primary/10 text-primary"
            >
              {item.subject_name}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
};

export default GlassSearchInput;
