
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-0">
              <div className="p-3">
                <div className="h-4 bg-muted rounded-md w-3/4 mb-1.5"></div>
                <div className="h-2.5 bg-muted rounded-md w-1/4 mb-2"></div>
                <div className="h-2.5 bg-muted rounded-md w-full mb-1"></div>
                <div className="h-2.5 bg-muted rounded-md w-2/3 mb-2"></div>
                <div className="flex gap-1 mb-2">
                  <div className="h-4 bg-muted rounded-full w-12"></div>
                  <div className="h-4 bg-muted rounded-full w-14"></div>
                </div>
                <div className="flex justify-end">
                  <div className="h-7 bg-muted rounded-md w-16"></div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
