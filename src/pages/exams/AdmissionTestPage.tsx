import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { safeJsonLd } from '@/lib/jsonLd';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  Table as TableIcon,
} from 'lucide-react';

export interface OfficialSource {
  label: string;
  url: string;
}

export interface PatternRow {
  section: string;
  detail: string;
  weight?: string;
}

export interface AdmissionTestPageProps {
  slug: string;
  name: string;
  fullName: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  intro: string;
  examBody: string;
  duration: string;
  totalMarks: string;
  frequency: string;
  /** Official date line — say "Not yet announced" when no notice exists. */
  testDate: string;
  subjects: string[];
  pattern?: PatternRow[];
  patternNote?: string;
  eligibility: string[];
  keyDates?: { event: string; value: string }[];
  tips: string[];
  officialUrl: string;
  officialSources: OfficialSource[];
  verifiedOn: string;
  relatedLinks: { label: string; to: string }[];
  mockTest?: { label: string; to: string; note: string };
}

const AdmissionTestPage = (p: AdmissionTestPageProps) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `${p.name} Preparation`,
    description: p.intro,
    url: `https://mcqsai.com/exams/${p.slug}`,
    provider: { '@type': 'Organization', name: 'MCQsAI', url: 'https://mcqsai.com' },
    about: p.subjects.map((s) => ({ '@type': 'Thing', name: s })),
    inLanguage: ['en', 'ur'],
    isAccessibleForFree: true,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      instructor: { '@type': 'Organization', name: 'MCQsAI' },
    },
  };

  return (
    <Header>
      <SEOHead
        title={p.metaTitle}
        description={p.metaDescription}
        keywords={p.keywords}
        url={`https://mcqsai.com/exams/${p.slug}`}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Admission Tests', path: '/exams' },
          { name: p.name, path: `/exams/${p.slug}` },
        ]}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/exams" className="hover:text-primary">Admission Tests</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{p.name}</span>
        </nav>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <GraduationCap className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{p.name}</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl">{p.fullName}</p>
          <p className="mt-4 text-muted-foreground leading-relaxed">{p.intro}</p>
          <p className="mt-4 text-sm font-medium text-foreground">
            Test date: <span className="text-primary">{p.testDate}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: BookOpen, label: 'Exam Body', value: p.examBody },
            { icon: Clock, label: 'Duration', value: p.duration },
            { icon: Award, label: 'Total Marks / MCQs', value: p.totalMarks },
            { icon: GraduationCap, label: 'Frequency', value: p.frequency },
          ].map((s) => (
            <Card key={s.label} className="text-center">
              <CardContent className="pt-4 pb-3">
                <s.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-sm font-semibold text-foreground mt-1">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Subjects Covered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {p.subjects.map((s) => (
                    <div key={s} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-medium text-foreground">{s}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {p.pattern && p.pattern.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TableIcon className="w-5 h-5 text-primary" />
                    Paper Pattern &amp; Weightage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-semibold text-foreground">Section</th>
                          <th className="text-left py-2 font-semibold text-foreground">Detail</th>
                          <th className="text-left py-2 font-semibold text-foreground">Weightage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.pattern.map((r) => (
                          <tr key={r.section} className="border-b last:border-0">
                            <td className="py-2 font-medium text-foreground">{r.section}</td>
                            <td className="py-2 text-muted-foreground">{r.detail}</td>
                            <td className="py-2 text-muted-foreground">{r.weight || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {p.patternNote && (
                    <p className="mt-3 text-xs text-muted-foreground">{p.patternNote}</p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Eligibility Criteria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {p.eligibility.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {p.keyDates && p.keyDates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Official Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        {p.keyDates.map((d) => (
                          <tr key={d.event} className="border-b last:border-0">
                            <td className="py-2 text-muted-foreground pr-4">{d.event}</td>
                            <td className="py-2 font-medium text-foreground">{d.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Preparation Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {p.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Official Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {p.officialSources.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {s.label}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  All facts on this page were read from the official sources above and verified on{' '}
                  {p.verifiedOn}. Where an official notice does not state something yet, this page
                  says “not yet announced” instead of guessing.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <h2 className="font-semibold text-foreground mb-3 text-base">Start Practicing</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Practice {p.name} style MCQs free and track your weak areas.
                </p>
                <Button asChild className="w-full mb-2">
                  <Link to="/boards">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Browse MCQs
                  </Link>
                </Button>
                {p.mockTest ? (
                  <Button asChild variant="outline" className="w-full">
                    <Link to={p.mockTest.to}>{p.mockTest.label}</Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/mock-tests">Take a Mock Test</Link>
                  </Button>
                )}
                {p.mockTest?.note && (
                  <p className="mt-2 text-xs text-muted-foreground">{p.mockTest.note}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h2 className="font-semibold text-foreground mb-2 text-base">Official Website</h2>
                <a
                  href={p.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Visit {p.examBody}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h2 className="font-semibold text-foreground mb-3 text-base">Related Exams</h2>
                <div className="space-y-2">
                  {p.relatedLinks.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </Header>
  );
};

export default AdmissionTestPage;
