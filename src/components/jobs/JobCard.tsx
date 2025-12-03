
import { motion } from "framer-motion";
import { Calendar, ExternalLink, Building } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContentItem } from "@/interfaces/content";

interface JobCardProps {
  job: ContentItem;
  index: number;
}

const JobCard = ({ job, index }: JobCardProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="h-full"
    >
      <Card className="h-full border-primary/20 shadow-sm hover:shadow-md transition-shadow rounded-xl flex flex-col">
        <CardContent className="p-4 flex flex-col flex-1">
          <h2 className="text-lg font-semibold mb-1 line-clamp-2 break-words">{job.title}</h2>
          
          <div className="flex flex-wrap items-center text-muted-foreground text-sm mb-3 gap-3">
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Deadline: {formatDate(job.deadline)}
            </span>
            
            {job.department && (
              <span className="flex items-center bg-accent/10 text-accent px-2 py-0.5 rounded-full text-xs">
                <Building className="h-3 w-3 mr-1" />
                {job.department}
              </span>
            )}
            
            {job.governmentLevel && (
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                {job.governmentLevel}
              </span>
            )}

            {job.cadre && (
              <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded-full text-xs">
                {job.cadre}
              </span>
            )}
          </div>
          
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2 break-words flex-1">
            {job.description}
          </p>
          
          {job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {job.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="px-2 py-0.5 text-xs truncate max-w-[100px]">
                  {tag}
                </Badge>
              ))}
              {job.tags.length > 3 && (
                <Badge variant="outline" className="px-2 py-0.5 text-xs">
                  +{job.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-end mt-auto pt-3 border-t border-border/50">
            {job.fileUrl ? (
              <Button size="sm" asChild>
                <a href={job.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View
                </a>
              </Button>
            ) : (
              <Button size="sm" variant="outline">View</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default JobCard;
