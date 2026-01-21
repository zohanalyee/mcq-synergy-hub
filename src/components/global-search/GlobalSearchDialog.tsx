import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, X, Loader2 } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { useGlobalSearch, type GlobalSearchResult } from '@/hooks/useGlobalSearch';
import { SearchResultItem } from './SearchResultItem';

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalSearchDialog = ({ open, onOpenChange }: GlobalSearchDialogProps) => {
  const navigate = useNavigate();
  const {
    query,
    setQuery,
    groupedResults,
    isLoading,
    recentSearches,
    saveToRecent,
    clearRecent,
    resetQuery,
    showResults,
    hasResults
  } = useGlobalSearch();

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      resetQuery();
    }
  }, [open, resetQuery]);

  const handleSelect = useCallback((result: GlobalSearchResult) => {
    saveToRecent(query);
    onOpenChange(false);
    
    if (result.result_type === 'subject') {
      // Navigate to subject content page
      navigate(`/subjects/${result.id}`);
    } else {
      // Navigate to subject with topic highlighted
      navigate(`/subjects/${result.subject_id}?topic=${result.id}`);
    }
  }, [navigate, onOpenChange, saveToRecent, query]);

  const handleRecentSearch = useCallback((searchTerm: string) => {
    setQuery(searchTerm);
  }, [setQuery]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search subjects and topics..."
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        />
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      
      <CommandList>
        {/* Empty state when searching */}
        {showResults && !hasResults && !isLoading && (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-6">
              <Search className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
              <p className="text-xs text-muted-foreground/70">Try searching with different keywords</p>
            </div>
          </CommandEmpty>
        )}

        {/* Recent searches when no query */}
        {!showResults && recentSearches.length > 0 && (
          <CommandGroup heading={
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Recent Searches
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearRecent();
                }}
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          }>
            {recentSearches.map((search, index) => (
              <CommandItem
                key={`recent-${index}`}
                value={`recent-${search}`}
                onSelect={() => handleRecentSearch(search)}
                className="cursor-pointer"
              >
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                {search}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Search results */}
        {showResults && hasResults && (
          <>
            {groupedResults.subjects.length > 0 && (
              <CommandGroup heading="Subjects">
                {groupedResults.subjects.map((result) => (
                  <SearchResultItem
                    key={`subject-${result.id}`}
                    result={result}
                    onSelect={handleSelect}
                  />
                ))}
              </CommandGroup>
            )}

            {groupedResults.subjects.length > 0 && groupedResults.topics.length > 0 && (
              <CommandSeparator />
            )}

            {groupedResults.topics.length > 0 && (
              <CommandGroup heading="Topics">
                {groupedResults.topics.map((result) => (
                  <SearchResultItem
                    key={`topic-${result.id}`}
                    result={result}
                    onSelect={handleSelect}
                  />
                ))}
              </CommandGroup>
            )}
          </>
        )}

        {/* Initial state - prompt to search */}
        {!showResults && recentSearches.length === 0 && (
          <div className="py-6 text-center">
            <Search className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Start typing to search...</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Search for subjects or topics across all boards and classes</p>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
};
