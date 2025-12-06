
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
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="h-full"
    >
      <Card className="h-full glass-card hover:shadow-md transition-shadow rounded-lg flex flex-col">
        <CardContent className="p-3 flex flex-col flex-1">
          <h2 className="text-sm font-semibold mb-1 line-clamp-1 break-words">{job.title}</h2>
          
          <div className="flex flex-wrap items-center text-muted-foreground text-xs mb-2 gap-1.5">
            <span className="flex items-center">
              <Calendar className="h-3 w-3 mr-0.5" />
              {formatDate(job.deadline)}
            </span>
            
            {job.department && (
              <span className="flex items-center bg-accent/10 text-accent px-1.5 py-0 rounded-full text-[10px]">
                <Building className="h-2.5 w-2.5 mr-0.5" />
                {job.department}
              </span>
            )}
            
            {job.governmentLevel && (
              <span className="bg-primary/10 text-primary px-1.5 py-0 rounded-full text-[10px]">
                {job.governmentLevel}
              </span>
            )}
          </div>
          
          <p className="text-muted-foreground text-xs mb-2 line-clamp-2 break-words flex-1">
            {job.description}
          </p>
          
          {job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {job.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[10px] truncate max-w-[80px]">
                  {tag}
                </Badge>
              ))}
              {job.tags.length > 2 && (
                <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                  +{job.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-end mt-auto pt-2 border-t border-border/30">
            {job.fileUrl ? (
              <Button size="sm" className="h-7 text-xs" asChild>
                <a href={job.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  View
                </a>
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="h-7 text-xs">View</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default JobCard;
