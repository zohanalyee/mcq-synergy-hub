import { safeJsonLd } from '@/lib/jsonLd';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, BookOpen, RefreshCw, Users, AlertTriangle, Mail } from 'lucide-react';

const UPDATED = '2026-05-24';

const sections = [
  {
    icon: BookOpen,
    title: 'Sourcing & Accuracy',
    body: 'All MCQs, syllabi, and exam-prep content are sourced from official board notifications (FBISE, BISE boards), HEC, PMC, and verified past papers. Where AI assists drafting, every item passes human editorial review before publication.',
  },
  {
    icon: Users,
    title: 'Authorship & Expertise',
    body: 'Content is produced by Pakistani educators with subject specialisation in MDCAT, ECAT, CSS, PPSC, NTS, and 9th–12th board syllabi. Bylines on long-form blog posts identify the responsible author. The MCQsAI Editorial Team is the default attributed publisher for question banks and tools.',
  },
  {
    icon: RefreshCw,
    title: 'Corrections & Updates',
    body: 'Reported errors are reviewed within 7 working days. Verified corrections are published with a visible "Last updated" date. We do not silently overwrite material facts — syllabus changes, merit-cutoff revisions, and exam-date shifts are stamped explicitly on the affected page.',
  },
  {
    icon: ShieldCheck,
    title: 'Independence & Funding',
    body: 'MCQsAI is independently operated. We are not paid by any university, coaching academy, or testing service to publish or favour content. Affiliate or partnership links, if any, will be clearly disclosed inline.',
  },
  {
    icon: AlertTriangle,
    title: 'AI Disclosure',
    body: 'Some long-form explanations and study guides are generated with AI assistance (Gemini), then reviewed by editors. Practice MCQs are either drawn from verified past-paper banks or generated against approved syllabi with human review. AI is never used to fabricate exam dates, merit data, or scholarship eligibility.',
  },
  {
    icon: Mail,
    title: 'Report a Concern',
    body: 'Email hello@mcqsai.com with the page URL and the specific issue. We acknowledge within 48 hours and publish corrections transparently.',
  },
];

const EditorialPolicy = () => {
  const url = 'https://mcqsai.com/editorial-policy';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Editorial Policy',
    url,
    dateModified: UPDATED,
    publisher: { '@type': 'EducationalOrganization', name: 'MCQsAI', url: 'https://mcqsai.com' },
    about: 'Editorial standards, sourcing, corrections, AI disclosure, and independence policy for MCQsAI.',
  };

  return (
    <Header>
      <SEOHead
        title="Editorial Policy"
        description="MCQsAI editorial standards — sourcing, authorship, corrections, AI disclosure, and independence. Built on verified Pakistani exam material."
        keywords="MCQsAI editorial policy, content standards, corrections policy, AI disclosure"
        url={url}
      />
      <BreadcrumbSchema items={[
        { name: 'Home', path: '/' },
        { name: 'Editorial Policy', path: '/editorial-policy' },
      ]} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <article className="container mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Last updated {new Date(UPDATED).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Editorial Policy</h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            How MCQsAI sources, reviews, and corrects content — and where AI fits in the workflow.
          </p>
        </header>

        <div className="space-y-6">
          {sections.map(({ icon: Icon, title, body }) => (
            <section key={title} className="p-5 rounded-lg border border-border bg-card">
              <h2 className="flex items-center gap-2 text-lg font-semibold mb-2">
                <Icon className="h-5 w-5 text-primary" /> {title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </section>
          ))}
        </div>

        <section className="mt-10 p-5 rounded-lg bg-muted/40 border border-border text-sm text-muted-foreground">
          <p>
            For business or press enquiries, contact{' '}
            <a href="mailto:hello@mcqsai.com" className="text-primary hover:underline">hello@mcqsai.com</a>.
          </p>
        </section>
      </article>
      <Footer />
    </Header>
  );
};

export default EditorialPolicy;
