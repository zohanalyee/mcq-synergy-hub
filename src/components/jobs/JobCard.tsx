import { Calendar, ExternalLink, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ContentItem } from "@/interfaces/content";
import { GlassCard, getCardTheme } from "@/components/ui/GlassCard";

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

  // Get theme based on job type or department
  const theme = getCardTheme(
    job.governmentLevel || job.department || job.title
  );

  const handleClick = () => {
    if (job.fileUrl) {
      window.open(job.fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <GlassCard
      title={job.title}
      subtitle={formatDate(job.deadline)}
      icon={<Briefcase />}
      actionText={job.fileUrl ? "APPLY NOW" : "VIEW DETAILS"}
      themeColor={theme.main}
      pastelColor={theme.pastel}
      onClick={handleClick}
    >
      {/* Description */}
      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
        {job.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {job.department && (
          <Badge
            variant="secondary"
            className="px-1.5 py-0 text-[9px] bg-white/60 dark:bg-slate-800/60"
          >
            {job.department}
          </Badge>
        )}
        {job.governmentLevel && (
          <Badge
            variant="outline"
            className="px-1.5 py-0 text-[9px] border-white/50"
          >
            {job.governmentLevel}
          </Badge>
        )}
        {job.tags.slice(0, 1).map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="px-1.5 py-0 text-[9px] truncate max-w-[60px] bg-white/60 dark:bg-slate-800/60"
          >
            {tag}
          </Badge>
        ))}
      </div>
    </GlassCard>
  );
};

export default JobCard;
