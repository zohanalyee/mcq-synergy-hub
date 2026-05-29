import { useState, useEffect } from "react";
import SEOHead from '@/components/SEOHead';
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import PageHeader from "@/components/ui/PageHeader";
import { Briefcase } from "lucide-react";
import GlassJobsFilters from "@/components/jobs/GlassJobsFilters";
import JobsGrid from "@/components/jobs/JobsGrid";
import { getContentByCategory } from "@/services/contentService";
import { sortContentOpportunities } from "@/lib/opportunitySorting";
import { getApprovedOpportunities } from "@/services/externalOpportunitiesService";
import { ContentItem } from "@/interfaces/content";
import { ExternalOpportunity, ExternalOpportunityFilters } from "@/types/externalOpportunities";
import ExternalOpportunitiesSection from "@/components/external/ExternalOpportunitiesSection";
import RelatedContent from "@/components/seo/related/RelatedContent";

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

  const filteredJobs = sortContentOpportunities(
    jobs.filter(job =>
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredExternalJobs = externalJobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.organization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Header>
      <SEOHead
        title="Latest Government Jobs in Pakistan 2026 — PPSC, FPSC, NTS"
        description="Browse latest Pakistan government & private jobs: PPSC, FPSC, NTS vacancies with eligibility, deadlines and apply links. Updated daily."
        keywords="Pakistan jobs 2026, government jobs Pakistan, PPSC jobs, FPSC jobs, NTS jobs, latest vacancies"
      />
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-10 overflow-x-hidden">
        <PageBreadcrumb items={[{ title: 'Jobs', href: '/jobs', isCurrent: true }]} showHomeButton={true} />
        <PageHeader
          title="Jobs"
          icon={Briefcase}
          colorTheme="emerald"
          tagline="Government & private sector openings"
          description="Discover the latest job opportunities across Pakistan — updated daily from official portals."
        />
        
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

        <RelatedContent entitySlug="jobs-hub" title="Related Exam Prep" limit={6} />
      </div>
    </Header>
  );
};

export default Jobs;
