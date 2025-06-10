
import { useState, useEffect } from 'react';
import { ContentItem } from '@/interfaces/content';
import { supabase } from '@/integrations/supabase/client';
import { getAllContent } from '@/services/contentService';

export const useRealtimeContent = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial load
    loadContent();

    // Set up real-time subscription
    const channel = supabase
      .channel('content-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_items'
        },
        (payload) => {
          console.log('Real-time content change:', payload);
          // Reload content when changes occur
          loadContent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const allContent = await getAllContent();
      setContent(allContent);
      console.log('Content loaded/refreshed:', allContent.length, 'items');
    } catch (error) {
      console.error('Error loading content:', error);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const refreshContent = () => {
    loadContent();
  };

  return {
    content,
    loading,
    error,
    refreshContent
  };
};
