import { safeJsonLd } from '@/lib/jsonLd';
import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy } from 'lucide-react';
import { ALL_TOOLS, getRelatedTools } from '@/data/toolsData';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';
import { Helmet } from 'react-helmet-async';
import { SITE_ORIGIN, ogImageForPath } from '@/lib/seoUrls';

interface ToolWrapperProps {
  toolId: string;
  title: string;
  description: string;
  category?: string;
  children: ReactNode;
}

const ToolWrapper = ({ toolId, title, description, category, children }: ToolWrapperProps) => {
  const relatedTools = getRelatedTools(toolId, 4);
  const navigate = useNavigate();
  const toolData = ALL_TOOLS.find(t => t.id === toolId);
  const howToUse = toolData?.howToUse || [];
  const faq = toolData?.faq || [];

  // Enriched H1 + SEO title — keyword-rich without losing the "Free Online" cue.
  const h1 = `${title} — Free Online ${category || 'Tool'}`;
  const seoTitle = `${title} — Free Online ${category || 'Tool'}`;
  const seoDescription =
    toolData?.seoDescription ||
    `Use our free ${title.toLowerCase()} for instant results. ${description}. No signup, works in your browser.`;
  const toolUrl = toolData?.href ? `${SITE_ORIGIN}${toolData.href}` : undefined;
  // Tools category banner — absolute HTTPS apex URL (no redirect, crawler-safe).
  const ogImage = ogImageForPath('/tools');

  const webAppLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: title,
    description: seoDescription,
    url: toolUrl,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    provider: { '@type': 'Organization', name: 'MCQsAI', url: SITE_ORIGIN },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Tools', item: `${SITE_ORIGIN}/tools` },
      ...(category ? [{ '@type': 'ListItem', position: 2, name: category, item: `${SITE_ORIGIN}/tools?category=${encodeURIComponent(category)}` }] : []),
      { '@type': 'ListItem', position: category ? 3 : 2, name: title, item: toolUrl },
    ],
  };

  const faqLd = faq.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null;

  // HowTo schema — emitted only when steps exist. Distinct @type so it stacks
  // cleanly with WebApplication + FAQPage without triggering duplicate warnings.
  const howToLd = howToUse.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to use ${title}`,
    totalTime: 'PT1M',
    step: howToUse.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: `Step ${i + 1}`,
      text: s,
    })),
  } : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        url={toolUrl}
        image={ogImage}
      />
      <Helmet>
        <script type="application/ld+json">{safeJsonLd(webAppLd)}</script>
        <script type="application/ld+json">{safeJsonLd(breadcrumbLd)}</script>
        {faqLd && <script type="application/ld+json">{safeJsonLd(faqLd)}</script>}
        {howToLd && <script type="application/ld+json">{safeJsonLd(howToLd)}</script>}
      </Helmet>

      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/tools')}
        className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to All Tools
      </Button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground -mt-3">
        <Link to="/tools" className="hover:text-foreground transition-colors">
          Tools
        </Link>
        <span>/</span>
        {category && <><span>{category}</span><span>/</span></>}
        <span className="text-foreground font-medium">{title}</span>
      </nav>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{h1}</h1>
        <p className="text-muted-foreground mt-1">{seoDescription}</p>
      </motion.div>

      {/* Tool Content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <Card className="border-border/50">
          <CardContent className="p-4 sm:p-6">
            {children}
          </CardContent>
        </Card>
      </motion.div>

      {/* How to Use */}
      {howToUse.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">How to Use</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              {howToUse.map((step, i) => (
                <li key={i} className="text-sm leading-relaxed">{step}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* FAQ */}
      {faq.length > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faq.map((f, i) => (
                <details key={i} className="group rounded-lg border border-border/50 p-3 open:bg-accent/20">
                  <summary className="cursor-pointer text-sm font-medium text-foreground">{f.q}</summary>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* MCQ CTA — exam-contextual where the tool maps to a specific test prep flow */}
      {(() => {
        const examContext: Record<string, { label: string; url: string; sub: string }> = {
          'aggregate-calculator':      { label: 'Practice MDCAT MCQs Free →', url: '/exams/mdcat', sub: 'MDCAT past papers & topic-wise MCQs' },
          'merit-calculator':          { label: 'Practice MDCAT MCQs Free →', url: '/exams/mdcat', sub: 'Boost your aggregate with MDCAT practice' },
          'gpa-calculator':            { label: 'Practice Entry Test MCQs →', url: '/exams/ecat',  sub: 'ECAT & engineering test prep' },
          'cgpa-calculator':           { label: 'Practice Entry Test MCQs →', url: '/exams/ecat',  sub: 'ECAT & engineering test prep' },
          'age-calculator':            { label: 'Practice NTS MCQs Free →',   url: '/exams/nts',   sub: 'NTS, NAT & GAT MCQ banks' },
          'percentage-calculator':     { label: 'Practice FPSC MCQs Free →',  url: '/exams/fpsc',  sub: 'FPSC, PPSC & CSS preparation' },
          'pakistan-tax-calculator':   { label: 'Practice FPSC MCQs Free →',  url: '/exams/fpsc',  sub: 'FPSC, PPSC general knowledge MCQs' },
          'marks-calculator':          { label: 'Practice Board MCQs Free →', url: '/boards',      sub: '9th, 10th, 11th & 12th class MCQs' },
        };
        const cta = examContext[toolId] || { label: 'Explore MCQs →', url: '/subjects', sub: '10,000+ free practice questions for all subjects' };
        return (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">Students? Try our MCQ Platform!</p>
                <p className="text-sm text-muted-foreground">{cta.sub}</p>
              </div>
              <Button asChild size="sm">
                <Link to={cta.url}>{cta.label}</Link>
              </Button>
            </CardContent>
          </Card>
        );
      })()}

      {/* Related Tools */}
      {relatedTools.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Related Tools</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {relatedTools.map(tool => (
              <Link
                key={tool.id}
                to={tool.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-accent/30 transition-all text-center group"
              >
                <tool.icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-foreground">{tool.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const CopyButton = ({ text }: { text: string }) => (
  <Button
    variant="outline"
    size="sm"
    onClick={() => { navigator.clipboard.writeText(text); toast.success('Copied!'); }}
    className="gap-1.5"
  >
    <Copy className="h-3.5 w-3.5" /> Copy
  </Button>
);

export default ToolWrapper;
