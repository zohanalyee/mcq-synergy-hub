import { useState, useEffect } from "react";
import SEOHead from '@/components/SEOHead';
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import JobsHeader from "@/components/jobs/JobsHeader";
import GlassJobsFilters from "@/components/jobs/GlassJobsFilters";
import JobsGrid from "@/components/jobs/JobsGrid";
import { getContentByCategory } from "@/services/contentService";
import { getApprovedOpportunities } from "@/services/externalOpportunitiesService";
import { ContentItem } from "@/interfaces/content";
import { ExternalOpportunity, ExternalOpportunityFilters } from "@/types/externalOpportunities";
import ExternalOpportunitiesSection from "@/components/external/ExternalOpportunitiesSection";

const Jobs = () => {
  const [jobs, setJobs] = useState<ContentItem[]>([]);
  const [externalJobs, setExternalJobs] = useState<ExternalOpportunity[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [externalFilters, setExternalFilters] = useState<ExternalOpportunityFilters>({
    sector: 'all',
    region: 'all'
  });

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setIsLoading(true);
        const [jobsData, externalData] = await Promise.all([
          getContentByCategory("job"),
          getApprovedOpportunities("job", externalFilters)
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
  }, [externalFilters]);

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
      <SEOHead
        title="Latest Jobs in Pakistan"
        description="Find latest government and private job opportunities in Pakistan. PPSC, FPSC, NTS job listings and application details."
        keywords="Pakistan jobs, government jobs, PPSC jobs, FPSC jobs, NTS jobs, career opportunities"
      />
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-10 overflow-x-hidden">
        <PageBreadcrumb items={[{ title: 'Jobs', href: '/jobs', isCurrent: true }]} showHomeButton={true} />
        <JobsHeader />
        
        {/* Glass Search & Filter Bar */}
        <div className="mt-4">
          <GlassJobsFilters 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={externalFilters}
            onFiltersChange={setExternalFilters}
          />
        </div>
        
        {/* Full-width Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6"
        >
          <JobsGrid 
            jobs={filteredJobs}
            isLoading={isLoading}
            searchQuery={searchQuery}
            hideEmptyState={filteredExternalJobs.length > 0}
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
