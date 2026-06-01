import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { PROGRAMMATIC_SEO, isProgEntryIndexable } from '@/data/programmaticSeo';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

/**
 * /p — hub index for the programmatic SEO landing pages.
 * Lists every indexable /p/:slug guide so the route is itself indexable
 * (was previously a 404 → noindex) and provides internal links.
 */
const ProgrammaticIndex = () => {
  const entries = Object.values(PROGRAMMATIC_SEO)
    .filter(isProgEntryIndexable)
    .sort((a, b) => a.title.localeCompare(b.title));

  const url = 'https://mcqsai.com/p';

  return (
    <Header>
      <SEOHead
        title="Exam & Career Guides — City-Wise Test Prep"
        description="Browse MCQsAI's city-wise and exam-wise guides: MDCAT, ECAT, NTS, PPSC, FPSC, CSS test centres, merit, eligibility and free MCQ practice across Pakistan."
        keywords="MDCAT guides, ECAT guides, NTS test centres, PPSC jobs, FPSC jobs, CSS exam, Pakistan exam preparation guides"
        url={url}
      />
      <BreadcrumbSchema items={[
        { name: 'Home', path: '/' },
        { name: 'Guides', path: '/p' },
      ]} />

      <article className="container mx-auto max-w-4xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Exam & Career Preparation Guides
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            City-wise and exam-wise guides covering test centres, eligibility, merit trends
            and free MCQ practice for Pakistan's top entry tests and government recruitment exams.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {entries.map(e => (
            <Link
              key={e.slug}
              to={`/p/${e.slug}`}
              className="flex items-center justify-between gap-3 p-4 border border-border rounded-lg hover:bg-accent/50 hover:border-primary/40 transition-colors group"
            >
              <span className="text-sm font-medium leading-snug">{e.title.split('—')[0].trim()}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
            </Link>
          ))}
        </div>

        {entries.length === 0 && (
          <Card className="mt-6">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Guides are being prepared. Please check back soon.
            </CardContent>
          </Card>
        )}
      </article>
      <Footer />
    </Header>
  );
};

export default ProgrammaticIndex;
