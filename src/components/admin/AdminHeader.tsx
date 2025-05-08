
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
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Manage content, subjects, topics, quizzes, MCQs, and job tests.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="px-3 py-1.5">
            <span className="text-primary font-semibold text-lg mr-1.5">
              {pendingCount}
            </span> Pending
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5">
            <span className="text-primary font-semibold text-lg mr-1.5">
              {scholarshipCount}
            </span> Scholarships
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5">
            <span className="text-primary font-semibold text-lg mr-1.5">
              {mcqCount}
            </span> MCQs
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5">
            <span className="text-primary font-semibold text-lg mr-1.5">
              {quizCount}
            </span> Quizzes
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5">
            <span className="text-primary font-semibold text-lg mr-1.5">
              {totalCount}
            </span> Total
          </Badge>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminHeader;
