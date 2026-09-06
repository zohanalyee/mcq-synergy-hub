import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertTriangle,
  Building,
  Building2,
  Calendar,
  Clock,
  Globe,
  Hourglass,
  MapPin,
  Pin,
} from 'lucide-react';
import { differenceInCalendarDays, format } from 'date-fns';
import EngagementBar from './EngagementBar';
import type { FeedItem } from '@/services/announcementService';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/utils/analytics';
import { stripMarkdown } from '@/lib/markdownText';
import { generateSlugUrl } from '@/utils/slugify';

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

/** Pastel pill styling shared with the Jobs / Scholarships pages. */
const pillBase =
  'rounded-full px-2.5 py-0.5 text-[10px] font-semibold gap-1 border-0 inline-flex items-center';

const REGION_LABELS: Record<string, string> = {
  sindh: 'Sindh',
  punjab: 'Punjab',
  kpk: 'KPK',
  balochistan: 'Balochistan',
  federal: 'Federal',
  international: 'International',
};

/** Deadline pill tiers — same thresholds as the Jobs page cards. */
const getDeadlineMeta = (dateString: string | null) => {
  if (!dateString) return null;
  const days = differenceInCalendarDays(new Date(dateString), new Date());
  if (days < 0)
    return {
      label: 'Closed',
      Icon: Calendar,
      className: 'bg-muted/60 text-muted-foreground line-through',
    };
  if (days <= 7)
    return {
      label: days === 0 ? 'Last day' : `${days}d left`,
      Icon: Hourglass,
      className:
        'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/50',
    };
  if (days <= 30)
    return {
      label: `${days}d left`,
      Icon: Clock,
      className:
        'bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-900/50',
    };
  return {
    label: `Deadline: ${format(new Date(dateString), 'd MMM yyyy')}`,
    Icon: Calendar,
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  };
};

const FeedCard = ({ item, liked, onLikedChange }: FeedCardProps) => {
  const meta = TYPE_META[item.target_type] ?? TYPE_META.announcement;
  const isOpportunity = item.target_type === 'job' || item.target_type === 'scholarship';
  const dl = isOpportunity ? getDeadlineMeta(item.deadline_date ?? null) : null;
  const isNew =
    !!item.published_at &&
    (Date.now() - new Date(item.published_at).getTime()) / 86400000 <= 7;

  // Opportunities open the rich, fully formatted detail page.
  const href = isOpportunity
    ? `/opportunity/${generateSlugUrl(item.title, item.target_id)}`
    : item.href;

  if (isOpportunity) {
    return (
      <Card
        className={cn(
          'group relative h-full overflow-hidden border border-border/60',
          'bg-gradient-to-br from-background via-background to-primary/5',
          'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/10',
          'hover:border-primary/40 hover:ring-1 hover:ring-primary/20',
        )}
      >
        <Link
          to={href}
          onClick={() => trackEvent('announcement_open', { target_type: item.target_type })}
          aria-label={`View details for ${item.title}`}
          className="absolute inset-0 z-10 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        />
        <div className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-3xl opacity-30 transition-opacity duration-500 group-hover:opacity-100" />

        <CardContent className="relative p-3 sm:p-4">
          <div className="flex items-start gap-3 min-w-0">
            {/* Squircle thumbnail — visible on mobile too */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-white p-1 shadow-sm dark:bg-white/95">
              <img
                src={item.image_url || '/placeholder.svg'}
                alt={item.title}
                loading="lazy"
                className="h-full w-full rounded-lg object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className={cn('text-[10px] font-semibold', meta.className)}>
                  {meta.label}
                </Badge>
                {item.target_type === 'job' && item.sector && (
                  <Badge
                    className={cn(
                      pillBase,
                      item.sector === 'government'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
                    )}
                  >
                    <Building className="h-3 w-3" />
                    {item.sector === 'government' ? 'Govt' : 'Private'}
                  </Badge>
                )}
                {item.target_type === 'scholarship' && item.scholarship_scope && (
                  <Badge
                    className={cn(
                      pillBase,
                      item.scholarship_scope === 'international'
                        ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
                    )}
                  >
                    <Globe className="h-3 w-3" />
                    {item.scholarship_scope === 'international' ? 'International' : 'National'}
                  </Badge>
                )}
                {item.region && item.region !== 'other' && (
                  <Badge
                    className={cn(
                      pillBase,
                      item.region === 'international'
                        ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
                    )}
                  >
                    <MapPin className="h-3 w-3" />
                    {REGION_LABELS[item.region] || item.region}
                  </Badge>
                )}
                {isNew && (
                  <Badge className={cn(pillBase, 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300')}>
                    New
                  </Badge>
                )}
                {item.is_pinned && (
                  <Badge variant="outline" className="gap-1 text-[10px]">
                    <Pin className="h-3 w-3" /> Pinned
                  </Badge>
                )}
              </div>

              <h2 className="text-base font-semibold leading-snug transition-colors group-hover:text-primary sm:text-lg">
                {item.title}
              </h2>

              <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                {item.organization && (
                  <p className="flex items-center gap-1.5 min-w-0">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.organization}</span>
                  </p>
                )}
                {item.location && (
                  <p className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </p>
                )}
              </div>

              {item.excerpt && (
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                  {stripMarkdown(item.excerpt)}
                </p>
              )}
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/50 pt-1.5">
            <div className="relative z-20 flex items-center gap-2 min-w-0">
              <EngagementBar
                targetType={item.target_type}
                targetId={item.target_id}
                href={href}
                title={item.title}
                likeCount={Number(item.like_count) || 0}
                commentCount={Number(item.comment_count) || 0}
                liked={liked}
                onLikedChange={onLikedChange}
                onCommentClick={() => {
                  window.location.assign(`${href}#comments`);
                }}
                compact
              />
            </div>
            {dl && (
              <span className={cn(pillBase, 'shrink-0 px-2.5 py-1 text-[11px]', dl.className)}>
                <dl.Icon className="h-3 w-3" />
                {dl.label}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

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

        <Link
          to={href}
          onClick={() => trackEvent('announcement_open', { target_type: item.target_type })}
          className="block group min-w-0"
        >
          <h2 className="text-base sm:text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
            {item.title}
          </h2>
          {item.excerpt && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{stripMarkdown(item.excerpt)}</p>
          )}
        </Link>

        <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-1">
          <EngagementBar
            targetType={item.target_type}
            targetId={item.target_id}
            href={href}
            title={item.title}
            likeCount={Number(item.like_count) || 0}
            commentCount={Number(item.comment_count) || 0}
            liked={liked}
            onLikedChange={onLikedChange}
            onCommentClick={() => {
              window.location.assign(`${href}#comments`);
            }}
            compact
          />
          <Link
            to={href}
            className="text-xs font-medium text-primary hover:underline min-h-[44px] flex items-center px-1"
          >
            Read more
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedCard;
