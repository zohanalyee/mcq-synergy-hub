import { Link } from "react-router-dom";
import { Sparkles, BookOpen, Clock } from "lucide-react";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import BrandMark from "@/components/BrandMark";
import { Button } from "@/components/ui/button";

/**
 * Ask-Document ("AI document Q&A") is temporarily disabled.
 *
 * The page stays reachable and indexable so existing links don't 404, but
 * there is no upload, no input and no AI call from this route while the
 * feature is being reworked. The `rag-search` edge function is also
 * kill-switched server-side so the capability cannot be invoked at all.
 */
const AskDocumentComingSoon = () => {
  return (
    <>
      <SEOHead
        title="Ask Your Documents — Coming Soon | MCQsAI"
        description="AI document Q&A is coming soon to MCQsAI. Meanwhile, practise free board MCQs, mock tests and AI-generated quizzes."
      />
      <Header>
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <BrandMark className="justify-center mb-4" />

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Coming Soon
            </span>

            <h1 className="text-2xl md:text-3xl font-bold mt-4 mb-2">
              Ask Your Documents — Coming Soon
            </h1>
            <p className="text-muted-foreground">
              We are rebuilding the AI document Q&amp;A experience to make it
              faster and more accurate. It is temporarily unavailable.
            </p>
            <p className="text-muted-foreground mt-2" lang="ur" dir="rtl">
              یہ فیچر عارضی طور پر بند ہے — جلد بہتر شکل میں واپس آ رہا ہے۔
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/mock-tests">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Try free mock tests
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/boards">
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  Browse board MCQs
                </Link>
              </Button>
            </div>
          </div>

          <section className="mt-8 rounded-2xl border border-border bg-muted/30 p-6">
            <h2 className="font-semibold mb-2">What you can use right now</h2>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>Free board and topic-wise MCQ practice — no signup needed</li>
              <li>Mock tests for jobs and entry tests</li>
              <li>Custom syllabus practice tests</li>
            </ul>
          </section>
        </main>
      </Header>
    </>
  );
};

export default AskDocumentComingSoon;
