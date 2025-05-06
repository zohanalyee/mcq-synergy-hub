
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { ContentStatus } from "@/interfaces/content";

interface StatusBadgeProps {
  status: ContentStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case "approved":
      return <Badge variant="default" className="bg-green-600">Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    case "pending":
      return <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-600">Pending</Badge>;
    default:
      return null;
  }
};

export default StatusBadge;
