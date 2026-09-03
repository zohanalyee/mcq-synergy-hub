import { supabase } from '@/integrations/supabase/client';
import { getEngagementKey } from '@/lib/announcementEngagement';

export type FeedFilter = 'all' | 'notices' | 'jobs' | 'scholarships' | 'blog';
export type FeedSort = 'latest' | 'trending';

export interface FeedItem {
  target_type: 'announcement' | 'job' | 'scholarship' | 'blog';
  target_id: string;
  slug: string | null;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  href: string;
  type_label: string | null;
  is_urgent: boolean;
  is_pinned: boolean;
  published_at: string | null;
  like_count: number;
  comment_count: number;
}

export interface Announcement {
  id: string;
  slug: string;
  title: string;
  body: string;
  summary: string | null;
  type: string;
  is_urgent: boolean;
  is_pinned: boolean;
  image_url: string | null;
  document_url: string | null;
  status: string;
  is_indexable: boolean;
  published_at: string | null;
  content_updated_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementTopic {
  id: string;
  topic_slug: string;
  topic_label: string;
  topic_kind: string;
}

export interface AnnouncementComment {
  id: string;
  target_type: string;
  target_id: string;
  user_id: string | null;
  guest_key: string | null;
  display_name: string;
  body: string;
  report_count: number;
  created_at: string;
}

const table = (name: string) => supabase.from(name as any);

export const fetchFeed = async (
  filter: FeedFilter,
  sort: FeedSort,
  limit = 20,
  offset = 0,
): Promise<FeedItem[]> => {
  const { data, error } = await supabase.rpc('get_announcement_feed' as any, {
    p_filter: filter,
    p_sort: sort,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  return (data || []) as unknown as FeedItem[];
};

export const fetchAnnouncementBySlug = async (slug: string): Promise<Announcement | null> => {
  const { data, error } = await table('announcements')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Announcement) ?? null;
};

export const fetchAnnouncementTopics = async (
  announcementId: string,
): Promise<AnnouncementTopic[]> => {
  const { data, error } = await table('announcement_topics')
    .select('id, topic_slug, topic_label, topic_kind')
    .eq('announcement_id', announcementId);
  if (error) throw error;
  return (data || []) as unknown as AnnouncementTopic[];
};

export const fetchRelatedAnnouncements = async (announcementId: string, limit = 5) => {
  const { data, error } = await supabase.rpc('get_related_announcements' as any, {
    p_announcement_id: announcementId,
    p_limit: limit,
  });
  if (error) throw error;
  return (data || []) as unknown as {
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    published_at: string | null;
  }[];
};

/* ---------------------------- engagement ---------------------------- */

export const fetchMyReactions = async (
  targets: { target_type: string; target_id: string }[],
): Promise<Set<string>> => {
  if (targets.length === 0) return new Set();
  const key = getEngagementKey();
  const { data: auth } = await supabase.auth.getUser();
  const ids = targets.map((t) => t.target_id);
  const { data, error } = await table('announcement_reactions')
    .select('target_type, target_id, user_id, guest_key')
    .in('target_id', ids);
  if (error) return new Set();
  const mine = (data || []).filter(
    (r: any) => (auth?.user && r.user_id === auth.user.id) || r.guest_key === key,
  );
  return new Set(mine.map((r: any) => `${r.target_type}:${r.target_id}`));
};

export const toggleReaction = async (
  target_type: string,
  target_id: string,
  liked: boolean,
): Promise<void> => {
  const key = getEngagementKey();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id ?? null;

  if (liked) {
    let q = table('announcement_reactions')
      .delete()
      .eq('target_type', target_type)
      .eq('target_id', target_id);
    q = userId ? q.eq('user_id', userId) : q.eq('guest_key', key);
    const { error } = await q;
    if (error) throw error;
    return;
  }

  const { error } = await table('announcement_reactions').insert({
    target_type,
    target_id,
    user_id: userId,
    guest_key: userId ? null : key,
  } as any);
  if (error) throw error;
};

export const fetchComments = async (
  target_type: string,
  target_id: string,
): Promise<AnnouncementComment[]> => {
  const { data, error } = await table('announcement_comments')
    .select('id, target_type, target_id, user_id, guest_key, display_name, body, report_count, created_at')
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []) as unknown as AnnouncementComment[];
};

export const postComment = async (input: {
  target_type: string;
  target_id: string;
  body: string;
  display_name: string;
}): Promise<void> => {
  const key = getEngagementKey();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id ?? null;

  const { error } = await table('announcement_comments').insert({
    target_type: input.target_type,
    target_id: input.target_id,
    user_id: userId,
    guest_key: key,
    display_name: input.display_name,
    body: input.body,
  } as any);
  if (error) throw error;
};

export const deleteOwnComment = async (id: string): Promise<void> => {
  const { error } = await table('announcement_comments').delete().eq('id', id);
  if (error) throw error;
};

export const reportComment = async (commentId: string, reason?: string): Promise<void> => {
  const { error } = await table('announcement_comment_reports').insert({
    comment_id: commentId,
    reporter_key: getEngagementKey(),
    reason: reason ?? null,
  } as any);
  if (error) throw error;
};

export const recordView = async (target_type: string, target_id: string): Promise<void> => {
  try {
    await table('announcement_views').insert({
      target_type,
      target_id,
      viewer_key: getEngagementKey(),
    } as any);
  } catch {
    /* views are best-effort */
  }
};

/* ------------------------------ admin ------------------------------- */

export const listAllAnnouncements = async (): Promise<Announcement[]> => {
  const { data, error } = await table('announcements')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as Announcement[];
};

export const saveAnnouncement = async (
  payload: Partial<Announcement>,
  topics: { topic_slug: string; topic_label: string; topic_kind: string }[],
): Promise<Announcement> => {
  const isUpdate = Boolean(payload.id);
  const query = isUpdate
    ? table('announcements').update(payload as any).eq('id', payload.id!).select('*').single()
    : table('announcements').insert(payload as any).select('*').single();

  const { data, error } = await query;
  if (error) throw error;
  const saved = data as unknown as Announcement;

  await table('announcement_topics').delete().eq('announcement_id', saved.id);
  if (topics.length > 0) {
    await table('announcement_topics').insert(
      topics.map((t) => ({ ...t, announcement_id: saved.id, source: 'auto' })) as any,
    );
  }
  return saved;
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  const { error } = await table('announcements').delete().eq('id', id);
  if (error) throw error;
};

export const adminSetCommentHidden = async (id: string, hidden: boolean): Promise<void> => {
  const { error } = await table('announcement_comments')
    .update({ is_hidden: hidden } as any)
    .eq('id', id);
  if (error) throw error;
};
