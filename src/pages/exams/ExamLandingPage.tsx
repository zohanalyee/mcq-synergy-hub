import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { examsData } from '@/data/examData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, CheckCircle, Lightbulb, GraduationCap, Clock, Award, ExternalLink, ArrowRight } from 'lucide-react';
import NotFound from '@/pages/NotFound';

const ExamLandingPage = () => {
  const { examSlug } = useParams<{ examSlug: string }>();
  const navigate = useNavigate();
  const exam = examSlug ? examsData[examSlug] : null;

  if (!exam) return <NotFound />;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `${exam.name} Preparation Course`,
    description: exam.description,
    provider: {
      '@type': 'Organization',
      name: 'MCQsAI',
      url: 'https://mcqsai.com',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      instructor: { '@type': 'Organization', name: 'MCQsAI' },
    },
    about: exam.subjects.map(s => ({ '@type': 'Thing', name: s })),
    inLanguage: ['en', 'ur'],
    isAccessibleForFree: true,
  };

  return (
    <Header>
      <SEOHead
        title={exam.metaTitle}
        description={exam.metaDescription}
        keywords={exam.keywords}
        url={`https://mcqsai.com/exams/${exam.slug}`}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{exam.name} Preparation</span>
        </nav>

        {/* Hero */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <GraduationCap className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {exam.name} Preparation
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl">{exam.fullName}</p>
          <p className="mt-4 text-muted-foreground leading-relaxed">{exam.description}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: BookOpen, label: 'Exam Body', value: exam.examBody },
            { icon: Clock, label: 'Duration', value: exam.duration },
            { icon: Award, label: 'Total Marks', value: exam.totalMarks },
            { icon: GraduationCap, label: 'Frequency', value: exam.frequency },
          ].map(stat => (
            <Card key={stat.label} className="text-center">
              <CardContent className="pt-4 pb-3">
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-sm font-semibold text-foreground mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Subjects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Subjects Covered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {exam.subjects.map(subject => (
                    <div key={subject} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-medium text-foreground">{subject}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Eligibility */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Eligibility Criteria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {exam.eligibility.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Preparation Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {exam.tips.map((tip, i) => (
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
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-3">Start Practicing</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Practice {exam.name} MCQs with AI-powered tests and track your progress.
                </p>
                <Button className="w-full mb-2" onClick={() => navigate('/boards')}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Browse MCQs
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/mock-tests')}>
                  Take Mock Test
                </Button>
              </CardContent>
            </Card>

            {exam.officialUrl && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-foreground mb-2">Official Website</h3>
                  <a
                    href={exam.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    Visit {exam.examBody}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-3">Other Exams</h3>
                <div className="space-y-2">
                  {Object.values(examsData)
                    .filter(e => e.slug !== exam.slug)
                    .map(e => (
                      <Link
                        key={e.slug}
                        to={`/exams/${e.slug}`}
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {e.name} – {e.fullName}
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

export default ExamLandingPage;
