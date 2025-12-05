
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="h-5 bg-muted rounded-md w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded-md w-1/4 mb-3"></div>
                <div className="h-3 bg-muted rounded-md w-full mb-1.5"></div>
                <div className="h-3 bg-muted rounded-md w-2/3 mb-3"></div>
                <div className="flex gap-1.5 mb-3">
                  <div className="h-5 bg-muted rounded-full w-14"></div>
                  <div className="h-5 bg-muted rounded-full w-16"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-muted rounded-md w-1/3"></div>
                  <div className="h-8 bg-muted rounded-md w-20"></div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {jobs.map((job, index) => (
          <JobCard key={job.id} job={job} index={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="text-center py-10">
      <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/40" />
      <h3 className="mt-3 text-base font-medium">No jobs found</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {searchQuery 
          ? "No jobs match your search criteria."
          : "No jobs available at the moment."}
      </p>
    </div>
  );
};

export default JobsGrid;
