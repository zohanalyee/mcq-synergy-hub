import { motion } from "framer-motion";
import { Shield } from "lucide-react";

type AdminHeaderProps = {
  pendingCount: number;
  scholarshipCount: number;
  mcqCount: number;
  quizCount: number;
  totalCount: number;
};

const AdminHeader = ({
  pendingCount,
  mcqCount,
  quizCount,
  totalCount,
}: AdminHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
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
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            {pendingCount} Pending
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {mcqCount} MCQs
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
            {quizCount} Quizzes
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            {totalCount} Total
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminHeader;
