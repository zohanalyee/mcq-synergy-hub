import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import RelatedContent from '@/components/seo/related/RelatedContent';
import NotFound from '@/pages/NotFound';
import { getProgEntry, isProgEntryIndexable } from '@/data/programmaticSeo';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, MapPin, GraduationCap, FileText, Calendar } from 'lucide-react';

/**
 * /p/:slug — programmatic SEO template.
 * Unknown slug → 404 (no thin pages).
 * Quality below threshold → noindex (set in registry).
 */
const ProgrammaticLandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const entry = slug ? getProgEntry(slug) : null;
  if (!entry) return <NotFound />;

  const url = `https://mcqsai.com/p/${entry.slug}`;
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entry.faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: entry.title,
    description: entry.metaDescription,
    provider: { '@type': 'Organization', name: 'MCQsAI', url: 'https://mcqsai.com' },
    inLanguage: 'en-PK',
    isAccessibleForFree: true,
    dateModified: entry.lastUpdated,
  };

  const allowIndex = isProgEntryIndexable(entry);
  return (
    <Header>
      <SEOHead
        title={entry.title}
        description={entry.metaDescription}
        keywords={entry.keywords}
        url={url}
        noindex={!allowIndex}
      />

      <BreadcrumbSchema items={[
        { name: 'Home', path: '/' },
        { name: 'Guides', path: '/p' },
        { name: entry.title.split('—')[0].trim(), path: `/p/${entry.slug}` },
      ]} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(courseJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <article className="container mx-auto max-w-4xl px-4 py-8">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Updated {new Date(entry.lastUpdated).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{entry.title}</h1>
          <p className="text-base text-muted-foreground leading-relaxed">{entry.intro}</p>
        </header>

        {entry.syllabusOrEligibility && entry.syllabusOrEligibility.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-primary" /> Syllabus / Eligibility
            </h2>
            <ul className="space-y-1 list-disc pl-6 text-sm">
              {entry.syllabusOrEligibility.map(s => <li key={s}>{s}</li>)}
            </ul>
          </section>
        )}

        {entry.universitiesOrInstitutions && entry.universitiesOrInstitutions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
              <GraduationCap className="h-5 w-5 text-primary" /> Universities & Institutions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entry.universitiesOrInstitutions.map(u => (
                <Card key={u.name}>
                  <CardContent className="pt-4">
                    <p className="font-semibold text-sm">{u.name}</p>
                    {u.note && <p className="text-xs text-muted-foreground mt-1">{u.note}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {entry.testCentres && entry.testCentres.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-primary" /> Test Centres
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 list-disc pl-6 text-sm">
              {entry.testCentres.map(c => <li key={c}>{c}</li>)}
            </ul>
          </section>
        )}

        {entry.meritOrCutoff && entry.meritOrCutoff.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Merit & Cutoffs</h2>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {entry.meritOrCutoff.map((m, i) => (
                    <tr key={m.label} className={i % 2 ? 'bg-muted/40' : ''}>
                      <td className="px-3 py-2 font-medium">{m.label}</td>
                      <td className="px-3 py-2 text-primary font-semibold">{m.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Historical merit data — actual cutoffs vary year to year.</p>
          </section>
        )}

        {entry.domicile && (
          <section className="mb-8 p-4 bg-muted/40 rounded-lg border border-border">
            <h2 className="text-base font-semibold mb-2">Domicile Requirements</h2>
            <p className="text-sm text-muted-foreground">{entry.domicile}</p>
          </section>
        )}

        {entry.prepResources && entry.prepResources.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Preparation Resources</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {entry.prepResources.map(r => (
                <Link
                  key={r.path}
                  to={r.path}
                  className="flex items-center justify-between gap-2 p-3 border border-border rounded-lg hover:bg-accent/50 hover:border-primary/40 transition-colors group"
                >
                  <span className="text-sm font-medium">{r.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {entry.faqs.map(f => (
              <details key={f.q} className="border border-border rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-sm">{f.q}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {entry.relatedSlug && (
          <RelatedContent entitySlug={entry.relatedSlug} title="Continue Preparing" />
        )}
      </article>
      <Footer />
    </Header>
  );
};

export default ProgrammaticLandingPage;
