import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  FileText,
  Megaphone,
  RefreshCw,
} from 'lucide-react';
import Header from '@/components/Header';
import SEOHead from '@/components/SEOHead';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import EngagementBar from '@/components/announcements/EngagementBar';
import CommentThread from '@/components/announcements/CommentThread';
import {
  fetchAnnouncementBySlug,
  fetchAnnouncementTopics,
  fetchComments,
  fetchMyReactions,
  fetchRelatedAnnouncements,
  recordView,
} from '@/services/announcementService';
import { resourcesForTopics } from '@/lib/announcementEngagement';
import { safeJsonLd } from '@/lib/jsonLd';
import { SITE_ORIGIN } from '@/lib/seoUrls';
import { trackEvent } from '@/utils/analytics';
import { useState } from 'react';

const AnnouncementDetail = () => {
  const { slug = '' } = useParams();

  const { data: announcement, isLoading } = useQuery({
    queryKey: ['announcement', slug],
    queryFn: () => fetchAnnouncementBySlug(slug),
    enabled: !!slug,
  });

  const id = announcement?.id;

  const { data: topics = [] } = useQuery({
    queryKey: ['announcement-topics', id],
    queryFn: () => fetchAnnouncementTopics(id!),
    enabled: !!id,
  });

  const { data: related = [] } = useQuery({
    queryKey: ['announcement-related', id],
    queryFn: () => fetchRelatedAnnouncements(id!, 5),
    enabled: !!id,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['announcement-comments', 'announcement', id],
    queryFn: () => fetchComments('announcement', id!),
    enabled: !!id,
  });

  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!id) return;
    recordView('announcement', id);
    trackEvent('announcement_view', { slug });
    fetchMyReactions([{ target_type: 'announcement', target_id: id }]).then((set) =>
      setLiked(set.has(`announcement:${id}`)),
    );
  }, [id, slug]);

  const resources = useMemo(
    () => resourcesForTopics(topics.map((t) => t.topic_slug), 6),
    [topics],
  );

  const jsonLd = useMemo(() => {
    if (!announcement) return null;
    const url = `${SITE_ORIGIN}/announcements/${announcement.slug}`;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: announcement.title,
        description: announcement.meta_description || announcement.summary || undefined,
        datePublished: announcement.published_at || announcement.created_at,
        dateModified: announcement.content_updated_at || announcement.updated_at,
        mainEntityOfPage: url,
        author: { '@type': 'Organization', name: 'MCQsAI' },
        publisher: { '@type': 'Organization', name: 'MCQsAI', url: SITE_ORIGIN },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_ORIGIN },
          { '@type': 'ListItem', position: 2, name: 'Announcements', item: `${SITE_ORIGIN}/announcements` },
          { '@type': 'ListItem', position: 3, name: announcement.title, item: url },
        ],
      },
    ];
  }, [announcement]);

  if (isLoading) {
    return (
      <Header>
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Header>
    );
  }

  if (!announcement) {
    return (
      <Header>
        <SEOHead title="Announcement not found" noindex />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-xl font-semibold">Announcement not found</h1>
          <Link to="/announcements" className="mt-3 inline-block text-primary hover:underline">
            Back to all announcements
          </Link>
        </div>
      </Header>
    );
  }

  const updated =
    announcement.content_updated_at &&
    announcement.published_at &&
    new Date(announcement.content_updated_at) > new Date(announcement.published_at);

  return (
    <Header>
      <SEOHead
        title={announcement.meta_title || announcement.title}
        description={
          announcement.meta_description ||
          announcement.summary ||
          announcement.body.replace(/<[^>]*>/g, ' ').slice(0, 155)
        }
        image={announcement.og_image_url || undefined}
        type="article"
        noindex={!announcement.is_indexable}
      />
      {jsonLd && announcement.is_indexable && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      )}

      <article className="max-w-3xl mx-auto px-4 pt-4 pb-10">
        <PageBreadcrumb
          items={[
            { title: 'Announcements', href: '/announcements' },
            { title: announcement.title, href: `/announcements/${announcement.slug}`, isCurrent: true },
          ]}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 bg-brand-gradient text-white border-transparent text-[11px]">
            <Megaphone className="h-3 w-3" /> Notice
          </Badge>
          {announcement.is_urgent && (
            <Badge variant="outline" className="gap-1 border-rose-500/40 text-[11px] text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-3 w-3" /> Urgent
            </Badge>
          )}
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(announcement.published_at || announcement.created_at), 'd MMMM yyyy')}
          </span>
          {updated && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <RefreshCw className="h-3 w-3" /> Updated{' '}
              {format(new Date(announcement.content_updated_at!), 'd MMM yyyy')}
            </span>
          )}
        </div>

        <h1 className="mt-2 text-2xl sm:text-3xl font-bold leading-tight">{announcement.title}</h1>

        {announcement.summary && (
          <p className="mt-2 text-base text-muted-foreground">{announcement.summary}</p>
        )}

        {announcement.image_url && (
          <img
            src={announcement.image_url}
            alt={announcement.title}
            width={1200}
            height={630}
            loading="lazy"
            className="mt-4 w-full rounded-xl border border-border/60 object-cover"
          />
        )}

        <div
          className="prose prose-sm sm:prose-base dark:prose-invert mt-4 max-w-none"
          dangerouslySetInnerHTML={{ __html: announcement.body }}
        />

        {announcement.document_url && (
          <a
            href={announcement.document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border/60 px-3 text-sm font-medium text-primary hover:bg-muted/50"
          >
            <FileText className="h-4 w-4" /> Official notification (PDF)
          </a>
        )}

        {topics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <Badge key={t.id} variant="secondary" className="text-[11px]">
                {t.topic_label}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-4 border-y border-border/50 py-1">
          <EngagementBar
            targetType="announcement"
            targetId={announcement.id}
            href={`/announcements/${announcement.slug}`}
            title={announcement.title}
            likeCount={0}
            commentCount={comments.length}
            liked={liked}
            onLikedChange={setLiked}
            onCommentClick={() =>
              document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })
            }
          />
        </div>

        {/* Prepare for this exam — converts info traffic into practice traffic */}
        {resources.length > 0 && (
          <Card className="mt-6 border-border/60 bg-card/70">
            <CardContent className="p-4">
              <h2 className="text-base font-semibold">Prepare for this</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Is announcement se related practice aur study resources.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {resources.map((r) => (
                  <Link
                    key={r.href}
                    to={r.href}
                    onClick={() => trackEvent('announcement_related_click', { href: r.href })}
                    className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg border border-border/50 px-3 text-sm font-medium hover:border-primary/40 hover:text-primary"
                  >
                    {r.title}
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {related.length > 0 && (
          <section className="mt-6">
            <h2 className="text-base font-semibold">Related announcements</h2>
            <ul className="mt-2 space-y-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/announcements/${r.slug}`}
                    className="flex min-h-[44px] items-center gap-2 rounded-lg border border-border/50 px-3 text-sm hover:border-primary/40 hover:text-primary"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <CommentThread
          targetType="announcement"
          targetId={announcement.id}
          prompt={
            announcement.is_urgent
              ? 'Is notice ke baare mein aap ki kya raay hai?'
              : 'Kya aap is exam ki tayyari kar rahe hain? Apna experience share karein.'
          }
        />
      </article>
    </Header>
  );
};

export default AnnouncementDetail;
