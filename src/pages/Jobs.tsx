import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import JobsHeader from "@/components/jobs/JobsHeader";
import JobsFilters from "@/components/jobs/JobsFilters";
import JobsGrid from "@/components/jobs/JobsGrid";
import { getContentByCategory } from "@/services/contentService";
import { getApprovedOpportunities } from "@/services/externalOpportunitiesService";
import { ContentItem } from "@/interfaces/content";
import { ExternalOpportunity } from "@/types/externalOpportunities";
import ExternalOpportunitiesSection from "@/components/external/ExternalOpportunitiesSection";

const Jobs = () => {
  const [jobs, setJobs] = useState<ContentItem[]>([]);
  const [externalJobs, setExternalJobs] = useState<ExternalOpportunity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setIsLoading(true);
        const [jobsData, externalData] = await Promise.all([
          getContentByCategory("job"),
          getApprovedOpportunities("job")
        ]);
        setJobs(jobsData);
        setExternalJobs(externalData);
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

  const filteredExternalJobs = externalJobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.organization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Header>
      <div className="container mx-auto px-4 pt-4 pb-10">
        <JobsHeader />
        <JobsFilters 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4"
        >
          <JobsGrid 
            jobs={filteredJobs}
            isLoading={isLoading}
            searchQuery={searchQuery}
          />
        </motion.div>

        {/* External Opportunities Section */}
        <ExternalOpportunitiesSection 
          opportunities={filteredExternalJobs}
          isLoading={isLoading}
          type="job"
        />
      </div>
    </Header>
  );
};

export default Jobs;
