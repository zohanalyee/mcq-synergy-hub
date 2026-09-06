import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Building2, Calendar, MapPin, Pin } from 'lucide-react';
import { differenceInCalendarDays, format } from 'date-fns';
import EngagementBar from './EngagementBar';
import type { FeedItem } from '@/services/announcementService';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/utils/analytics';
import { stripMarkdown } from '@/lib/markdownText';

const TYPE_META: Record<string, { label: string; className: string }> = {
  announcement: { label: 'Notice', className: 'bg-brand-gradient text-white border-transparent' },
  job: { label: 'Job', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  scholarship: { label: 'Scholarship', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  blog: { label: 'Blog', className: 'bg-primary/15 text-primary' },
};

interface FeedCardProps {
  item: FeedItem;
  liked: boolean;
  onLikedChange: (liked: boolean) => void;
}

/** "N days left" / "Closing soon" / "Closed" chip state for a deadline. */
const getDeadlineState = (deadline: string) => {
  const days = differenceInCalendarDays(new Date(deadline), new Date());
  if (days < 0) return { label: 'Closed', className: 'text-muted-foreground' };
  if (days === 0) return { label: 'Last day', className: 'text-rose-600 dark:text-rose-400' };
  if (days <= 3)
    return {
      label: `${days} day${days === 1 ? '' : 's'} left`,
      className: 'text-rose-600 dark:text-rose-400',
    };
  return { label: `${days} days left`, className: 'text-muted-foreground' };
};

const FeedCard = ({ item, liked, onLikedChange }: FeedCardProps) => {
  const meta = TYPE_META[item.target_type] ?? TYPE_META.announcement;
  const isOpportunity = item.target_type === 'job' || item.target_type === 'scholarship';
  const deadlineState = item.deadline_date ? getDeadlineState(item.deadline_date) : null;

  return (
    <Card
      className={cn(
        'overflow-hidden border-border/60 bg-card/70 backdrop-blur-sm transition-shadow hover:shadow-md',
        item.is_urgent && 'border-rose-500/50 ring-1 ring-rose-500/20',
      )}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="outline" className={cn('text-[11px] font-medium', meta.className)}>
            {meta.label}
          </Badge>
          {isOpportunity && item.target_type === 'job' && item.sector && (
            <Badge
              variant="outline"
              className="text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            >
              {item.sector === 'government' ? 'Govt' : 'Private'}
            </Badge>
          )}
          {isOpportunity && item.target_type === 'scholarship' && item.scholarship_scope && (
            <Badge
              variant="outline"
              className="text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400"
            >
              {item.scholarship_scope === 'international' ? 'International' : 'National'}
            </Badge>
          )}
          {item.is_pinned && (
            <Badge variant="outline" className="gap-1 text-[11px]">
              <Pin className="h-3 w-3" /> Pinned
            </Badge>
          )}
          {item.is_urgent && (
            <Badge variant="outline" className="gap-1 border-rose-500/40 text-[11px] text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-3 w-3" /> Urgent
            </Badge>
          )}
          {item.published_at && (
            <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(item.published_at), 'd MMM yyyy')}
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <Link
            to={item.href}
            onClick={() => trackEvent('announcement_open', { target_type: item.target_type })}
            className="block group min-w-0 flex-1"
          >
            <h2 className="text-base sm:text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
              {item.title}
            </h2>

            {isOpportunity && (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {item.organization && (
                  <span className="inline-flex items-center gap-1 min-w-0">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.organization}</span>
                  </span>
                )}
                {item.location && (
                  <span className="inline-flex items-center gap-1 min-w-0">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </span>
                )}
                {item.deadline_date && deadlineState && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {format(new Date(item.deadline_date), 'd MMM yyyy')}
                    <span className={cn('font-medium', deadlineState.className)}>
                      · {deadlineState.label}
                    </span>
                  </span>
                )}
              </div>
            )}

            {item.excerpt && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.excerpt}</p>
            )}
          </Link>

          {isOpportunity && item.image_url && (
            <Link to={item.href} className="hidden sm:block shrink-0 self-start">
              <img
                src={item.image_url}
                alt={item.title}
                loading="lazy"
                className="h-20 w-28 rounded-lg border border-border/50 object-cover"
              />
            </Link>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-1">
          <EngagementBar
            targetType={item.target_type}
            targetId={item.target_id}
            href={item.href}
            title={item.title}
            likeCount={Number(item.like_count) || 0}
            commentCount={Number(item.comment_count) || 0}
            liked={liked}
            onLikedChange={onLikedChange}
            onCommentClick={() => {
              window.location.assign(`${item.href}#comments`);
            }}
            compact
          />
          <Link
            to={item.href}
            className="text-xs font-medium text-primary hover:underline min-h-[44px] flex items-center px-1"
          >
            {isOpportunity ? 'View details' : 'Read more'}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedCard;
