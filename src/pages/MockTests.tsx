import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import SEOHead from '@/components/SEOHead';
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { jobTests as initialJobTests } from "@/data/jobTestsData";
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
    <>
      <SEOHead
        title="Competitive Exam Practice Tests | MCQs AI"
        description="Practice for competitive exams including FPSC, PPSC, NTS, and more with AI-powered mock tests."
      />
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <PageBreadcrumb
          items={[
            { title: "Home", href: "/" },
            { title: "Competitive Exams" }
          ]}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.5 }}
          className="mt-6"
        >
          <h1 className="text-3xl font-bold mb-2">Competitive Exam Practice</h1>
          <p className="text-muted-foreground mb-6">
            Prepare for Pakistan's top competitive exams with AI-powered practice tests
          </p>

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
        </motion.div>
      </div>
    </>
  );
};

export default CompetitiveExams;
