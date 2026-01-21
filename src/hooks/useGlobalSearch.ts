import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  searchGlobal, 
  groupSearchResults, 
  getRecentSearches, 
  addRecentSearch, 
  clearRecentSearches,
  type GlobalSearchResult,
  type GroupedSearchResults
} from '@/services/globalSearchService';

export const useGlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Debounce the search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Fetch search results
  const { data: results = [], isLoading, error } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: () => searchGlobal(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 60000, // Keep in cache for 1 minute
  });

  // Group results by type
  const groupedResults: GroupedSearchResults = useMemo(() => {
    return groupSearchResults(results);
  }, [results]);

  // Save search to recent when user selects a result
  const saveToRecent = useCallback((searchQuery: string) => {
    addRecentSearch(searchQuery);
    setRecentSearches(getRecentSearches());
  }, []);

  // Clear recent searches
  const clearRecent = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  // Reset query
  const resetQuery = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  return {
    query,
    setQuery,
    results,
    groupedResults,
    isLoading: isLoading && debouncedQuery.length >= 2,
    error,
    recentSearches,
    saveToRecent,
    clearRecent,
    resetQuery,
    hasResults: results.length > 0,
    showResults: debouncedQuery.length >= 2
  };
};

export type { GlobalSearchResult, GroupedSearchResults };
