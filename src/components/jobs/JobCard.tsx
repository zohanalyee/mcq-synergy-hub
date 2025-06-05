
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
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-1">{job.title}</h2>
          
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
          
          <p className="text-muted-foreground mb-5 whitespace-pre-wrap line-clamp-3">
            {job.description}
          </p>
          
          {job.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {job.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="px-2 py-1 text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-4 justify-between">
            {job.imageUrl && (
              <img 
                src={job.imageUrl} 
                alt="Job" 
                className="max-h-32 rounded-md object-cover" 
              />
            )}
            
            <div className="flex-1 flex justify-end">
              {job.fileUrl ? (
                <Button asChild>
                  <a href={job.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    View Details
                  </a>
                </Button>
              ) : (
                <Button variant="outline">View Details</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default JobCard;
