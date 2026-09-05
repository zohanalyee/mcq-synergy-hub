import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import EngagementBar from './EngagementBar';
import CommentThread from './CommentThread';
import {
  fetchComments,
  fetchLikeCount,
  fetchMyReactions,
} from '@/services/announcementService';

interface EngagementSectionProps {
  /** 'job' | 'scholarship' | 'blog' | 'announcement' */
  targetType: string;
  targetId: string;
  /** Canonical in-app path of this item (used for share links). */
  href: string;
  title: string;
  prompt?: string;
}

/**
 * Likes + comments + share for aggregated feed items (jobs, scholarships,
 * blog posts). Reuses the same tables and components as announcement notices,
 * so a click from /announcements lands on the canonical page and still gets
 * the full engagement UI.
 */
const EngagementSection = ({
  targetType,
  targetId,
  href,
  title,
  prompt,
}: EngagementSectionProps) => {
  const [liked, setLiked] = useState(false);

  const { data: likeCount = 0 } = useQuery({
    queryKey: ['announcement-likes', targetType, targetId],
    queryFn: () => fetchLikeCount(targetType, targetId),
    enabled: !!targetId,
    staleTime: 60_000,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['announcement-comments', targetType, targetId],
    queryFn: () => fetchComments(targetType, targetId),
    enabled: !!targetId,
  });

  useEffect(() => {
    if (!targetId) return;
    fetchMyReactions([{ target_type: targetType, target_id: targetId }]).then((set) =>
      setLiked(set.has(`${targetType}:${targetId}`)),
    );
  }, [targetType, targetId]);

  if (!targetId) return null;

  return (
    <section className="mt-8">
      <div className="border-y border-border/50 py-1">
        <EngagementBar
          targetType={targetType}
          targetId={targetId}
          href={href}
          title={title}
          likeCount={likeCount}
          commentCount={comments.length}
          liked={liked}
          onLikedChange={setLiked}
          onCommentClick={() =>
            document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })
          }
        />
      </div>
      <CommentThread targetType={targetType} targetId={targetId} prompt={prompt} />
    </section>
  );
};

export default EngagementSection;
