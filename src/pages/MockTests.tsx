import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import SEOHead from '@/components/SEOHead';
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { jobTests as initialJobTests } from "@/data/jobTestsData";
import PageHeader from "@/components/ui/PageHeader";
import { Timer } from "lucide-react";
import ExamFiltersBar, { ExamFilters } from "@/components/mock-tests/ExamFilters";
import { JobTestsTab } from "@/components/mock-tests/JobTestsTab";
import { getJobTests } from "@/services/jobTestService";

const CompetitiveExams = () => {
  const [searchQuery, setSearchQuery] = useState("");
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

  return (
    <Header>
      <SEOHead
        title="Competitive Exam Mock Tests | MCQSAI"
        description="Free competitive exam mock tests for FPSC, PPSC, NTS, FIA, ASF and other recruitment exams. Practice with AI-powered, timed mock tests and official syllabus coverage."
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
            tagline="AI-powered Competitive Exam Mock Tests"
            description="AI-powered Competitive Exam Mock Tests for FPSC, PPSC, NTS, FIA, ASF and more."
          />

          <ExamFiltersBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFiltersChange={setFilters}
            jobTests={jobTests}
          />

          <div className="mt-6">
            <JobTestsTab jobTests={filteredTests} />
          </div>
        </div>
      </div>
    </Header>
  );
};

export default CompetitiveExams;
