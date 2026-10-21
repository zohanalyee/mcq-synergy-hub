import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import SEOHead from "@/components/SEOHead";
import { NOT_FOUND_POPULAR_TESTS } from "@/lib/legacyRedirects";

const HUBS: Array<[string, string]> = [
  ["/exams/sts", "STS Test Preparation"],
  ["/exams/sthp", "Sukkur IBA STHP Guide"],
  ["/exams/nthp", "IBA Karachi NTHP Guide"],
  ["/exams", "All Exam Guides"],
];

/** Noindex "not found" page with next steps (search, popular tests, hubs). */
const NotFound = ({ title = "Page not found" }: { title?: string }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  useEffect(() => {
    console.warn("404: non-existent route:", location.pathname);
  }, [location.pathname]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/mock-tests?q=${encodeURIComponent(term)}` : "/mock-tests");
  };

  return (
    <Header>
      <SEOHead
        title="Page Not Found | MCQsAI"
        description="The page you are looking for does not exist. Explore MCQsAI for free MCQ practice for NTS, FPSC, PPSC, Matric, FSc exams."
        keywords=""
        noindex={true}
      />
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">This page may have moved. Find your test below.</p>
          <p className="text-sm text-muted-foreground" dir="rtl">یہ صفحہ موجود نہیں — نیچے اپنا ٹیسٹ تلاش کریں</p>
        </div>

        <form onSubmit={onSearch} className="flex gap-2" role="search">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search mock tests, e.g. Junior Clerk"
            aria-label="Search mock tests"
            className="min-h-[44px]"
          />
          <Button type="submit" className="min-h-[44px]">
            <Search className="h-4 w-4 mr-1" aria-hidden="true" /> Search
          </Button>
        </form>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Popular mock tests</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {NOT_FOUND_POPULAR_TESTS.map(([slug, label]) => (
              <Link
                key={slug}
                to={`/mock-tests/${slug}`}
                className="block rounded-xl border border-border bg-card p-3 min-h-[44px] text-sm font-medium text-foreground hover:border-primary/50 transition-colors"
              >
                {label} →
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">Exam guides</h2>
          <div className="flex flex-wrap gap-2">
            {HUBS.map(([to, label]) => (
              <Link key={to} to={to} className="rounded-full border border-border px-3 py-2 text-sm text-primary hover:bg-primary/10">
                {label}
              </Link>
            ))}
          </div>
        </section>

        <div className="text-center">
          <Button variant="outline" onClick={() => navigate("/")} className="min-h-[44px]">Back to home</Button>
        </div>
      </div>
    </Header>
  );
};

export default NotFound;
