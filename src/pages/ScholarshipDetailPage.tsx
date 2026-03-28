import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, MapPin, Calendar, ExternalLink, ArrowLeft, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import NotFound from '@/pages/NotFound';

const ScholarshipDetailPage = () => {
  const { scholarshipSlug } = useParams<{ scholarshipSlug: string }>();

  const { data: scholarship, isLoading } = useQuery({
    queryKey: ['scholarship-detail', scholarshipSlug],
    queryFn: async () => {
      const slug = scholarshipSlug?.toLowerCase();

      // Try content_items
      const { data: ci } = await supabase
        .from('content_items')
        .select('*')
        .eq('category', 'scholarship')
        .eq('status', 'approved')
        .limit(100);

      const fromCI = ci?.find(item => {
        const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return itemSlug === slug;
      });
      if (fromCI) return { source: 'content_items' as const, ...fromCI };

      // Try external_opportunities
      const { data: eo } = await supabase
        .from('external_opportunities')
        .select('*')
        .eq('type', 'scholarship')
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
    enabled: !!scholarshipSlug,
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

  if (!scholarship) return <NotFound />;

  const title = scholarship.title;
  const description = scholarship.description || '';
  const location = scholarship.location || 'Pakistan';
  const org = scholarship.source === 'external' ? (scholarship as any).organization : (scholarship as any).institution;
  const applyUrl = scholarship.source === 'external' ? (scholarship as any).apply_url : (scholarship as any).apply_link;
  const deadline = scholarship.source === 'external' ? (scholarship as any).deadline_date : (scholarship as any).deadline;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Scholarship',
    name: title,
    description,
    provider: { '@type': 'Organization', name: org || 'MCQsAI' },
    ...(deadline && { applicationDeadline: deadline }),
    areaServed: { '@type': 'Country', name: 'Pakistan' },
  };

  return (
    <Header>
      <SEOHead
        title={`${title} - Scholarship`}
        description={`Apply for ${title}. ${description.slice(0, 120)}`}
        keywords={`${title}, Pakistan scholarships, education funding, ${org || ''}`}
        url={`https://mcqsai.com/scholarships/${scholarshipSlug}`}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/scholarships" className="hover:text-primary">Scholarships</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{title}</span>
        </nav>

        <Link to="/scholarships" className="inline-flex items-center text-sm text-primary mb-4 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Scholarships
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
            <p>{description || 'No additional details available for this scholarship.'}</p>
          </CardContent>
        </Card>

        {applyUrl && (
          <Button asChild>
            <a href={applyUrl} target="_blank" rel="noopener noreferrer">
              <GraduationCap className="w-4 h-4 mr-2" />
              Apply Now
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </Button>
        )}
      </div>
      <Footer />
    </Header>
  );
};

export default ScholarshipDetailPage;
