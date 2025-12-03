
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-0">
              <div className="p-6">
                <div className="h-6 bg-muted rounded-md w-3/4 mb-3"></div>
                <div className="h-4 bg-muted rounded-md w-1/4 mb-4"></div>
                <div className="h-4 bg-muted rounded-md w-full mb-2"></div>
                <div className="h-4 bg-muted rounded-md w-full mb-2"></div>
                <div className="h-4 bg-muted rounded-md w-2/3 mb-4"></div>
                <div className="flex gap-2 mb-4">
                  <div className="h-6 bg-muted rounded-full w-16"></div>
                  <div className="h-6 bg-muted rounded-full w-20"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-muted rounded-md w-1/3"></div>
                  <div className="h-10 bg-muted rounded-md w-24"></div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {jobs.map((job, index) => (
          <JobCard key={job.id} job={job} index={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground/40" />
      <h3 className="mt-4 text-lg font-medium">No jobs found</h3>
      <p className="mt-2 text-muted-foreground">
        {searchQuery 
          ? "No jobs match your search criteria. Try adjusting your search."
          : "No jobs available at the moment."}
      </p>
    </div>
  );
};

export default JobsGrid;
