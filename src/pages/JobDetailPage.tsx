import { safeJsonLd } from '@/lib/jsonLd';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, Calendar, ExternalLink, ArrowLeft, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import RelatedContent from '@/components/seo/related/RelatedContent';
import NotFound from '@/pages/NotFound';
import { mailtoForEmailHref, isBareEmailHref } from '@/lib/markdownSanitize';
import EngagementSection from '@/components/announcements/EngagementSection';

const JobDetailPage = () => {
  const { jobSlug } = useParams<{ jobSlug: string }>();

  const { data: job, isLoading } = useQuery({
    queryKey: ['job-detail', jobSlug],
    queryFn: async () => {
      // Try content_items first
      const { data: ci } = await supabase
        .from('content_items')
        .select('*')
        .eq('category', 'job')
        .eq('status', 'approved')
        .limit(100);

      const slug = jobSlug?.toLowerCase();
      const fromCI = ci?.find(item => {
        const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return itemSlug === slug;
      });
      if (fromCI) return { source: 'content_items' as const, ...fromCI };

      // Try external_opportunities
      const { data: eo } = await supabase
        .from('external_opportunities')
        .select('*')
        .eq('type', 'job')
        .eq('status', 'approved')
        .limit(200);

      const fromEO = eo?.find(item => {
        const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return itemSlug === slug;
      });
      if (fromEO) return { source: 'external' as const, ...fromEO };

      return null;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!jobSlug,
  });

  if (isLoading) {
    return (
      <Header>
        <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Footer />
      </Header>
    );
  }

  if (!job) return <NotFound />;

  const title = job.title;
  const description = job.description || '';
  const location = job.location || 'Pakistan';
  const org = job.source === 'external' ? (job as any).organization : (job as any).department;
  const applyUrl = job.source === 'external' ? (job as any).apply_url : (job as any).apply_link;
  const deadline = job.source === 'external' ? (job as any).deadline_date : (job as any).deadline;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title,
    description,
    hiringOrganization: { '@type': 'Organization', name: org || 'Government of Pakistan' },
    jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressCountry: 'PK', addressLocality: location } },
    ...(deadline && { validThrough: deadline }),
    employmentType: 'FULL_TIME',
  };

  return (
    <Header>
      <SEOHead
        title={`${title} 2026 — Apply Online, Test Preparation`}
        description={`Apply online for ${title}${org ? ` at ${org}` : ''}. Eligibility, last date, test syllabus & free MCQ preparation — MCQsAI Pakistan.`}
        keywords={`${title}, ${title} 2026, ${title} apply online, ${title} test preparation, Pakistan government jobs, ${org || ''}`}
        url={`https://mcqsai.com/jobs/${jobSlug}`}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <BreadcrumbSchema items={[
        { name: 'Home', path: '/' },
        { name: 'Jobs', path: '/jobs' },
        { name: title, path: `/jobs/${jobSlug}` },
      ]} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/jobs" className="hover:text-primary">Jobs</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{title}</span>
        </nav>

        <Link to="/jobs" className="inline-flex items-center text-sm text-primary mb-4 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Jobs
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{title}</h1>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
          {org && (
            <span className="flex items-center gap-1">
              <Building2 className="w-4 h-4" /> {org}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" /> {location}
          </span>
          {deadline && (
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Deadline: {new Date(deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 prose prose-sm dark:prose-invert max-w-none">
            <p>{description || 'No additional details available for this position.'}</p>
          </CardContent>
        </Card>

        {applyUrl && (
          <Button asChild>
            <a href={mailtoForEmailHref(applyUrl)} {...(isBareEmailHref(applyUrl) ? { rel: "nofollow" } : { target: "_blank", rel: "noopener noreferrer" })}>
              <Briefcase className="w-4 h-4 mr-2" />
              Apply Now
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        )}

        <EngagementSection
          targetType="job"
          targetId={job.id}
          href={`/jobs/${jobSlug}`}
          title={title}
          prompt="Is job ke baare mein sawal ya update? Neeche share karein."
        />

        <RelatedContent entitySlug="jobs-hub" title="Prepare for the Test" />
      </div>
      <Footer />
    </Header>
  );
};

export default JobDetailPage;
