import { supabase } from "@/integrations/supabase/client";

export interface GlobalSearchResult {
  result_type: 'subject' | 'topic';
  id: string;
  name: string;
  subject_id: string;
  subject_name: string;
  level_id: string;
  level_name: string;
  system_id: string;
  system_name: string;
  system_type: 'academic' | 'job';
  topic_count: number;
}

export interface GroupedSearchResults {
  subjects: GlobalSearchResult[];
  topics: GlobalSearchResult[];
}

export const searchGlobal = async (
  query: string,
  limit: number = 20
): Promise<GlobalSearchResult[]> => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const { data, error } = await supabase.rpc('global_context_search', {
    search_query: query.trim(),
    result_limit: limit
  });

  if (error) {
    console.error('Global search error:', error);
    throw error;
  }

  return (data || []) as GlobalSearchResult[];
};

export const groupSearchResults = (results: GlobalSearchResult[]): GroupedSearchResults => {
  return {
    subjects: results.filter(r => r.result_type === 'subject'),
    topics: results.filter(r => r.result_type === 'topic')
  };
};

// Recent searches management
const RECENT_SEARCHES_KEY = 'global_search_recent';
const MAX_RECENT_SEARCHES = 5;

export const getRecentSearches = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const addRecentSearch = (query: string): void => {
  if (!query || query.trim().length < 2) return;
  
  try {
    const recent = getRecentSearches();
    const filtered = recent.filter(s => s.toLowerCase() !== query.toLowerCase());
    const updated = [query.trim(), ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
};

export const clearRecentSearches = (): void => {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore localStorage errors
  }
};
