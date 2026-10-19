import { Link, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import NotFound from '@/pages/NotFound';
import { safeJsonLd } from '@/lib/jsonLd';
import { useWhatsAppChannel } from '@/hooks/useWhatsAppChannel';
import { getPracticePdf, pdfShareUrl, CHANNEL_FALLBACK, PDF_VERIFIED_ON } from '@/lib/practicePdfs';
import { trackPdfDownload, trackPdfShare, trackChannelJoin } from '@/lib/growthEvents';
import { Button } from '@/components/ui/button';
import { FileDown, PlayCircle, MessageCircle, Share2, ExternalLink } from 'lucide-react';

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">{children}</h2>
);

const PracticePdfLanding = () => {
  const { slug } = useParams();
  const pdf = getPracticePdf(slug);
  const { data: channel } = useWhatsAppChannel();
  if (!pdf) return <NotFound />;
  const total = pdf.sections.reduce((n, s) => n + s.count, 0);
  const channelUrl = channel || CHANNEL_FALLBACK;

  return (
    <Header>
      <SEOHead title={pdf.title} description={pdf.description} url={`/pdf/${pdf.slug}`} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: pdf.faqs.map((q) => ({ '@type': 'Question', name: q.question, acceptedAnswer: { '@type': 'Answer', text: q.answer } })),
          }),
        }}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Exams', path: '/exams' },
          { name: pdf.examLabel, path: pdf.hub.to },
          { name: 'Practice Questions PDF', path: `/pdf/${pdf.slug}` },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        <nav className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link><span className="mx-2">/</span>
          <Link to="/exams" className="hover:text-primary">Exams</Link><span className="mx-2">/</span>
          <Link to={pdf.hub.to} className="hover:text-primary">{pdf.examLabel}</Link><span className="mx-2">/</span>
          <span className="text-foreground">Practice Questions PDF</span>
        </nav>

        <header className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">{pdf.h1}</h1>
          {pdf.intro.map((t) => <p key={t.slice(0, 20)} className="text-muted-foreground leading-relaxed">{t}</p>)}
        </header>

        <section className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href={pdf.file} download onClick={() => trackPdfDownload(pdf.exam, 'landing')}><FileDown className="w-4 h-4 mr-2" />Download free PDF</a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to={pdf.mockTest.to}><PlayCircle className="w-4 h-4 mr-2" />Take the full online practice test</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={channelUrl} rel="noopener" onClick={() => trackChannelJoin('pdf_landing')}><MessageCircle className="w-4 h-4 mr-2" />Join WhatsApp channel</a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={pdfShareUrl(pdf)} rel="noopener" onClick={() => trackPdfShare(pdf.exam, 'landing')}><Share2 className="w-4 h-4 mr-2" />Share on WhatsApp</a>
          </Button>
        </section>

        <section>
          <H2>What is in the {pdf.examLabel} practice set</H2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left"><tr><th className="p-3">Section</th><th className="p-3">Questions</th></tr></thead>
              <tbody>
                {pdf.sections.map((s) => <tr key={s.section} className="border-t"><td className="p-3">{s.section}</td><td className="p-3">{s.count}</td></tr>)}
                <tr className="border-t font-medium"><td className="p-3">Total</td><td className="p-3">{total}</td></tr>
                <tr className="border-t"><td className="p-3">Answer key</td><td className="p-3">Included, with explanations</td></tr>
                <tr className="border-t"><td className="p-3">Suggested time</td><td className="p-3">About 60 minutes</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <H2>{pdf.exam === 'nthp' ? 'NTHP MCQs PDF preview: 5 sample questions' : 'STHP sample questions preview'}</H2>
          <ol className="space-y-4">
            {pdf.preview.map((q, i) => (
              <li key={q.q} className="rounded-lg border p-4">
                <p className="font-medium text-foreground">{i + 1}. {q.q}</p>
                <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-muted-foreground">
                  {q.options.map((o, j) => <li key={o}>{String.fromCharCode(65 + j)}. {o}</li>)}
                </ul>
                <p className="mt-2 text-sm"><strong className="text-foreground">Answer:</strong> {q.answer} — {q.why}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <H2>Frequently asked questions</H2>
          <div className="space-y-4">
            {pdf.faqs.map((f) => (
              <div key={f.question}>
                <h3 className="text-sm font-semibold text-foreground">{f.question}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <H2>Official sources</H2>
          <ul className="space-y-1 text-sm">
            {pdf.official.map((s) => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">{s.label}<ExternalLink className="w-3 h-3" /></a></li>
            ))}
          </ul>
          {PDF_VERIFIED_ON && <p className="mt-3 text-xs text-muted-foreground">Verified on {PDF_VERIFIED_ON}.</p>}
          <p className="mt-4 text-sm flex flex-wrap gap-4">
            <Link to={pdf.hub.to} className="text-primary hover:underline">{pdf.hub.label}</Link>
            <Link to={pdf.mockTest.to} className="text-primary hover:underline">{pdf.mockTest.label}</Link>
            <Link to="/exams" className="text-primary hover:underline">All admission tests</Link>
          </p>
        </section>

        <p className="text-xs text-muted-foreground border-t pt-4">{pdf.disclaimer}</p>
      </div>
      <Footer />
    </Header>
  );
};

export default PracticePdfLanding;
