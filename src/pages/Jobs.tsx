
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { ContentItem } from "@/interfaces/content";
import { getContentByCategory } from "@/services/contentService";
import JobsHeader from "@/components/jobs/JobsHeader";
import JobsFilters from "@/components/jobs/JobsFilters";
import JobsGrid from "@/components/jobs/JobsGrid";

const Jobs = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchJobs = () => {
      try {
        const items = getContentByCategory('job');
        console.log("Fetched jobs:", items);
        setJobs(items);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load jobs. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJobs();
  }, []);
  
  const filteredJobs = jobs.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.department && item.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.governmentLevel && item.governmentLevel.toLowerCase().includes(searchQuery.toLowerCase())) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const breadcrumbItems = [
    { title: "Home", href: "/" },
    { title: "Jobs", href: "/jobs", isCurrent: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 mx-auto pt-28 pb-16">
        <PageBreadcrumb items={breadcrumbItems} />
        <JobsHeader />
        <JobsFilters 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery} 
        />
        <div className="mt-12">
          <JobsGrid 
            jobs={filteredJobs} 
            isLoading={isLoading} 
            searchQuery={searchQuery} 
          />
        </div>
      </div>
    </div>
  );
};

export default Jobs;
