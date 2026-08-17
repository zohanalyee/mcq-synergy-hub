import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { safeMarkdownComponents } from "@/components/SafeMarkdownLink";
import { Clock, BookOpen, Building, ListChecks, Loader2, ShieldCheck, Play, Gauge } from "lucide-react";

import Header from "@/components/Header";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import SEOHead from "@/components/SEOHead";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { ExamPageSchema } from "@/components/StructuredData";
import { JobTestsTab } from "@/components/mock-tests/JobTestsTab";
import { CustomSyllabusEditor } from "@/components/mock-tests/CustomSyllabusEditor";
import { RelatedMockTests } from "@/components/mock-tests/RelatedMockTests";
import { PeopleAlsoPrepareFor } from "@/components/mock-tests/PeopleAlsoPrepareFor";
import { CustomSyllabusGuideModal } from "@/components/mock-tests/CustomSyllabusGuideModal";
import { QuestionsPreview } from "@/components/mock-tests/QuestionsPreview";
import { getJobTests, JobTest } from "@/services/jobTestService";
import { jobTests as initialJobTests } from "@/data/jobTestsData";
import { resolveJobTestBySlug, toJobTestSlug } from "@/lib/jobTestSlug";

const BASE = "https://mcqsai.com";

const MockTestDetail = () => {
  const { slug = "" } = useParams();
  const [topStart, setTopStart] = useState<{
    start: (settings?: { difficulty?: "easy" | "medium" | "hard"; questionCount?: number }) => void;
    isGenerating: boolean;
  }>({
    start: () => {},
    isGenerating: false,
  });
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: dbJobTests = [], isLoading } = useQuery({
    queryKey: ["job-tests"],
    queryFn: getJobTests,
  });

  const allTests: JobTest[] = dbJobTests.length > 0
    ? dbJobTests
    : initialJobTests.map((t) => ({ ...t, id: String(t.id) }));

  const test = useMemo(() => resolveJobTestBySlug(slug, allTests), [slug, allTests]);

  if (isLoading) {
    return (
      <Header>
        <div className="flex items-center justify-center min-h-[40vh] gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading mock test…
        </div>
      </Header>
    );
  }

  if (!test) {
    return (
      <Header>
        <SEOHead title="Mock Test Not Found" noindex description="This mock test could not be found." />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Mock test not found</h1>
          <p className="text-muted-foreground">The test you are looking for may have moved.</p>
          <Link to="/mock-tests" className="text-primary font-medium">
            Browse all mock tests →
          </Link>
        </div>
      </Header>
    );
  }

  const canonicalSlug = toJobTestSlug(test, allTests);
  const url = `${BASE}/mock-tests/${canonicalSlug}`;
  const totalPct = test.syllabus.reduce((s, i) => s + (i.percentage || 0), 0) || 100;
  const lastUpdated = test.updated_at
    ? new Date(test.updated_at).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })
    : null;

  const metaTitle = test.seo_title?.trim()
    ? test.seo_title.trim()
    : `${test.title} Mock Test — Free Online Preparation`;
  const metaDescription = test.meta_description?.trim()
    ? test.meta_description.trim()
    : `Prepare for the ${test.title} test by ${test.organization} with free AI-powered mock tests. ` +
      `Official syllabus, subject weightage, and ${test.questions} practice MCQs in simple Pakistani exam English.`;

  // Factual FAQs derived from the test's own data (no invented claims).
  const subjectsList = test.syllabus.map((s) => s.topic).join(", ");

  // Contextual in-body links: same-organisation tests first, so authority flows
  // into sibling posts instead of dead-ending on this page.
  const siblingLinks = allTests
    .filter((t) => t.id !== test.id)
    .sort(
      (a, b) =>
        Number(b.organization === test.organization) - Number(a.organization === test.organization),
    )
    .slice(0, 3)
    .map((t) => ({
      to: `/mock-tests/${toJobTestSlug(t, allTests)}`,
      label: /mock test/i.test(t.title) ? t.title : `${t.title} Mock Test`,
    }));
  const faqs = [
    {
      question: `What subjects are included in the ${test.title} test?`,
      answer: `The official syllabus for the ${test.title} test by ${test.organization} covers: ${subjectsList}.`,
    },
    {
      question: `How long is the ${test.title} mock test?`,
      answer: `This mock test is set to ${test.duration} minutes with ${test.questions} multiple-choice questions, matching the official pattern.`,
    },
    {
      question: `Is the ${test.title} mock test free?`,
      answer: `Yes. You can practice the ${test.title} mock test for free on MCQsAI. Questions are generated in simple Pakistani exam English from the official syllabus.`,
    },
    {
      question: `Can I customise the syllabus for the ${test.title} test?`,
      answer: `Yes. You can adjust subject weightage or disable subjects. Sign in to save your custom syllabus; otherwise the official syllabus is used.`,
    },
  ];

  return (
    <Header>
      <CustomSyllabusGuideModal />
      <SEOHead
        title={metaTitle}
        description={metaDescription}
        keywords={test.keywords?.length ? test.keywords.join(", ") : undefined}
        url={url}
        type="article"
      />
      <ExamPageSchema
        name={`${test.title} Mock Test`}
        description={metaDescription}
        url={url}
        provider="MCQsAI"
        breadcrumbs={[
          { name: "Home", url: BASE },
          { name: "Mock Tests", url: `${BASE}/mock-tests` },
          { name: test.title, url },
        ]}
        faqs={faqs}
      />

      <div className="max-w-5xl mx-auto px-4 pt-4 pb-12 space-y-8">
        <PageBreadcrumb
          items={[
            { title: "Home", href: "/" },
            { title: "Mock Tests", href: "/mock-tests" },
            { title: test.title, href: `/mock-tests/${canonicalSlug}`, isCurrent: true },
          ]}
        />

        {/* Hero */}
        <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{test.title} Mock Test</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building className="h-4 w-4" />
            <span>{test.organization}</span>
          </div>
          <p className="text-base text-muted-foreground leading-relaxed">
            Practice for the <strong>{test.title}</strong> mock test based on the exam conducted by {test.organization}. This free,
            AI-powered mock test follows the official syllabus and prepares you with realistic, exam-style multiple-choice
            questions written in simple Pakistani exam English. Use it to build speed, check your weak areas, and improve
            your score before the real test.
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              size="lg"
              onClick={() => setConfirmOpen(true)}
              disabled={topStart.isGenerating}
              className="gap-2"
            >
              {topStart.isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-5 w-5" />
              )}
              {topStart.isGenerating ? "Starting…" : "Start Exam"}
            </Button>
          </div>

          {/* Start exam modal — select settings, then confirm */}
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ready to begin?</DialogTitle>
                <DialogDescription>
                  Choose your settings, then start the {test.title} mock test.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 py-2">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <Gauge className="h-3.5 w-3.5" /> Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                    className="min-h-[44px] w-full rounded-xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-black/40 backdrop-blur-xl shadow-elegant px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" /> Number of Questions
                  </label>
                  <select
                    value={String(questionCount)}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    className="min-h-[44px] w-full rounded-xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-black/40 backdrop-blur-xl shadow-elegant px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={String(n)}>{n} questions</option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="gap-2"
                  disabled={topStart.isGenerating}
                  onClick={() => {
                    setConfirmOpen(false);
                    topStart.start({ difficulty, questionCount });
                  }}
                >
                  <Play className="h-4 w-4" /> Start Exam
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.header>

        {/* About this test — admin/AI authored markdown rendered properly */}
        {test.description?.trim() && (
          <section aria-labelledby="about-heading" className="space-y-3">
            <h2 id="about-heading" className="text-lg font-semibold text-foreground">
              About the {test.title} Test
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:text-base prose-headings:font-semibold prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground rounded-xl border border-border bg-card/60 p-4">
              <ReactMarkdown components={safeMarkdownComponents}>
                {test.description}
              </ReactMarkdown>
            </div>
          </section>
        )}

        {/* Test pattern */}
        <section aria-labelledby="pattern-heading" className="space-y-3">

          <h2 id="pattern-heading" className="text-lg font-semibold text-foreground">
            Test Pattern
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card/60 p-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Duration
              </div>
              <p className="text-lg font-semibold text-foreground">{test.duration} min</p>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" /> Questions
              </div>
              <p className="text-lg font-semibold text-foreground">{test.questions}</p>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ListChecks className="h-3.5 w-3.5" /> Subjects
              </div>
              <p className="text-lg font-semibold text-foreground">{test.syllabus.length}</p>
            </div>
          </div>
        </section>

        {/* Official syllabus table */}
        <section aria-labelledby="syllabus-heading" className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 id="syllabus-heading" className="text-lg font-semibold text-foreground">
              Official Syllabus & Weightage
            </h2>
            <Badge className="gap-1">
              <ShieldCheck className="h-3 w-3" /> Official
            </Badge>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-3 py-2">Subject</th>
                  <th className="text-right font-medium px-3 py-2">Weightage</th>
                  <th className="text-right font-medium px-3 py-2">Approx. Questions</th>
                </tr>
              </thead>
              <tbody>
                {test.syllabus.map((item, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-3 py-2 text-foreground">{item.topic}</td>
                    <td className="px-3 py-2 text-right text-foreground">{item.percentage}%</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {Math.round(((item.percentage || 0) / totalPct) * test.questions)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Custom syllabus editor */}
        <section aria-labelledby="custom-heading" className="space-y-3">
          <h2 id="custom-heading" className="text-lg font-semibold text-foreground">
            Official vs Custom Syllabus
          </h2>
          <CustomSyllabusEditor
            jobTestId={test.id}
            officialSyllabus={test.syllabus}
            officialUpdatedAt={test.updated_at}
          />
        </section>

        {/* Start CTA — reuses the existing, tested generation flow */}
        <section aria-labelledby="start-heading" className="space-y-3">
          <h2 id="start-heading" className="text-lg font-semibold text-foreground">
            Start Your {test.title} Mock Test
          </h2>
          <JobTestsTab jobTests={[test]} onReady={setTopStart} />
        </section>

        {/* Questions preview — public MCQs with premium-locked answers */}
        <QuestionsPreview title={test.title} syllabus={test.syllabus} definitionId={(test as any).definition_id} />



        {/* People also prepare for — contextual internal linking */}
        <PeopleAlsoPrepareFor current={test} allTests={allTests} />

        {/* Related */}
        <RelatedMockTests current={test} allTests={allTests} />

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="space-y-3">
          <h2 id="faq-heading" className="text-lg font-semibold text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {faqs.map((f, i) => (
              <details key={i} className="rounded-xl border border-border bg-card/60 p-3">
                <summary className="cursor-pointer font-medium text-foreground text-sm">{f.question}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </Header>
  );
};

export default MockTestDetail;
