
import { Badge } from "@/components/ui/badge";
import { Briefcase, Calendar, FileText, GraduationCap } from "lucide-react";

interface CategoryBadgeProps {
  category: string;
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  switch (category) {
    case "scholarship":
      return (
        <Badge className="flex items-center space-x-1">
          <GraduationCap className="h-3 w-3" />
          <span>Scholarship</span>
        </Badge>
      );
    case "job":
      return (
        <Badge className="flex items-center space-x-1">
          <Briefcase className="h-3 w-3" />
          <span>Job</span>
        </Badge>
      );
    case "mcq":
      return <Badge>MCQ</Badge>;
    case "past_paper":
      return (
        <Badge className="flex items-center space-x-1">
          <FileText className="h-3 w-3" />
          <span>Past Paper</span>
        </Badge>
      );
    default:
      return <Badge>{category}</Badge>;
  }
};

export default CategoryBadge;
