
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import JobsHeader from "@/components/jobs/JobsHeader";
import JobsFilters from "@/components/jobs/JobsFilters";
import JobsGrid from "@/components/jobs/JobsGrid";
import { getContentByCategory } from "@/services/contentService";
import { ContentItem } from "@/interfaces/content";

const Jobs = () => {
  const [jobs, setJobs] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setIsLoading(true);
        const jobsData = await getContentByCategory("job");
        setJobs(jobsData);
      } catch (error) {
        console.error("Error loading jobs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadJobs();
  }, []);

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Header />
      <div className="container mx-auto px-4 pt-20 pb-12">
        <JobsHeader />
        <JobsFilters 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8"
        >
          <JobsGrid 
            jobs={filteredJobs}
            isLoading={isLoading}
            searchQuery={searchQuery}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Jobs;
