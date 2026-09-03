import { useMemo, useState } from 'react';
import { Megaphone, Flame, Clock } from 'lucide-react';
import Header from '@/components/Header';
import SEOHead from '@/components/SEOHead';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import FeedCard from '@/components/announcements/FeedCard';
import {
  PAGE_SIZE,
  useAnnouncementFeed,
  useAnnouncementRealtime,
  useMyReactions,
} from '@/hooks/useAnnouncementFeed';
import type { FeedFilter, FeedSort } from '@/services/announcementService';
import { cn } from '@/lib/utils';
import { safeJsonLd } from '@/lib/jsonLd';
import { SITE_ORIGIN } from '@/lib/seoUrls';

const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'notices', label: 'Notices' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'scholarships', label: 'Scholarships' },
  { key: 'blog', label: 'Blog' },
];

const Announcements = () => {
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [sort, setSort] = useState<FeedSort>('latest');
  const [page, setPage] = useState(0);

  useAnnouncementRealtime();
  const { data: items = [], isLoading } = useAnnouncementFeed(filter, sort, page);
  const { liked, setLiked } = useMyReactions(items);

  // Only the clean /announcements URL is indexable — filter/sort views are
  // noindex,follow so we never spawn duplicate crawlable permutations.
  const isFilteredView = filter !== 'all' || sort !== 'latest' || page > 0;

  const breadcrumbLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
        { '@type': 'ListItem', position: 2, name: 'Announcements', item: `${SITE_ORIGIN}/announcements` },
      ],
    }),
    [],
  );

  return (
    <Header>
      <SEOHead
        title="Announcements — Exam Notices, Jobs & Scholarship Updates Pakistan"
        description="Latest exam notices, test date changes, result announcements, government jobs and scholarship updates for Pakistani students — all in one live feed."
        keywords="exam notice Pakistan, test date announcement, MDCAT notice, PPSC announcement, scholarship updates, board result announcement"
        noindex={isFilteredView}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />

      <div className="max-w-4xl mx-auto px-4 pt-4 pb-10">
        <PageBreadcrumb
          items={[{ title: 'Announcements', href: '/announcements', isCurrent: true }]}
          showHomeButton
        />

        <PageHeader
          title="Announcements"
          icon={Megaphone}
          colorTheme="primary"
          tagline="Notices, jobs, scholarships & updates"
          description="Test date changes, exam notices, result announcements aur naye jobs/scholarships — sab ek hi feed mein. Like, comment aur share karein."
        />

        {/* Filters + sort */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? 'default' : 'outline'}
              onClick={() => {
                setFilter(f.key);
                setPage(0);
              }}
              className={cn('min-h-[44px] rounded-full px-3.5 text-xs')}
            >
              {f.label}
            </Button>
          ))}

          <div className="ml-auto flex gap-1">
            <Button
              size="sm"
              variant={sort === 'latest' ? 'secondary' : 'ghost'}
              onClick={() => {
                setSort('latest');
                setPage(0);
              }}
              className="min-h-[44px] gap-1 text-xs"
            >
              <Clock className="h-3.5 w-3.5" /> Latest
            </Button>
            <Button
              size="sm"
              variant={sort === 'trending' ? 'secondary' : 'ghost'}
              onClick={() => {
                setSort('trending');
                setPage(0);
              }}
              className="min-h-[44px] gap-1 text-xs"
            >
              <Flame className="h-3.5 w-3.5" /> Trending
            </Button>
          </div>
        </div>

        {/* Feed */}
        <div className="mt-4 space-y-3">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}

          {!isLoading && items.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/60 p-8 text-center">
              <Badge variant="outline" className="mb-2">
                Koi announcement nahi
              </Badge>
              <p className="text-sm text-muted-foreground">
                Is filter mein abhi kuch nahi hai. Latest jobs aur scholarships dekhein.
              </p>
            </div>
          )}

          {items.map((item) => {
            const key = `${item.target_type}:${item.target_id}`;
            return (
              <FeedCard
                key={key}
                item={item}
                liked={liked.has(key)}
                onLikedChange={(next) => {
                  setLiked((prev) => {
                    const copy = new Set(prev);
                    if (next) copy.add(key);
                    else copy.delete(key);
                    return copy;
                  });
                }}
              />
            );
          })}
        </div>

        {/* Pagination — real links, no infinite-scroll-only content */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="min-h-[44px]"
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">Page {page + 1}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={items.length < PAGE_SIZE}
            onClick={() => setPage((p) => p + 1)}
            className="min-h-[44px]"
          >
            Next
          </Button>
        </div>
      </div>
    </Header>
  );
};

export default Announcements;
