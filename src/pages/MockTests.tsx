import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import SEOHead from '@/components/SEOHead';
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { jobTests as initialJobTests } from "@/data/jobTestsData";
import PageHeader from "@/components/ui/PageHeader";
import { Timer, Landmark, ArrowRight } from "lucide-react";
import ExamFiltersBar, { ExamFilters } from "@/components/mock-tests/ExamFilters";
import { JobTestsTab } from "@/components/mock-tests/JobTestsTab";
import { getJobTests } from "@/services/jobTestService";
import AdSlot from "@/components/ads/AdSlot";
import WhatsAppChannelCTA from "@/components/WhatsAppChannelCTA";

const CompetitiveExams = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState<ExamFilters>({ organization: 'all', duration: 'all' });
  const [isLoaded, setIsLoaded] = useState(false);

  const { data: dbJobTests = [] } = useQuery({
    queryKey: ["job-tests"],
    queryFn: getJobTests,
  });

  const jobTests = dbJobTests.length > 0 ? dbJobTests : initialJobTests.map(t => ({ ...t, id: String(t.id) }));

  useEffect(() => { setIsLoaded(true); }, []);

  const filteredTests = jobTests.filter(test => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        test.title.toLowerCase().includes(q) ||
        test.description.toLowerCase().includes(q) ||
        test.organization.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    if (filters.organization !== 'all' && test.organization !== filters.organization) return false;
    if (filters.duration !== 'all') {
      const dur = parseInt(filters.duration);
      if (dur === 60 && test.duration > 60) return false;
      if (dur === 90 && (test.duration <= 60 || test.duration > 90)) return false;
      if (dur === 120 && test.duration <= 90) return false;
    }
    return true;
  });

  // High-demand / upcoming tests pinned to the top (lower index = higher).
  const PINNED = [/talent hunt program \(sthp\)/i, /teaching license exam - elementary/i, /junior office associate/i];
  const pinRank = (title: string) => {
    const i = PINNED.findIndex(r => r.test(title));
    return i === -1 ? PINNED.length : i;
  };
  const sortedTests = [...filteredTests].sort((a, b) => pinRank(a.title) - pinRank(b.title));

  return (
    <Header>
      <SEOHead
        title="Mock Tests | Free Online Exam Preparation"
        description="Free mock tests for FPSC, PPSC, NTS, FIA, ASF and more. Practice with AI-powered, timed mock tests and official syllabus coverage."
      />
      <div className="container mx-auto px-4 pt-4 pb-8 max-w-7xl">
        <PageBreadcrumb
          items={[
            { title: "Home", href: "/" },
            { title: "Mock Tests", href: "/mock-tests", isCurrent: true }
          ]}
        />
        <div className="mt-6">
          <PageHeader
            title="Mock Tests"
            icon={Timer}
            colorTheme="cyan"
            tagline="AI-powered Mock Tests"
            description="AI-powered Mock Tests for FPSC, PPSC, NTS, FIA, ASF and more."
          />

          <ExamFiltersBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFiltersChange={setFilters}
            jobTests={jobTests}
          />

          <Link
            to="/exams/sts"
            className="group mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 hover:border-primary transition-colors"
          >
            <div className="flex items-start gap-3">
              <Landmark className="w-6 h-6 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">STS (SIBA Testing Services) Test Hub</p>
                <p className="text-xs text-muted-foreground">
                  Preparing for Sindh Police, Sindh High Court or Sukkur IBA Community Colleges &amp; Schools posts (EST, HST, support staff)? All STS-conducted mock tests in one place.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary whitespace-nowrap">
              Explore STS Hub <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>

          <WhatsAppChannelCTA message="📢 Daily past papers, answer keys aur test updates ke liye hamara WhatsApp Channel follow karein." />

          <div className="mt-6">
            <JobTestsTab jobTests={sortedTests} />
          </div>

          {/* Ad sits below the list so an unfilled unit never pushes tests off-screen. */}
          <AdSlot surface="hub" />
        </div>
      </div>
    </Header>
  );
};

export default CompetitiveExams;
