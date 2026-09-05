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

/**
 * Live like/comment counts while the feed is open.
 *
 * Narrowed (perf): instead of invalidating the whole feed on ANY site-wide
 * reaction/comment change, we only react to changes that touch one of the
 * announcements currently visible on screen, and we patch that item's counter
 * in the cache directly — no refetch at all.
 */
export const useAnnouncementRealtime = (items: FeedItem[] = []) => {
  const queryClient = useQueryClient();

  // Stable membership key so the channel isn't torn down on every render.
  const visibleKey = items.map((i) => i.target_id).sort().join(',');

  useEffect(() => {
    const visible = new Set(visibleKey ? visibleKey.split(',') : []);
    if (visible.size === 0) return;

    const patchCount = (
      targetId: string,
      field: 'like_count' | 'comment_count',
      delta: number,
    ) => {
      queryClient.setQueriesData<FeedItem[]>({ queryKey: ['announcement-feed'] }, (old) => {
        if (!old) return old;
        let touched = false;
        const next = old.map((item) => {
          if (item.target_id !== targetId) return item;
          touched = true;
          return { ...item, [field]: Math.max(0, (item[field] ?? 0) + delta) };
        });
        return touched ? next : old;
      });
    };

    const rowId = (payload: any) =>
      (payload?.new?.target_id ?? payload?.old?.target_id) as string | undefined;

    const deltaFor = (payload: any) =>
      payload?.eventType === 'INSERT' ? 1 : payload?.eventType === 'DELETE' ? -1 : 0;

    const channel = supabase
      .channel('announcement-engagement')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcement_reactions' },
        (payload) => {
          const id = rowId(payload);
          if (!id || !visible.has(id)) return;
          patchCount(id, 'like_count', deltaFor(payload));
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcement_comments' },
        (payload) => {
          const id = rowId(payload);
          if (!id || !visible.has(id)) return;
          patchCount(id, 'comment_count', deltaFor(payload));
          const type = (payload as any)?.new?.target_type ?? (payload as any)?.old?.target_type;
          if (type) {
            queryClient.invalidateQueries({ queryKey: ['announcement-comments', type, id] });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, visibleKey]);
};

