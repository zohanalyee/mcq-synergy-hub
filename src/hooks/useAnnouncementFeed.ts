import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchFeed,
  fetchMyReactions,
  type FeedFilter,
  type FeedItem,
  type FeedSort,
} from '@/services/announcementService';

export const PAGE_SIZE = 12;

export const useAnnouncementFeed = (filter: FeedFilter, sort: FeedSort, page: number) => {
  return useQuery({
    queryKey: ['announcement-feed', filter, sort, page],
    queryFn: () => fetchFeed(filter, sort, PAGE_SIZE, page * PAGE_SIZE),
    staleTime: 60_000,
  });
};

/** Which of the given items the current visitor (guest or signed-in) has liked. */
export const useMyReactions = (items: FeedItem[]) => {
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (items.length === 0) return;
    let active = true;
    fetchMyReactions(
      items.map((i) => ({ target_type: i.target_type, target_id: i.target_id })),
    ).then((set) => {
      if (active) setLiked(set);
    });
    return () => {
      active = false;
    };
  }, [items]);

  return { liked, setLiked };
};

/** Live like/comment counts while the feed is open. */
export const useAnnouncementRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('announcement-engagement')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcement_reactions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['announcement-feed'] });
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcement_comments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['announcement-feed'] });
          queryClient.invalidateQueries({ queryKey: ['announcement-comments'] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
