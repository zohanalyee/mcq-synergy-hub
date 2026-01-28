
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ContentItem } from "@/interfaces/content";
import JobCard from "./JobCard";

interface JobsGridProps {
  jobs: ContentItem[];
  isLoading: boolean;
  searchQuery: string;
}

const JobsGrid = ({ jobs, isLoading, searchQuery }: JobsGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, index) => (
          <Card key={index} className="animate-pulse rounded-2xl">
            <CardContent className="p-0">
              <div className="p-3">
                <div className="h-9 w-9 bg-muted rounded-xl mb-2"></div>
                <div className="h-3 bg-muted rounded-md w-3/4 mb-1"></div>
                <div className="h-2 bg-muted rounded-md w-1/2 mb-2"></div>
                <div className="h-2 bg-muted rounded-md w-full mb-1"></div>
                <div className="flex gap-1 mt-2">
                  <div className="h-4 bg-muted rounded-full w-10"></div>
                  <div className="h-4 bg-muted rounded-full w-12"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (jobs.length > 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
        {jobs.map((job, index) => (
          <JobCard key={job.id} job={job} index={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/40" />
      <h3 className="mt-2 text-sm font-medium">No jobs found</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {searchQuery 
          ? "No jobs match your search."
          : "No jobs available."}
      </p>
    </div>
  );
};

export default JobsGrid;
