
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ContentItem } from "@/interfaces/content";

type AdminHeaderProps = {
  pendingCount: number;
  scholarshipCount: number;
  mcqCount: number;
  quizCount: number;
  totalCount: number;
};

const AdminHeader = ({
  pendingCount,
  scholarshipCount,
  mcqCount,
  quizCount,
  totalCount
}: AdminHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage content, question bank, subjects, topics, quizzes, and job tests.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="px-2 py-1 text-xs">
            <span className="text-primary font-semibold mr-1">
              {pendingCount}
            </span> Pending
          </Badge>
          <Badge variant="outline" className="px-2 py-1 text-xs">
            <span className="text-primary font-semibold mr-1">
              {mcqCount}
            </span> MCQs
          </Badge>
          <Badge variant="outline" className="px-2 py-1 text-xs">
            <span className="text-primary font-semibold mr-1">
              {quizCount}
            </span> Quizzes
          </Badge>
          <Badge variant="outline" className="px-2 py-1 text-xs">
            <span className="text-primary font-semibold mr-1">
              {totalCount}
            </span> Total
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminHeader;
