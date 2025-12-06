
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/contexts/UserRoleContext";
import QuickSubmissionDialog from "@/components/admin/QuickSubmissionDialog";

interface JobsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

const JobsFilters = ({ searchQuery, onSearchChange }: JobsFiltersProps) => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();

  return (
    <div className="mt-3 flex flex-col sm:flex-row gap-2">
      <div className="flex-1 relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 h-9 text-sm glass-card"
        />
      </div>
      {isAdmin && (
        <div className="flex gap-1.5">
          <QuickSubmissionDialog 
            category="job" 
            buttonText="Add Job"
          />
        </div>
      )}
    </div>
  );
};

export default JobsFilters;
