
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { ReactNode } from "react";

interface SubjectHeaderProps {
  title: string;
  purpose: string;
  color: string;
  icon: ReactNode;
  topicCount: number;
}

const SubjectHeader = ({ title, purpose, color, icon, topicCount }: SubjectHeaderProps) => {
  // Create a default icon if none is provided
  const displayIcon = icon || <FileText className="h-6 w-6" style={{ color: color || '#3b82f6' }} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-4"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-lg" style={{ backgroundColor: color ? `${color}20` : '#3b82f620' }}>
          {displayIcon}
        </div>
        <div>
          <h1 className="text-4xl font-bold">{title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-2">
            <FileText className="h-4 w-4" />
            <span>{purpose === "reading" ? "Reading Material" : "Practice Material"}</span>
            <span>•</span>
            <span>{topicCount} Topics</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SubjectHeader;
