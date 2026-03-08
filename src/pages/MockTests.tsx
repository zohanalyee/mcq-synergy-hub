
import { useState, useEffect } from "react";
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
  const [jobTests, setJobTests] = useState(initialJobTests);
  
  useEffect(() => {
    const managedJobTests = getJobTests();
    if (managedJobTests.length > 0) {
      setJobTests(managedJobTests);
    }
    setIsLoaded(true);
  }, []);

  // Apply all filters
  const filteredTests = jobTests.filter(test => {
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        test.title.toLowerCase().includes(q) ||
        test.description.toLowerCase().includes(q) ||
        test.organization.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    // Organization
    if (filters.organization !== 'all' && test.organization !== filters.organization) return false;
    // Duration
    if (filters.duration !== 'all') {
      if (filters.duration === 'short' && test.duration > 90) return false;
      if (filters.duration === 'medium' && (test.duration <= 90 || test.duration > 120)) return false;
      if (filters.duration === 'long' && test.duration <= 120) return false;
    }
    return true;
  });
  
  return (
    <Header>
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-center"
        >
          <h1 className="text-xl font-bold mb-1 text-gradient">Competitive Exams</h1>
          <p className="text-xs text-muted-foreground max-w-xl mx-auto">
            Practice full-length job recruitment and competitive exam simulations.
          </p>
        </motion.div>

        <div className="mb-4">
          <ExamFiltersBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFiltersChange={setFilters}
            jobTests={jobTests}
          />
        </div>

        <JobTestsTab 
          jobTests={filteredTests}
          isLoaded={isLoaded}
          searchQuery=""
        />
      </div>
    </Header>
  );
};

export default CompetitiveExams;
