
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { jobTests as initialJobTests } from "@/data/jobTestsData";
import { EnhancedSearchBox } from "@/components/mock-tests/EnhancedSearchBox";
import { JobTestsTab } from "@/components/mock-tests/JobTestsTab";
import { getJobTests } from "@/services/jobTestService";

const CompetitiveExams = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [jobTests, setJobTests] = useState(initialJobTests);
  
  useEffect(() => {
    // Load job tests from localStorage if available, otherwise use initial data
    const managedJobTests = getJobTests();
    if (managedJobTests.length > 0) {
      setJobTests(managedJobTests);
    }
    
    setIsLoaded(true);
  }, []);
  
  const handleClearSearch = () => {
    setSearchQuery("");
  };
  
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
          <EnhancedSearchBox
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            onClearSearch={handleClearSearch}
            placeholder="Search exams, organizations, or job positions..."
          />
        </div>

        <JobTestsTab 
          jobTests={jobTests}
          isLoaded={isLoaded}
          searchQuery={searchQuery}
        />
      </div>
    </Header>
  );
};

export default CompetitiveExams;
