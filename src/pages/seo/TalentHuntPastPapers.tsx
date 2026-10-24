import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import NotFound from '@/pages/NotFound';
import { safeJsonLd } from '@/lib/jsonLd';
import { getPastPaperPage } from '@/lib/pastPapers';
import { getPracticePdfByExam } from '@/lib/practicePdfs';
import { trackPdfDownload } from '@/lib/growthEvents';
import { Button } from '@/components/ui/button';
import { FileDown, PlayCircle, BookOpen, ExternalLink } from 'lucide-react';

const H2 = ({ children }: { children: import('react').ReactNode }) => (
  <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">{children}</h2>
);

/** Honest "past papers" guide for NTHP / STHP (/nthp-past-papers, /sthp-past-papers). */
const TalentHuntPastPapers = ({ exam }: { exam: 'nthp' | 'sthp' }) => {
  const page = getPastPaperPage(exam);
  const pdf = getPracticePdfByExam(exam);
  if (!page || !pdf) return <NotFound />;
  const path = `/${page.slug}`;

  return (
    <Header>
      <SEOHead title={page.title} description={page.description} url={path} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: page.faqs.map((q) => ({ '@type': 'Question', name: q.question, acceptedAnswer: { '@type': 'Answer', text: q.answer } })),
          }),
        }}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Exams', path: '/exams' },
          { name: page.examLabel, path: pdf.hub.to },
          { name: 'Past Papers', path },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        <nav className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link><span className="mx-2">/</span>
          <Link to="/exams" className="hover:text-primary">Exams</Link><span className="mx-2">/</span>
          <Link to={pdf.hub.to} className="hover:text-primary">{page.examLabel}</Link><span className="mx-2">/</span>
          <span className="text-foreground">Past Papers</span>
        </nav>

        <header className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">{page.h1}</h1>
          {page.intro.map((t) => <p key={t.slice(0, 24)} className="text-muted-foreground leading-relaxed">{t}</p>)}
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg"><a href="#solved"><FileDown className="w-4 h-4 mr-2" />Free solved papers</a></Button>
            <Button asChild variant="outline" size="lg"><Link to={pdf.mockTest.to}><PlayCircle className="w-4 h-4 mr-2" />Free mock test</Link></Button>
          </div>
        </header>

        <section className="rounded-lg border p-4 space-y-3">
          <H2>{page.officialHeading}</H2>
          {page.officialStatus.map((t) => <p key={t.slice(0, 24)} className="text-sm text-muted-foreground leading-relaxed">{t}</p>)}
          <ul className="space-y-1 text-sm">
            {page.official.map((s) => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">{s.label}<ExternalLink className="w-3 h-3" /></a></li>
            ))}
          </ul>
        </section>

        <section id="solved" className="scroll-mt-20">
          <H2>Free solved and explained {page.examLabel} practice papers</H2>
          <p className="text-sm text-muted-foreground mb-3">
            Original MCQsAI practice papers based on the published syllabus. Each has 50 questions, an answer key and a short explanation for every answer. Unofficial — not {exam === 'nthp' ? 'IBA Karachi' : 'Sukkur IBA'} papers.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {pdf.sets.map((s) => (
              <div key={s.key} className="rounded-lg border p-4 flex flex-col gap-2">
                <p className="font-semibold text-foreground">{page.examLabel} Practice Paper — {s.label}</p>
                <p className="text-sm text-muted-foreground flex-1">{s.sections.map((x) => `${x.count} ${x.section}`).join(' · ')}</p>
                <Button asChild size="sm">
                  <a href={s.file} download onClick={() => trackPdfDownload(exam, 'past_papers', s.key)}><FileDown className="w-4 h-4 mr-2" />Download {s.label}</a>
                </Button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm"><Link to={`/pdf/${pdf.slug}`} className="text-primary hover:underline">See sample questions from the {page.examLabel} practice papers</Link></p>
        </section>

        <section>
          <H2>Free {page.examLabel} mock test online</H2>
          <p className="text-sm text-muted-foreground mb-3">After a practice paper, take the timed online test. You get your score, the correct answers and explanations right away.</p>
          <Button asChild><Link to={pdf.mockTest.to}><PlayCircle className="w-4 h-4 mr-2" />{pdf.mockTest.label}</Link></Button>
        </section>

        <section>
          <H2>What about an {page.examLabel} guess paper?</H2>
          <p className="text-sm text-muted-foreground leading-relaxed">{page.guess}</p>
        </section>

        <section>
          <H2>How to use solved papers well</H2>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Solve one practice paper in about 60 minutes without looking at the answers.</li>
            <li>Check the answer key and read the explanation for every wrong or guessed answer.</li>
            <li>Write down the weak topics and revise them from your textbook.</li>
            <li>Take the online mock test to see if your score improves.</li>
            <li>Repeat with the next set to practise new questions.</li>
          </ol>
        </section>

        <section>
          <H2>Frequently asked questions</H2>
          <div className="space-y-4">
            {page.faqs.map((f) => (
              <div key={f.question}>
                <h3 className="text-sm font-semibold text-foreground">{f.question}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.answer}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm flex flex-wrap gap-4">
            <Link to={pdf.hub.to} className="text-primary hover:underline inline-flex items-center gap-1"><BookOpen className="w-4 h-4" />{pdf.hub.label}</Link>
            <Link to={`/pdf/${pdf.slug}`} className="text-primary hover:underline">{page.examLabel} practice questions PDF</Link>
            <Link to="/exams" className="text-primary hover:underline">All admission tests</Link>
          </p>
        </section>

        <p className="text-xs text-muted-foreground border-t pt-4">{page.disclaimer}</p>
      </div>
      <Footer />
    </Header>
  );
};

export default TalentHuntPastPapers;
