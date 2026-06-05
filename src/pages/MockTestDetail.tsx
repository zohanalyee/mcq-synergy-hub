import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Clock, BookOpen, Building, ListChecks, Loader2, ShieldCheck, Play } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Badge } from "@/components/ui/badge";
import { ExamPageSchema } from "@/components/StructuredData";
import { JobTestsTab } from "@/components/mock-tests/JobTestsTab";
import { CustomSyllabusEditor } from "@/components/mock-tests/CustomSyllabusEditor";
import { RelatedMockTests } from "@/components/mock-tests/RelatedMockTests";
import { CustomSyllabusGuideModal } from "@/components/mock-tests/CustomSyllabusGuideModal";
import { getJobTests, JobTest } from "@/services/jobTestService";
import { jobTests as initialJobTests } from "@/data/jobTestsData";
import { resolveJobTestBySlug, toJobTestSlug } from "@/lib/jobTestSlug";

const BASE = "https://mcqsai.com";

const MockTestDetail = () => {
  const { slug = "" } = useParams();
  const [topStart, setTopStart] = useState<{ start: () => void; isGenerating: boolean }>({
    start: () => {},
    isGenerating: false,
  });

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

  const metaTitle = `${test.title} Mock Test — Free Online Preparation`;
  const metaDescription =
    `Prepare for the ${test.title} test by ${test.organization} with free AI-powered mock tests. ` +
    `Official syllabus, subject weightage, and ${test.questions} practice MCQs in simple Pakistani exam English.`;

  // Factual FAQs derived from the test's own data (no invented claims).
  const subjectsList = test.syllabus.map((s) => s.topic).join(", ");
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
      <SEOHead title={metaTitle} description={metaDescription} url={url} type="article" />
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
            Practice for the <strong>{test.title}</strong> recruitment test conducted by {test.organization}. This free,
            AI-powered mock test follows the official syllabus and prepares you with realistic, exam-style multiple-choice
            questions written in simple Pakistani exam English. Use it to build speed, check your weak areas, and improve
            your score before the real test.
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">Last updated: {lastUpdated}</p>
          )}
          <div className="pt-1">
            <Button
              size="lg"
              onClick={() => topStart.start()}
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
        </motion.header>

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
