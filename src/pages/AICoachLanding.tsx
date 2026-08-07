import { safeJsonLd } from '@/lib/jsonLd';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Brain,
  MessageSquare,
  Target,
  TrendingUp,
  RefreshCw,
  Sparkles,
  BookOpen,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

const URL = 'https://mcqsai.com/features/ai-coach';

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Conversational Guidance',
    desc: 'Ask questions in plain English or Urdu and get step-by-step study guidance, concept explanations, and next-step recommendations.',
  },
  {
    icon: Target,
    title: 'Weak-Area Detection',
    desc: 'Your coach analyses every test attempt to pinpoint the exact subjects and topics holding your score back.',
  },
  {
    icon: TrendingUp,
    title: 'Personalized Recommendations',
    desc: 'Get a tailored plan of what to practice next — the right topics, difficulty, and number of questions for your goal exam.',
  },
  {
    icon: RefreshCw,
    title: 'Spaced Repetition',
    desc: 'The coach schedules smart revisions so you review weak topics at the perfect interval and stop forgetting.',
  },
  {
    icon: Brain,
    title: 'Progress Intelligence',
    desc: 'Track accuracy, speed, and subject-wise mastery over time with a dashboard built for exam aspirants.',
  },
  {
    icon: BookOpen,
    title: 'Exam-Aligned Coaching',
    desc: 'Guidance mapped to MDCAT, ECAT, CSS, PPSC, FPSC, NTS and board exams — Pakistan-specific, syllabus-aware.',
  },
];

const FAQS = [
  {
    q: 'What is the MCQsAI AI Study Coach?',
    a: 'It is a free AI-powered study coach for Pakistani exam aspirants. Through natural conversation it guides your preparation, detects weak areas from your test results, recommends what to study next, and schedules spaced-repetition revisions.',
  },
  {
    q: 'Is the AI Coach free to use?',
    a: 'Yes. The AI Study Coach is free for students preparing for MDCAT, ECAT, CSS, PPSC, FPSC, NTS and board exams. Sign in to save your progress and get personalized recommendations.',
  },
  {
    q: 'Which exams does the AI Coach support?',
    a: 'It supports Pakistan\u2019s major entrance and competitive exams (MDCAT, ECAT, CSS, PPSC, FPSC, NTS) as well as BISE/FBISE board exams for Class 9 to 12.',
  },
  {
    q: 'How does the AI Coach personalize my study plan?',
    a: 'It analyses your test attempts to find weak subjects and topics, then recommends the exact topics, difficulty level, and question count to practice next, and reinforces them with spaced repetition.',
  },
];

const AICoachLanding = () => {
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MCQsAI AI Study Coach',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    url: URL,
    description:
      'A free AI-powered study coach for Pakistani exam aspirants that gives conversational guidance, detects weak areas, recommends what to study next, and schedules spaced-repetition revisions.',
    inLanguage: ['en', 'ur'],
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'PKR' },
    featureList: FEATURES.map((f) => f.title),
    provider: {
      '@type': 'Organization',
      name: 'MCQsAI',
      url: 'https://mcqsai.com',
    },
  };
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <Header>
      <SEOHead
        title="AI Study Coach for Pakistan Exams"
        description="Free AI study coach for MDCAT, ECAT, CSS, PPSC, FPSC & NTS. Conversational guidance, weak-area detection, personalized recommendations & spaced repetition — MCQsAI."
        keywords="AI study coach Pakistan, AI exam coach, personalized study plan, MDCAT AI coach, CSS preparation coach, MCQsAI AI coach"
        url={URL}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', path: '/' },
          { name: 'Features', path: '/features/ai-coach' },
          { name: 'AI Study Coach', path: '/features/ai-coach' },
        ]}
      />
      <Helmet>
        <script type="application/ld+json">{safeJsonLd(softwareJsonLd)}</script>
        <script type="application/ld+json">{safeJsonLd(faqJsonLd)}</script>
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">AI Study Coach</span>
        </nav>

        {/* Hero */}
        <section className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Your flagship AI advantage
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            AI Study Coach for Pakistan Exams
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Meet your personal AI Study Coach — it talks to you, understands your weak areas from
            every test, tells you exactly what to practice next, and keeps you on track for MDCAT,
            ECAT, CSS, PPSC, FPSC, NTS and board exams.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Button asChild size="lg">
              <Link to="/ai-coach">
                <Brain className="w-4 h-4 mr-2" />
                Open your AI Coach
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/get-started">Try free</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            What your AI Coach does
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <Card key={f.title}>
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Take a test', desc: 'Practice any MCQ test or mock exam on MCQsAI.' },
              { step: '2', title: 'Coach analyses you', desc: 'Your AI Coach detects weak subjects and topics from your results.' },
              { step: '3', title: 'Follow your plan', desc: 'Get personalized next steps and spaced-repetition revisions.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto mb-3">
                  {s.step}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Explore more */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground text-center mb-6">
            Start practicing with your coach
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: 'Browse MCQs by board', to: '/boards' },
              { label: 'Take a mock test', to: '/mock-tests' },
              { label: 'Explore exam prep', to: '/exams' },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="flex items-center justify-between gap-2 p-4 border border-border rounded-lg hover:bg-accent/50 hover:border-primary/40 transition-colors group"
              >
                <span className="text-sm font-medium text-foreground">{l.label}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <details key={f.q} className="border border-border rounded-lg p-4">
                <summary className="cursor-pointer font-medium text-sm text-foreground flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {f.q}
                </summary>
                <p className="mt-2 pl-6 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </Header>
  );
};

export default AICoachLanding;
