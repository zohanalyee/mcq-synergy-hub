import { useState } from 'react';
import { Heart, MessageCircle, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { toggleReaction } from '@/services/announcementService';
import { absoluteUrl } from '@/lib/seoUrls';
import { trackEvent } from '@/utils/analytics';

interface EngagementBarProps {
  targetType: string;
  targetId: string;
  href: string;
  title: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  onLikedChange: (liked: boolean) => void;
  onCommentClick?: () => void;
  compact?: boolean;
}

const EngagementBar = ({
  targetType,
  targetId,
  href,
  title,
  likeCount,
  commentCount,
  liked,
  onLikedChange,
  onCommentClick,
  compact = false,
}: EngagementBarProps) => {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localCount, setLocalCount] = useState<number | null>(null);

  const count = localCount ?? likeCount;

  const handleLike = async () => {
    if (busy) return;
    setBusy(true);
    const next = !liked;
    setLocalCount(count + (next ? 1 : -1));
    onLikedChange(next);
    try {
      await toggleReaction(targetType, targetId, liked);
      trackEvent('announcement_like', { target_type: targetType, liked: next });
    } catch (error: any) {
      setLocalCount(count);
      onLikedChange(liked);
      toast.error(
        String(error?.message || '').includes('Rate limit')
          ? 'Thoda intezaar karein — bohat zyada likes.'
          : 'Like save nahi hua. Dobara koshish karein.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    const url = absoluteUrl(href);
    trackEvent('announcement_share', { target_type: targetType });
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackEvent('announcement_copy_link', { target_type: targetType });
      toast.success('Link copy ho gaya');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Link copy nahi hua');
    }
  };

  return (
    <div className={cn('flex items-center gap-1', compact ? 'text-xs' : 'text-sm')}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleLike}
        disabled={busy}
        aria-pressed={liked}
        aria-label={liked ? 'Unlike' : 'Like'}
        className={cn(
          'min-h-[44px] gap-1.5 px-2.5',
          liked ? 'text-rose-500 hover:text-rose-600' : 'text-muted-foreground',
        )}
      >
        <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
        <span className="tabular-nums">{count}</span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onCommentClick}
        aria-label="Comments"
        className="min-h-[44px] gap-1.5 px-2.5 text-muted-foreground"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="tabular-nums">{commentCount}</span>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleShare}
        aria-label="Share"
        className="min-h-[44px] gap-1.5 px-2.5 text-muted-foreground"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
        <span className="hidden sm:inline">Share</span>
      </Button>
    </div>
  );
};

export default EngagementBar;
